#!/usr/bin/env bash
# REQ-003, REQ-011: keyboard walk through every route, in a real browser against the
# real build. No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

PORT="${PORT:-8080}"
CDP_PORT="${CDP_PORT:-9222}"
BASE="http://127.0.0.1:${PORT}"

if curl -sf "${BASE}/robots.txt" > /dev/null 2>&1; then
  echo "FAIL: port ${PORT} already serves something; pick a free PORT" >&2
  exit 1
fi

CHROME="$(command -v google-chrome-stable || command -v chromium || true)"
if [ -z "$CHROME" ]; then
  echo "FAIL: no Chrome or Chromium on PATH" >&2
  exit 1
fi

# A Chrome already listening here would be driven instead of the one we launch,
# making the gate measure someone else's browser.
if curl -sf "http://127.0.0.1:${CDP_PORT}/json/version" > /dev/null 2>&1; then
  echo "FAIL: something already speaks CDP on port ${CDP_PORT}; pick a free CDP_PORT" >&2
  exit 1
fi

npm run build

HOST=0.0.0.0 PORT="$PORT" node ./dist/server/entry.mjs &
SERVER_PID=$!

PROFILE="$(mktemp -d)"
"$CHROME" --headless=new --no-sandbox --disable-dev-shm-usage \
  --remote-debugging-port="$CDP_PORT" --user-data-dir="$PROFILE" about:blank \
  > /dev/null 2>&1 &
CHROME_PID=$!

# The `|| true` on the cleanup matters: a failing `rm` in the trap would replace
# the script's real exit code, which once made a NOT-biting gate report failure.
trap 'kill "$SERVER_PID" "$CHROME_PID" 2>/dev/null || true; rm -rf "$PROFILE" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "${BASE}/robots.txt" > /dev/null && break
  sleep 1
done

for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:${CDP_PORT}/json/version" > /dev/null && break
  sleep 1
done

# Every route type a keyboard user can reach.

CDP_URL="http://127.0.0.1:${CDP_PORT}" node scripts/check-keyboard.mjs "$BASE" \
  / \
  /portfolio \
  /lab \
  /sobre \
  /contato \
  /privacidade \
  /mcp \
  /sobre/ia \
  /lab/forja/ia \
  /posts \
  /posts/arquivo \
  /lab/amnesia-claude-code \
  /portfolio/abracce \
  /criar-site-completo-com-o-notion \
  /404
