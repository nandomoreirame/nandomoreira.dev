#!/usr/bin/env bash
# Every repoUrl in the catalogue must be reachable without credentials: a private
# repo answers 404 to a visitor, which is worse than no link at all (REQ-006).
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

fail=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  api="${url/https:\/\/github.com\//https:\/\/api.github.com\/repos\/}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$api")
  if [ "$code" != "200" ]; then
    echo "PRIVATE OR MISSING: $url (api $code)"
    fail=1
  else
    echo "ok: $url"
  fi
done < <(grep -rhoE 'repoUrl: https://github\.com/[^ ]+' src/content/projects/ | sed 's/repoUrl: //' | sort -u)

[ "$fail" -eq 0 ] && echo "REPO URLS PASSED" || { echo "REPO URLS FAILED"; exit 1; }
