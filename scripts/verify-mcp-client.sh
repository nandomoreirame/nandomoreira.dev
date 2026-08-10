#!/usr/bin/env bash
# F6 acceptance criterion: a REAL MCP client connects to the BUILT server.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

PORT="${PORT:-8080}"
BASE="http://127.0.0.1:${PORT}"

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

echo "== a real MCP client against the built server =="
node scripts/mcp-client-probe.mjs "${BASE}/api/mcp"

echo "== the route survives a probing GET =="
status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/api/mcp")
if [ "$status" -ge 500 ]; then
  echo "FAIL: GET /api/mcp answered ${status}; a probing client must not get a 5xx" >&2
  exit 1
fi
echo "OK GET /api/mcp answered ${status}"

echo "== a malformed body is a JSON-RPC error, not a 500 =="
status=$(curl -s -o /tmp/mcp-bad -w '%{http_code}' -X POST "${BASE}/api/mcp" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{ not json')
if [ "$status" -ge 500 ]; then
  echo "FAIL: malformed body answered ${status}" >&2
  exit 1
fi
if grep -qE 'at .+\(.+:[0-9]+:[0-9]+\)|/home/|node_modules' /tmp/mcp-bad; then
  echo "FAIL: the error response leaked an internal detail" >&2
  exit 1
fi
echo "OK malformed body answered ${status} with no internal detail"

echo "MCP SERVER PASSED"
