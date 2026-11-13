#!/usr/bin/env bash
# Acceptance criteria of i18n-foundation against the real build.
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

# --- production build: EN_LIVE=false, /en must 404 ---
echo "== production build (EN_LIVE=false) =="
npm run build
start_server

for path in /en /en/about /en/the-anything; do
  expect_status "$path" 404
done

expect_status /sobre 200
expect_absent /sobre 'hreflang'
expect_absent /sobre 'data-language-switch'

# --- staging build: /en is live ---
echo "== staging build (EN published) =="
stop_server
npm run build -- --mode staging
start_server

for path in /en /en/about /en/contact /en/resume /en/mcp /en/setup /en/now /en/privacy /en/posts /en/portfolio /en/lab; do
  expect_body "$path" '<html lang="en"'
done

expect_body /sobre 'hreflang="en"'
expect_body /en/rss.xml '<language>en</language>'
expect_content_type /en/about.md 'text/markdown' 'title:'

echo "I18N ROUTES PASSED"
