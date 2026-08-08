#!/usr/bin/env bash
# Validates REQ-002/003/004 against the real build, before spending a deploy.
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

for _ in $(seq 1 30); do
  curl -sf "${BASE}/api/health" > /dev/null && break
  sleep 1
done

echo "== REQ-006: / responds 200 =="
curl -s -o /dev/null -w '%{http_code}\n' "${BASE}/" | grep -qx 200

echo "== REQ-003: /api/health responds 200 as JSON =="
curl -s -D - -o /tmp/health-1.json "${BASE}/api/health" | grep -qi 'content-type: application/json'

echo "== REQ-004: a second call returns a different payload =="
sleep 1
curl -s -o /tmp/health-2.json "${BASE}/api/health"
if diff -q /tmp/health-1.json /tmp/health-2.json > /dev/null; then
  echo "FAIL: identical payloads, the route is not server-rendered" >&2
  exit 1
fi

echo "== REQ-002: the process is bound on 0.0.0.0 =="
ss -ltnp 2>/dev/null | grep -q "0.0.0.0:${PORT}"

echo "ALL LOCAL CHECKS PASSED"
