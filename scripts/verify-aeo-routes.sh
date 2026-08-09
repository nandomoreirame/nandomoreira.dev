#!/usr/bin/env bash
# REQ-001/003/004/005/009 against the real build. No `set -u`: the Bash tool's
# shell snapshot references unbound vars and would abort the script.
set -eo pipefail

PORT="${PORT:-8080}"
BASE="http://127.0.0.1:${PORT}"

# Fail if the port is already taken so we do not validate a foreign process.
if curl -sf "${BASE}/robots.txt" > /dev/null 2>&1; then
  echo "FAIL: port ${PORT} already serves something; pick a free PORT" >&2
  exit 1
fi

npm run build

HOST=0.0.0.0 PORT="$PORT" node ./dist/server/entry.mjs &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "${BASE}/robots.txt" > /dev/null && break
  sleep 1
done

check() {
  local path="$1" expected_type="$2" marker="$3"

  local status
  status=$(curl -s -o /tmp/aeo-body -w '%{http_code}' "${BASE}${path}")
  if [ "$status" != "200" ]; then
    echo "FAIL: ${path} answered ${status}" >&2
    exit 1
  fi

  local ctype
  ctype=$(curl -s -o /dev/null -w '%{content_type}' "${BASE}${path}")
  case "$ctype" in
    *"$expected_type"*) ;;
    *) echo "FAIL: ${path} content-type is '${ctype}', expected '${expected_type}'" >&2; exit 1 ;;
  esac

  grep -q "$marker" /tmp/aeo-body || {
    echo "FAIL: ${path} body does not contain '${marker}'" >&2
    exit 1
  }

  echo "OK ${path} (${ctype})"
}

check "/llms.txt"    "text/plain"       "## Machine routes"
check "/AGENTS.md"   "text/markdown"    "## Availability"
check "/robots.txt"  "text/plain"       "Sitemap: https://"
check "/sitemap.xml" "application/xml"  "<urlset"

echo "== sitemap is well-formed XML =="
curl -s "${BASE}/sitemap.xml" | python3 -c "import sys,xml.dom.minidom as m; m.parseString(sys.stdin.read())"

echo "AEO ROUTES PASSED"
