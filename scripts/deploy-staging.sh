#!/usr/bin/env bash
# Deploy the site to the homelab staging environment: http://nandomoreira.home
#
# Staging is a `--mode staging` build, so drafts are visible for review; the
# production deploy (push to main, App Hosting) is untouched by this script.
#
# What it does, every step idempotent:
#   1. rsync the working tree (uncommitted drafts included) to the homelab;
#   2. build the image and (re)start the container with docker compose;
#   3. make sure Caddy proxies nandomoreira.home to it (noindex header);
#   4. make sure Pi-hole resolves nandomoreira.home to the homelab;
#   5. prove it over HTTP, from the homelab and from this machine.
#
# Usage:  bash scripts/deploy-staging.sh
# Env:    STAGING_HOST (ssh host, default homelab)
#         STAGING_DIR  (remote dir under ~, default nandomoreira-dev-staging)
#         STAGING_PORT (loopback port, default 4321)
#
# The evidence is the last line, STAGING DEPLOY PASSED, never the exit code.

set -eo pipefail

HOST="${STAGING_HOST:-homelab}"
DIR="${STAGING_DIR:-nandomoreira-dev-staging}"
PORT="${STAGING_PORT:-4321}"
DOMAIN="nandomoreira.home"
# The sales landing, served by the same container through the host rewrite.
SALES_DOMAIN="contrate.nandomoreira.home"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_OPTS=(-o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=8 -o RequestTTY=no)

echo "==> syncing $ROOT to $HOST:~/$DIR"
rsync -az --delete \
  --exclude '.env*' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.astro' \
  --exclude '.git' \
  --exclude '.firebase' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "$HOST:$DIR/"

echo "==> building and starting the container, wiring Caddy and Pi-hole"
ssh "${SSH_OPTS[@]}" "$HOST" bash -s -- "$DIR" "$PORT" "$DOMAIN" "$SALES_DOMAIN" <<'REMOTE'
set -eo pipefail
DIR="$1"; PORT="$2"; DOMAIN="$3"; SALES_DOMAIN="$4"
cd "$HOME/$DIR"

STAGING_PORT="$PORT" docker compose -f deploy/staging/compose.yml up -d --build --remove-orphans
docker image prune -f >/dev/null

# Caddy: append the site block once, then reload. Appending (never rewriting)
# keeps the other sites untouched and the bind-mounted file's inode stable.
CADDYFILE="$HOME/caddy/Caddyfile"
for D in "$DOMAIN" "$SALES_DOMAIN"; do
  if ! grep -q "^http://$D {" "$CADDYFILE"; then
    printf '\nhttp://%s {\n\theader X-Robots-Tag "noindex, nofollow"\n\treverse_proxy localhost:%s\n}\n' "$D" "$PORT" >> "$CADDYFILE"
    echo "caddy: added $D"
  fi
done
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

# Pi-hole: add "<ip> nandomoreira.home" to dns.hosts once, using the IP the
# other .home names already point to.
for D in "$DOMAIN" "$SALES_DOMAIN"; do
  CURRENT="$(docker exec pihole pihole-FTL --config dns.hosts)"
  if ! printf '%s' "$CURRENT" | grep -q " $D\b"; then
    IP="$(printf '%s' "$CURRENT" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1)"
    [ -n "$IP" ] || { echo "FAIL: no existing Pi-hole host to copy the IP from"; exit 1; }
    ITEMS="$(printf '%s' "$CURRENT" | sed -e 's/^\[ *//' -e 's/ *\]$//')"
    JSON="$(printf '%s' "$ITEMS" | awk -v add="$IP $D" 'BEGIN { RS = ", "; ORS = "" } NF { gsub(/\n/, ""); printf "%s\"%s\"", (n++ ? "," : ""), $0 } END { printf "%s\"%s\"", (n ? "," : ""), add }')"
    docker exec pihole pihole-FTL --config dns.hosts "[$JSON]" >/dev/null
    echo "pihole: added $IP $D"
  fi
done

for i in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)"
  [ "$CODE" = "200" ] && break
  sleep 1
done
[ "$CODE" = "200" ] || { echo "FAIL: the container did not answer 200 on :$PORT"; docker logs --tail 30 nandomoreira-dev-staging; exit 1; }
echo "container: 200 on localhost:$PORT"
REMOTE

echo "==> checking http://$DOMAIN from this machine"
# A name Pi-hole just learned can still be cached as nonexistent here; retry
# for up to a minute before calling it a failure.
for i in $(seq 1 12); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://$DOMAIN/" || true)"
  [ "$CODE" = "200" ] && break
  sleep 5
done
if [ "$CODE" != "200" ]; then
  echo "FAIL: http://$DOMAIN/ answered '$CODE' (DNS may take a moment, or this machine does not use the Pi-hole)"
  exit 1
fi
ROBOTS="$(curl -s -o /dev/null -D - --max-time 15 "http://$DOMAIN/" | grep -i '^x-robots-tag' || true)"
[ -n "$ROBOTS" ] || { echo "FAIL: http://$DOMAIN/ is missing the X-Robots-Tag header"; exit 1; }

echo "==> checking http://$SALES_DOMAIN from this machine"
for i in $(seq 1 12); do
  SALES_HTML="$(curl -s --max-time 15 "http://$SALES_DOMAIN/" || true)"
  printf '%s' "$SALES_HTML" | grep -q 'id="hero-title"' && break
  sleep 5
done
printf '%s' "$SALES_HTML" | grep -q 'id="hero-title"' || { echo "FAIL: http://$SALES_DOMAIN/ did not serve the sales landing"; exit 1; }

echo "STAGING DEPLOY PASSED: http://$DOMAIN and http://$SALES_DOMAIN"
