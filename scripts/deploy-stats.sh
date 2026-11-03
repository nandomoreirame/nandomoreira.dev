#!/usr/bin/env bash
# Publishes the analytics panel to the homelab as http://stats.home, reachable
# only through Tailscale (docs/specs/stats-web REQ-021):
#   1. copies tools/stats and deploy/stats to the homelab, nothing else;
#   2. refuses to go on without the service account key in mode 600;
#   3. builds and (re)starts the container, published on loopback only;
#   4. adds a Caddy site that answers 403 outside the tailnet;
#   5. points stats.home at the homelab's Tailscale IP in Pi-hole;
#   6. proves it: 200 through Tailscale, 403 from the home network.
# Run it at home with Tailscale up: the 403 check needs the home network.
# Ends with STATS DEPLOY PASSED; that line, not the exit code, is the evidence.
# Env: STATS_HOST (ssh host, default homelab), STATS_PORT (default 7879).
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${STATS_HOST:-homelab}"
PORT="${STATS_PORT:-7879}"
DOMAIN="stats.home"
DIR="stats-web"
SSH_OPTS=(-o ServerAliveInterval=15 -o ServerAliveCountMax=8)

echo "==> syncing tools/stats and deploy/stats to $HOST:~/$DIR"
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $DIR/tools/stats $DIR/deploy/stats"
rsync -az --delete --exclude 'target' -e "ssh ${SSH_OPTS[*]}" "$ROOT/tools/stats/" "$HOST:$DIR/tools/stats/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$ROOT/deploy/stats/" "$HOST:$DIR/deploy/stats/"
printf 'tools/stats/target\n' | ssh "${SSH_OPTS[@]}" "$HOST" "cat > $DIR/.dockerignore"

echo "==> building and starting the container, wiring Caddy and Pi-hole"
REMOTE_OUT="$(ssh "${SSH_OPTS[@]}" "$HOST" bash -s -- "$DIR" "$PORT" "$DOMAIN" <<'REMOTE'
set -eo pipefail
DIR="$1"; PORT="$2"; DOMAIN="$3"
cd "$HOME/$DIR"

KEY="$HOME/.config/stats/sa.json"
[ -f "$KEY" ] || { echo "FAIL: missing $KEY (tools/stats/README.md, Painel web no homelab)"; exit 1; }
[ "$(stat -c %a "$KEY")" = "600" ] || { echo "FAIL: $KEY must be mode 600"; exit 1; }

STATS_UID="$(id -u)" STATS_PORT="$PORT" docker compose -f deploy/stats/compose.yml up -d --build --remove-orphans >&2
docker image prune -f >/dev/null

TS_IP="$(tailscale ip -4 | head -1)"
[ -n "$TS_IP" ] || { echo "FAIL: the homelab has no Tailscale IPv4"; exit 1; }

# Caddy: append the site block once, then reload. Appending (never rewriting)
# keeps the other sites untouched and the bind-mounted file's inode stable.
CADDYFILE="$HOME/caddy/Caddyfile"
if ! grep -q "^http://$DOMAIN {" "$CADDYFILE"; then
  printf '\nhttp://%s {\n\t@outside not remote_ip 100.64.0.0/10 fd7a:115c:a1e0::/48\n\trespond @outside 403\n\theader X-Robots-Tag "noindex, nofollow"\n\treverse_proxy localhost:%s\n}\n' "$DOMAIN" "$PORT" >> "$CADDYFILE"
  echo "caddy: added $DOMAIN" >&2
fi
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >&2

# Pi-hole: "<tailscale ip> stats.home" once. Every .home name points at the
# Tailscale IP, so the home network IP for the 403 check comes from the
# default route instead.
CURRENT="$(docker exec pihole pihole-FTL --config dns.hosts)"
LAN_IP="$(ip -4 route get 1.1.1.1 | sed -n 's/.* src \([0-9.]*\).*/\1/p')"
if ! printf '%s' "$CURRENT" | grep -q " $DOMAIN\b"; then
  ITEMS="$(printf '%s' "$CURRENT" | sed -e 's/^\[ *//' -e 's/ *\]$//')"
  JSON="$(printf '%s' "$ITEMS" | awk -v add="$TS_IP $DOMAIN" 'BEGIN { RS = ", "; ORS = "" } NF { gsub(/\n/, ""); printf "%s\"%s\"", (n++ ? "," : ""), $0 } END { printf "%s\"%s\"", (n ? "," : ""), add }')"
  docker exec pihole pihole-FTL --config dns.hosts "[$JSON]" >/dev/null
  echo "pihole: added $TS_IP $DOMAIN" >&2
fi

for i in $(seq 1 90); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" "http://localhost:$PORT/healthz" || true)"
  [ "$CODE" = "200" ] && break
  sleep 2
done
[ "$CODE" = "200" ] || { echo "FAIL: the container did not answer 200 on :$PORT"; docker logs --tail 30 stats-web >&2; exit 1; }
echo "TS_IP=$TS_IP"
echo "LAN_IP=$LAN_IP"
REMOTE
)" || { printf '%s\n' "$REMOTE_OUT"; exit 1; }

TS_IP="$(printf '%s\n' "$REMOTE_OUT" | sed -n 's/^TS_IP=//p')"
LAN_IP="$(printf '%s\n' "$REMOTE_OUT" | sed -n 's/^LAN_IP=//p')"
[ -n "$TS_IP" ] && [ -n "$LAN_IP" ] || { echo "FAIL: could not read the homelab addresses"; printf '%s\n' "$REMOTE_OUT"; exit 1; }

echo "==> checking http://$DOMAIN through Tailscale ($TS_IP)"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 --resolve "$DOMAIN:80:$TS_IP" "http://$DOMAIN/healthz" || true)"
[ "$CODE" = "200" ] || { echo "FAIL: http://$DOMAIN answered $CODE through Tailscale (is Tailscale up here?)"; exit 1; }

echo "==> checking http://$DOMAIN from the home network ($LAN_IP)"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 --resolve "$DOMAIN:80:$LAN_IP" "http://$DOMAIN/healthz" || true)"
[ "$CODE" = "403" ] || { echo "FAIL: http://$DOMAIN answered $CODE from the home network; it must be 403"; exit 1; }

RESOLVED="$(getent hosts "$DOMAIN" | awk '{ print $1 }' | head -1 || true)"
[ "$RESOLVED" = "$TS_IP" ] || echo "note: $DOMAIN resolves to '${RESOLVED:-nothing}' here, not $TS_IP yet (DNS cache, or the split DNS is not set)"

echo "STATS DEPLOY PASSED"
