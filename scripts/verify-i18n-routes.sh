#!/usr/bin/env bash
# Acceptance criteria of i18n-foundation / i18n-content against the real build.
# No `set -u`: the Bash tool's shell snapshot references unbound vars
# and would abort the script.
set -eo pipefail

PORT="${PORT:-4932}"
BASE="http://127.0.0.1:${PORT}"
BODY_FILE=/tmp/i18n-body
SERVER_PID=""

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

# Fail if the port is already taken so we do not validate a foreign process.
if curl -sf "${BASE}/robots.txt" > /dev/null 2>&1; then
  fail "port ${PORT} already serves something; pick a free PORT"
fi

stop_server() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
}

start_server() {
  stop_server
  HOST=0.0.0.0 PORT="$PORT" node ./dist/server/entry.mjs &
  SERVER_PID=$!

  sleep 1
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    fail "the server died on startup. Port ${PORT} is probably taken"
  fi

  local ready=0
  for _ in $(seq 1 30); do
    curl -sf "${BASE}/robots.txt" > /dev/null && { ready=1; break; }
    sleep 1
  done
  if [ "$ready" != 1 ]; then
    fail "the server never became ready on ${BASE}"
  fi
}

trap 'stop_server' EXIT

expect_status() {
  local path="$1" expected="$2"
  local status
  status=$(curl -s -o "$BODY_FILE" -w '%{http_code}' "${BASE}${path}")
  if [ "$status" != "$expected" ]; then
    fail "${path} answered ${status}, expected ${expected}"
  fi
  echo "OK ${path} → ${status}"
}

expect_body() {
  local path="$1" marker="$2"
  expect_status "$path" 200
  grep -q "$marker" "$BODY_FILE" || fail "${path} body does not contain '${marker}'"
  echo "OK ${path} contains '${marker}'"
}

expect_absent() {
  local path="$1" marker="$2"
  if grep -q "$marker" "$BODY_FILE"; then
    fail "${path} body contains '${marker}'"
  fi
  echo "OK ${path} omits '${marker}'"
}

expect_content_type() {
  local path="$1" expected_type="$2" marker="$3"
  expect_status "$path" 200
  local ctype
  ctype=$(curl -s -o /dev/null -w '%{content_type}' "${BASE}${path}")
  case "$ctype" in
    *"$expected_type"*) ;;
    *) fail "${path} content-type is '${ctype}', expected '${expected_type}'" ;;
  esac
  grep -q "$marker" "$BODY_FILE" || fail "${path} body does not contain '${marker}'"
  echo "OK ${path} (${ctype})"
}

# Count href="/en/portfolio/<slug>" and href="/en/lab/<slug>" across both listing
# pages. The AI-view corner link (/ia) is not a case.
count_en_case_links() {
  local portfolio_body lab_body
  portfolio_body=$(curl -sf "${BASE}/en/portfolio") || fail "/en/portfolio did not answer 200"
  lab_body=$(curl -sf "${BASE}/en/lab") || fail "/en/lab did not answer 200"
  local count
  count=$(printf '%s\n%s\n' "$portfolio_body" "$lab_body" \
    | grep -oE 'href="/en/(portfolio|lab)/[a-z0-9-]+"' \
    | grep -vE '/ia"' \
    | sort -u \
    | wc -l)
  count=$(echo "$count" | tr -d ' ')
  if [ "$count" != "28" ]; then
    fail "/en/portfolio + /en/lab have ${count} case links, expected 28"
  fi
  echo "OK /en/portfolio + /en/lab → ${count} case links"
}

# Draft English slugs must not appear as navigable hrefs on /en/posts (production).
assert_en_posts_omit_draft_hrefs() {
  expect_status /en/posts 200
  local draft
  for draft in \
    aeo-vs-seo-is-seo-dead \
    automate-your-own-problems \
    noctalia-v4-to-v5-both-shells \
    blog-comments-without-page-weight \
    seven-review-rounds-when-to-stop \
    agent-session-that-came-back-empty \
    skills-repo-for-four-agents \
    screen-recording-to-gif-shortcut \
    ai-designer-put-rules-in-copy \
    site-is-on-version-17
  do
    expect_absent /en/posts "href=\"/en/${draft}\""
  done
  echo "OK /en/posts omits draft hrefs"
}

check_en_published() {
  for path in /en /en/about /en/contact /en/resume /en/mcp /en/setup /en/now /en/privacy /en/posts /en/portfolio /en/lab; do
    expect_body "$path" '<html lang="en"'
  done

  expect_body /sobre 'hreflang="en"'
  expect_body /en/rss.xml '<language>en</language>'
  expect_content_type /en/about.md 'text/markdown' 'title:'
}

# --- production build: EN_LIVE=true, /en must serve ---
echo "== production build (EN_LIVE=true) =="
npm run build
start_server

check_en_published
count_en_case_links
assert_en_posts_omit_draft_hrefs
expect_body /sitemap.xml 'xmlns:xhtml'

# --- staging build: /en stays live (same surface as production now) ---
echo "== staging build (EN published) =="
stop_server
npm run build -- --mode staging
start_server

check_en_published

echo "I18N ROUTES PASSED"
