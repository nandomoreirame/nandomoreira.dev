import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The homelab panel (http://stats.home, docs/specs/stats-web) shows lead data.
// These assertions keep the ways it could leak from coming back: a port
// published around Caddy, a key baked into the image, a root process, a build
// that pulls in the rest of the repository.
const read = (path: string) => readFileSync(path, 'utf8');

describe('stats web image', () => {
  it('builds only tools/stats, pinned to the lockfile', () => {
    const dockerfile = read('deploy/stats/Dockerfile');
    expect(dockerfile).toMatch(/^COPY tools\/stats\/ \.\/$/m);
    expect(dockerfile).toContain('cargo build --release --locked');
    expect(dockerfile).not.toMatch(/^COPY \. /m);
  });

  it('runs as a non-root user on the same Debian it was built on', () => {
    const dockerfile = read('deploy/stats/Dockerfile');
    expect(dockerfile).toMatch(/^USER stats$/m);
    expect(dockerfile).toContain('FROM rust:1.96-slim-bookworm AS build');
    expect(dockerfile).toContain('FROM debian:bookworm-slim');
  });

  it('serves stats.home inside the container and never opens a browser', () => {
    const dockerfile = read('deploy/stats/Dockerfile');
    expect(dockerfile).toContain('"--host-name", "stats.home"');
    expect(dockerfile).toContain('"--bind", "0.0.0.0"');
    expect(dockerfile).toContain('"--no-open"');
  });

  it('never puts the service account key in the image', () => {
    expect(read('deploy/stats/Dockerfile')).not.toMatch(/^(COPY|ADD)[^\n]*sa\.json/m);
  });

  it('keeps the local build output out of the context', () => {
    expect(read('.dockerignore')).toMatch(/^tools\/stats\/target$/m);
  });
});

describe('stats web compose', () => {
  it('publishes on loopback only, behind Caddy', () => {
    const compose = read('deploy/stats/compose.yml');
    expect(compose).toMatch(/- "127\.0\.0\.1:\$\{STATS_PORT:-7879\}:8080"/);
    expect(compose).not.toMatch(/- "\d+:8080"/);
  });

  it('mounts the key read-only from outside the repository', () => {
    expect(read('deploy/stats/compose.yml')).toContain(
      '${HOME}/.config/stats/sa.json:/run/secrets/stats-sa.json:ro',
    );
  });

  it('runs with the homelab user id, so it can read a key in mode 600', () => {
    expect(read('deploy/stats/compose.yml')).toContain('UID: ${STATS_UID:-1000}');
  });
});

describe('deploy-stats.sh', () => {
  const script = () => read('scripts/deploy-stats.sh');

  it('copies only tools/stats and deploy/stats, never the whole repository', () => {
    expect(script()).toContain('"$ROOT/tools/stats/"');
    expect(script()).toContain('"$ROOT/deploy/stats/"');
    expect(script()).toContain("--exclude 'target'");
    expect(script()).not.toMatch(/"\$ROOT\/"/);
  });

  it('refuses to start without the key in mode 600', () => {
    expect(script()).toContain('KEY="$HOME/.config/stats/sa.json"');
    expect(script()).toContain('[ "$(stat -c %a "$KEY")" = "600" ]');
  });

  it('answers 403 to anything outside the tailnet', () => {
    expect(script()).toContain('@outside not remote_ip 100.64.0.0/10 fd7a:115c:a1e0::/48');
    expect(script()).toContain('respond @outside 403');
    expect(script()).toContain('header X-Robots-Tag "noindex, nofollow"');
  });

  it('points stats.home at the Tailscale address, not the home network one', () => {
    expect(script()).toContain('TS_IP="$(tailscale ip -4 | head -1)"');
    expect(script()).toMatch(/awk -v add="\$TS_IP \$DOMAIN"/);
  });

  it('takes the home network IP from the default route, since every .home name points at Tailscale', () => {
    expect(script()).toContain("LAN_IP=\"$(ip -4 route get 1.1.1.1 | sed -n 's/.* src \\([0-9.]*\\).*/\\1/p')\"");
    expect(script()).not.toMatch(/LAN_IP=.*dns\.hosts|LAN_IP="\$\(printf '%s' "\$CURRENT"/);
  });

  it('proves both sides over HTTP and ends with a marker line', () => {
    expect(script()).toContain('--resolve "$DOMAIN:80:$TS_IP"');
    expect(script()).toContain('--resolve "$DOMAIN:80:$LAN_IP"');
    expect(script()).toContain('[ "$CODE" = "403" ]');
    expect(script()).toContain('STATS DEPLOY PASSED');
    expect(script()).toContain('-o ServerAliveInterval=15 -o ServerAliveCountMax=8');
  });
});
