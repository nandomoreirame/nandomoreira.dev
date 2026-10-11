import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The homelab staging environment (http://nandomoreira.home) exists so the
// author can review drafts. These assertions keep the three ways it could go
// wrong from coming back: a production build (no drafts), secrets shipped to the
// homelab, and the container reachable around the reverse proxy.
const read = (path: string) => readFileSync(path, 'utf8');

describe('staging deploy', () => {
  it('builds the image in staging mode, the only build that serves drafts', () => {
    expect(read('deploy/staging/Dockerfile')).toMatch(/npm run build -- --mode staging/);
  });

  it('runs the server as a non-root user', () => {
    expect(read('deploy/staging/Dockerfile')).toMatch(/^USER node$/m);
  });

  it('publishes the container on loopback only, behind Caddy', () => {
    const compose = read('deploy/staging/compose.yml');
    expect(compose).toMatch(/- "127\.0\.0\.1:\$\{STAGING_PORT:-4321\}:8080"/);
    expect(compose).not.toMatch(/- "\d+:8080"/);
  });

  it('never copies env files or local build output to the homelab', () => {
    const script = read('scripts/deploy-staging.sh');
    for (const excluded of ['.env*', 'node_modules', 'dist', '.astro', '.git']) {
      expect(script).toContain(`--exclude '${excluded}'`);
    }
    expect(read('.dockerignore')).toMatch(/^\.env\*$/m);
  });

  it('keeps the staging host out of search indexes', () => {
    expect(read('scripts/deploy-staging.sh')).toContain('header X-Robots-Tag "noindex, nofollow"');
  });

  it('proves the deploy over HTTP and ends with a marker line', () => {
    const script = read('scripts/deploy-staging.sh');
    expect(script).toContain('STAGING DEPLOY PASSED');
    expect(script).toContain('-o ServerAliveInterval=15 -o ServerAliveCountMax=8');
  });
});
