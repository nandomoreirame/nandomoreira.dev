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
check "/llms-full.txt"    "text/plain"        "## Projects"
check "/ai-index.json"    "application/json"  '"machineRoutes"'
check "/portfolio/financial-normalization.md" "text/markdown" "## Problema"
check "/lab/forja.md"     "text/markdown"     "## Problema"
check "/index.md"          "text/markdown"     "title:"
check "/sobre.md"          "text/markdown"     "title:"
check "/como-exibir-calendario-do-terminal.md" "text/markdown" "title:"
check "/ia"                "text/html"         'name="robots" content="noindex"'
check "/sobre/ia"          "text/html"         'name="robots" content="noindex"'
check "/como-exibir-calendario-do-terminal/ia" "text/html" 'name="robots" content="noindex"'
check "/lab/forja/ia"      "text/html"         'data-ai-source'
check "/AGENTS.md"        "text/markdown"     "## Availability"
check "/robots.txt"       "text/plain"        "Sitemap: https://"
check "/sitemap.xml"      "application/xml"   "<urlset"
check "/api/resume.json"  "application/json"  '"basics"'
check "/api/resume.txt"   "text/plain"        "AVAILABILITY"
check "/now.md"           "text/markdown"     "title: Agora"
check "/now/ia"           "text/html"         'name="robots" content="noindex"'

echo "== an AI view of an unknown page answers 404 =="
status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/nao-existe/ia")
if [ "$status" != "404" ]; then
  echo "FAIL: /nao-existe/ia answered ${status}, expected 404" >&2
  exit 1
fi
echo "OK /nao-existe/ia → 404"

echo "== cross-collection case markdown answers 404 =="
status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/lab/financial-normalization.md")
if [ "$status" != "404" ]; then
  echo "FAIL: /lab/financial-normalization.md answered ${status}, expected 404" >&2
  exit 1
fi
echo "OK /lab/financial-normalization.md → 404"

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
# Employer names (e.g. Liquid AI) are public; only clientName on confidential
# cases is forbidden. Same source the unit leak gate reads.
echo "== the resume and AEO routes leak neither an e-mail nor a confidential client =="
CONFIDENTIAL_CLIENTS=$(python3 - <<'PY'
from pathlib import Path
import re
names = []
for path in Path("src/content/projects").glob("*.md"):
    source = path.read_text()
    frontmatter = source.split("---", 2)
    if len(frontmatter) < 2:
        continue
    fm = frontmatter[1]
    if not re.search(r"^confidential:\s*true\s*$", fm, re.M):
        continue
    match = re.search(r"^clientName:\s*[\"']?(.+?)[\"']?\s*$", fm, re.M)
    if match:
        names.append(match.group(1).strip())
print("\n".join(names))
PY
)

for route in "/api/resume.json" "/api/resume.txt" "/llms-full.txt" "/ai-index.json" "/portfolio/financial-normalization.md" "/lab/forja.md" "/index.md" "/sobre.md" "/contato.md" "/mcp.md" "/privacidade.md"; do
  body=$(curl -s "${BASE}${route}")

  if printf '%s' "$body" | grep -qE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; then
    echo "FAIL: ${route} exposes an e-mail address" >&2
    exit 1
  fi

  if [ -n "$CONFIDENTIAL_CLIENTS" ]; then
    while IFS= read -r client; do
      [ -z "$client" ] && continue
      if printf '%s' "$body" | grep -qiF -- "$client"; then
        echo "FAIL: ${route} names confidential client '${client}'" >&2
        exit 1
      fi
    done <<EOF
$CONFIDENTIAL_CLIENTS
EOF
  fi

  echo "OK ${route} carries no e-mail and no confidential client"
done

echo "AEO ROUTES PASSED"
