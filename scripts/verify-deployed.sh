#!/usr/bin/env bash
# Closes the spike: REQ-003/004/006 against the live App Hosting URL.
set -eo pipefail

BASE="${1:?usage: verify-deployed.sh <base-url>}"

echo "== REQ-006: / responds 200 =="
curl -s -o /dev/null -w '%{http_code}\n' "${BASE}/" | grep -qx 200

echo "== REQ-003: /api/health responds 200 as JSON =="
curl -s -D - -o /tmp/deployed-1.json "${BASE}/api/health" | grep -qi 'content-type: application/json'

echo "== REQ-003: the platform is not allowed to cache it =="
# The unit test asserts the header we set; only this asserts what the edge
# actually returns, which is where a CDN would break REQ-004.
curl -s -D - -o /dev/null "${BASE}/api/health" | grep -qi 'cache-control: no-store'

echo "== REQ-004: a second call returns a different payload =="
sleep 2
curl -s -o /tmp/deployed-2.json "${BASE}/api/health"
if diff -q /tmp/deployed-1.json /tmp/deployed-2.json > /dev/null; then
  echo "FAIL: identical payloads in production. Either the route was prerendered" >&2
  echo "      or an edge cache is serving it. Plan A is NOT proven." >&2
  exit 1
fi

echo "SPIKE PASSED: Astro SSR is live on App Hosting"
