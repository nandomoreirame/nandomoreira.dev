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

# A pre-rendered page cannot send a status, so `Astro.redirect` there degrades to
# 200 plus a <meta refresh>. Only a real request proves the difference; a unit
# test reading the source cannot, and that is exactly how it shipped broken.
assert_redirect() {
  from="$1"
  to="$2"
  status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${from}")
  location=$(curl -s -D - -o /dev/null "${BASE}${from}" | grep -i '^location:' | tr -d '\r' | awk '{print $2}')

  if [ "$status" != "301" ]; then
    echo "FAIL: ${from} answered ${status}, expected a real 301" >&2
    exit 1
  fi
  if [ "$location" != "$to" ]; then
    echo "FAIL: ${from} pointed at '${location}', expected '${to}'" >&2
    exit 1
  fi
  echo "  ${from} -> 301 ${to}"
}

echo "== legacy paths answer with a real 301, never a meta refresh =="
assert_redirect /notas /posts
assert_redirect /notas/comece-com-gulp /comece-com-gulp
assert_redirect /projetos /portfolio

# Derived from the sitemap so the check does not pin a slug that may be retired.
CASE_PATH=$(curl -s "${BASE}/sitemap.xml" | grep -oE '/(portfolio|lab)/[a-z0-9-]+' | head -1)
if [ -z "$CASE_PATH" ]; then
  echo "FAIL: no case route found in the sitemap to test /projetos/<slug> against" >&2
  exit 1
fi
assert_redirect "/projetos/${CASE_PATH##*/}" "$CASE_PATH"

# `postbuild` deletes the source images Astro already optimised. A name-pattern
# rule decides what goes, so the only honest check is asking the running server
# for every image the routes actually reference.
echo "== every image referenced by a route is still served =="
ROUTES=$(curl -s "${BASE}/sitemap.xml" | grep -oE '<loc>[^<]+</loc>' | sed 's|<loc>https://nandomoreira.dev||;s|</loc>||')
ROUTES="${ROUTES}
/404
/contato"

RENDERED=$(mktemp)
for route in $ROUTES; do
  curl -s "${BASE}${route}" >> "$RENDERED"
done
cat dist/client/_astro/*.css >> "$RENDERED" 2>/dev/null || true

IMAGES=$(grep -oE '/_astro/[A-Za-z0-9._-]+\.(webp|png|jpe?g|gif|avif)' "$RENDERED" | sort -u)
rm -f "$RENDERED"

if [ -z "$IMAGES" ]; then
  echo "FAIL: no image references found across the routes; the check would be vacuous" >&2
  exit 1
fi

broken=0
total=0
for image in $IMAGES; do
  total=$((total + 1))
  code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${image}")
  if [ "$code" != "200" ]; then
    echo "FAIL: ${image} answered ${code}, the prune removed a served image" >&2
    broken=$((broken + 1))
  fi
done

if [ "$broken" != 0 ]; then
  exit 1
fi
echo "  ${total} images referenced, all 200"

echo "ALL LOCAL CHECKS PASSED"
