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

check "/llms.txt"         "text/plain"        "## Machine routes"
check "/AGENTS.md"        "text/markdown"     "## Availability"
check "/robots.txt"       "text/plain"        "Sitemap: https://"
check "/sitemap.xml"      "application/xml"   "<urlset"
check "/api/resume.json"  "application/json"  '"basics"'
check "/api/resume.txt"   "text/plain"        "AVAILABILITY"

echo "== sitemap is well-formed XML =="
curl -s "${BASE}/sitemap.xml" | python3 -c "import sys,xml.dom.minidom as m; m.parseString(sys.stdin.read())"

echo "== the resume validates against the published JSON Resume schema =="
curl -s "${BASE}/api/resume.json" > /tmp/aeo-resume.json
node -e '
const { validate } = require("@jsonresume/schema");
const resume = require("/tmp/aeo-resume.json");
validate(resume, (error, valid) => {
  if (!valid) {
    console.error("FAIL: served resume does not validate:", JSON.stringify(error));
    process.exit(1);
  }
  console.log("OK /api/resume.json validates");
});
'

echo "== sitemap lists both resume routes (REQ-012) =="
for route in "/api/resume.json" "/api/resume.txt"; do
  curl -s "${BASE}/sitemap.xml" | grep -q "$route" || {
    echo "FAIL: sitemap.xml does not list ${route}" >&2
    exit 1
  }
  echo "OK sitemap lists ${route}"
done

# REQ-007/REQ-009 against what is actually served, not against the source.
echo "== the resume routes leak neither an e-mail nor a confidential client =="
for route in "/api/resume.json" "/api/resume.txt"; do
  body=$(curl -s "${BASE}${route}")

  if printf '%s' "$body" | grep -qE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; then
    echo "FAIL: ${route} exposes an e-mail address" >&2
    exit 1
  fi

  if printf '%s' "$body" | grep -qiE '\bliquid\b'; then
    echo "FAIL: ${route} names a confidential client" >&2
    exit 1
  fi

  echo "OK ${route} carries no e-mail and no confidential client"
done

echo "AEO ROUTES PASSED"
