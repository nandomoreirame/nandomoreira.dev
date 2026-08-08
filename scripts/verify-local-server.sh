#!/usr/bin/env bash
# Validates REQ-002/003/004/006 against the real build, before spending a deploy.
# Deliberately no `set -u`: the Bash tool sources a shell snapshot that
# references unbound vars and would abort the script.
set -eo pipefail

PORT="${PORT:-8080}"
HOST="${HOST:-0.0.0.0}"
BASE="http://127.0.0.1:${PORT}"

npm run build

HOST="$HOST" PORT="$PORT" node ./dist/server/entry.mjs &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# The server is backgrounded, so `set -e` cannot see it die. Without this check
# a foreign process squatting on $PORT would answer every assertion below and
# the script would pass while validating something else entirely.
sleep 1
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "FAIL: the server died on startup. Port ${PORT} is probably taken:" >&2
  ss -ltnp 2>/dev/null | grep ":${PORT}" >&2 || true
  exit 1
fi

ready=0
for _ in $(seq 1 30); do
  curl -sf "${BASE}/api/health" > /dev/null && { ready=1; break; }
  sleep 1
done
if [ "$ready" != 1 ]; then
  echo "FAIL: the server never became ready on ${BASE}" >&2
  exit 1
fi

echo "== REQ-002: our own process is bound on 0.0.0.0 =="
# Scoped to SERVER_PID: matching the port alone would accept a foreign listener.
ss -ltnp 2>/dev/null | grep "0.0.0.0:${PORT}" | grep -q "pid=${SERVER_PID}"

echo "== REQ-006: / responds 200 =="
curl -s -o /dev/null -w '%{http_code}\n' "${BASE}/" | grep -qx 200

echo "== REQ-003: /api/health responds 200 as JSON =="
curl -s -D - -o /tmp/health-1.json "${BASE}/api/health" | grep -qi 'content-type: application/json'

echo "== REQ-003: the response forbids caching =="
curl -s -D - -o /dev/null "${BASE}/api/health" | grep -qi 'cache-control: no-store'

echo "== REQ-004: a second call returns a different payload =="
sleep 1
curl -s -o /tmp/health-2.json "${BASE}/api/health"
if diff -q /tmp/health-1.json /tmp/health-2.json > /dev/null; then
  echo "FAIL: identical payloads, the route is not server-rendered" >&2
  exit 1
fi

echo "ALL LOCAL CHECKS PASSED"
