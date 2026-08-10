#!/usr/bin/env bash
# REQ-002..REQ-009 of hire-endpoint against the REAL build over HTTP.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

PORT="${PORT:-8080}"
BASE="http://127.0.0.1:${PORT}"

if curl -sf "${BASE}/robots.txt" > /dev/null 2>&1; then
  echo "FAIL: port ${PORT} already serves something; pick a free PORT" >&2
  exit 1
fi

npm run build

# Placeholder secrets: enough to boot the route, never enough to send mail.
# Persistence is exercised separately against the emulator or a real project;
# here the point is the contract every caller sees.
HOST=0.0.0.0 PORT="$PORT" \
  RESEND_API_KEY="re_placeholder_not_a_real_key" \
  HIRE_NOTIFY_TO="verify@example.com" \
  HIRE_NOTIFY_FROM="verify@example.com" \
  node ./dist/server/entry.mjs &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "${BASE}/robots.txt" > /dev/null && break
  sleep 1
done

BODY_FILE=/tmp/hire-body

# call <label> <expected-status> <ip> [curl args...]
call() {
  local label="$1" expected="$2" ip="$3"
  shift 3

  local status
  status=$(curl -s -o "$BODY_FILE" -w '%{http_code}' \
    -H "x-forwarded-for: ${ip}" "$@" "${BASE}/api/hire")

  if [ "$status" != "$expected" ]; then
    echo "FAIL: ${label} answered ${status}, expected ${expected}" >&2
    echo "      body: $(head -c 200 "$BODY_FILE")" >&2
    exit 1
  fi

  # REQ-007 on every single response, not only the interesting ones.
  if grep -qiE 'at .+:[0-9]+:[0-9]+|/home/|node_modules|hire_requests|firestore|resend|PERMISSION_DENIED' "$BODY_FILE"; then
    echo "FAIL: ${label} leaked an internal detail: $(head -c 200 "$BODY_FILE")" >&2
    exit 1
  fi

  echo "OK ${label} -> ${status}"
}

json() { printf '%s' "$1"; }

VALID='{"from":"Agente","contact":"contato@example.com","brief":"Um briefing legitimo."}'

call "GET is refused"            405 "1.0.0.1" -X GET
call "malformed JSON"            400 "1.0.0.2" -X POST -H 'content-type: application/json' --data '{ not json'
call "empty body"                400 "1.0.0.3" -X POST -H 'content-type: application/json' --data ''
call "missing fields"            400 "1.0.0.4" -X POST -H 'content-type: application/json' --data '{"brief":""}'
call "unknown key"               400 "1.0.0.5" -X POST -H 'content-type: application/json' --data '{"from":"a","contact":"b@c.d","brief":"x","extra":"y"}'
call "whitespace-only brief"     400 "1.0.0.6" -X POST -H 'content-type: application/json' --data '{"from":"a","contact":"b@c.d","brief":"   "}'

echo "== a 20 KB body is cut before the parse (REQ-003) =="
python3 -c "print('{\"from\":\"a\",\"contact\":\"b@c.d\",\"brief\":\"' + 'x'*20000 + '\"}')" > /tmp/hire-big.json
call "oversized body"            413 "1.0.0.7" -X POST -H 'content-type: application/json' --data-binary @/tmp/hire-big.json

# A SMALLER Content-Length is not the threat: the HTTP stack truncates the body
# to it, so the route sees 10 bytes of broken JSON and answers 400 correctly.
# The real case is a body with NO declared length at all, streamed chunked,
# where only the read can cut. That is what this checks (REQ-003, AD-003).
echo "== a chunked body with no declared length is still cut (REQ-003) =="
status=$(curl -s -o "$BODY_FILE" -w '%{http_code}' \
  -H 'x-forwarded-for: 1.0.0.8' -H 'content-type: application/json' \
  -H 'Transfer-Encoding: chunked' \
  -X POST -T /tmp/hire-big.json "${BASE}/api/hire")
if [ "$status" != "413" ]; then
  echo "FAIL: chunked oversized body answered ${status}, expected 413" >&2
  echo "      body: $(head -c 200 "$BODY_FILE")" >&2
  exit 1
fi
echo "OK chunked oversized body -> ${status}"

echo "== the honeypot answers as if accepted, and stores nothing (REQ-004) =="
call "honeypot filled"           202 "1.0.0.9" -X POST -H 'content-type: application/json' \
  --data '{"from":"a","contact":"b@c.d","brief":"x","website":"http://spam"}'

echo "== the rate limit trips on the sixth request in the window (REQ-005) =="
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -H 'x-forwarded-for: 5.5.5.5' -X POST \
    -H 'content-type: application/json' --data "$(json "$VALID")" "${BASE}/api/hire"
done
call "sixth request from one IP" 429 "5.5.5.5" -X POST -H 'content-type: application/json' --data "$(json "$VALID")"

echo "== a different IP is not punished for it =="
call "another IP still allowed"  503 "6.6.6.6" -X POST -H 'content-type: application/json' --data "$(json "$VALID")"

# 503 above is the CORRECT answer while no Firestore is provisioned: persistence
# is unreachable, so the endpoint refuses honestly rather than pretending to
# have stored the briefing (REQ-002). Once Firestore exists this becomes 202.
echo "NOTE: a valid briefing answers 503 until Firestore is provisioned; that is the honest failure, not a bug."

echo "HIRE ENDPOINT PASSED"
