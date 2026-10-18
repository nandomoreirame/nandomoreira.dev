import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

/**
 * App Hosting ends TLS at its proxy and forwards plain HTTP. Astro trusts
 * X-Forwarded-Proto/Host only for these domains; without them it rebuilds the
 * origin as http://, the form POST's https Origin never matches, and
 * checkOrigin answers 403 (found in production on 2026-10-09).
 */
describe('security.allowedDomains', () => {
  const domains = config.security?.allowedDomains ?? [];

  it.each([
    'nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app',
    'nandomoreira.dev',
    'www.nandomoreira.dev',
    'contrate.nandomoreira.dev',
  ])('trusts forwarded headers for %s over https', (hostname) => {
    expect(domains).toContainEqual({ hostname, protocol: 'https' });
  });

  it('keeps the origin check on', () => {
    expect(config.security?.checkOrigin).not.toBe(false);
  });
});
