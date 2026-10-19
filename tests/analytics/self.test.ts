import { describe, expect, it } from 'vitest';
import { cookieDomainFor, handleSelf } from '../../src/lib/analytics/self';

const TOKEN = 't'.repeat(40);
const visit = (query: string, method = 'GET') =>
  handleSelf(new Request(`https://nandomoreira.dev/eu${query}`, { method }), TOKEN);

describe('handleSelf', () => {
  it('sets the self cookie with the right token', () => {
    const response = visit(`?token=${TOKEN}`);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/');
    const cookie = response.headers.get('set-cookie') ?? '';
    for (const part of ['__session=self', 'Path=/', 'Max-Age=31536000', 'HttpOnly', 'Secure', 'SameSite=Lax']) {
      expect(cookie).toContain(part);
    }
  });

  it('answers 404 without a cookie for a wrong, missing or differently sized token, or a non-GET', () => {
    for (const response of [
      visit('?token=nope'),
      visit(''),
      visit(`?token=${TOKEN}x`),
      visit(`?token=${TOKEN}`, 'POST'),
    ]) {
      expect(response.status).toBe(404);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('shares the cookie with the subdomains, so the sales landing skips the author too', () => {
    const cookie = visit(`?token=${TOKEN}`).headers.get('set-cookie') ?? '';
    expect(cookie).toContain('Domain=nandomoreira.dev');
  });

  it('takes the host from the validated request URL when one is given', () => {
    const response = handleSelf(new Request(`https://internal.run.app/eu?token=${TOKEN}`), TOKEN, 'nandomoreira.dev');
    expect(response.headers.get('set-cookie')).toContain('Domain=nandomoreira.dev');
  });

  it('keeps the cookie host-only off the real domain', () => {
    const response = handleSelf(
      new Request(`https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app/eu?token=${TOKEN}`),
      TOKEN,
    );
    expect(response.headers.get('set-cookie')).not.toContain('Domain=');
  });

  it('answers 404 when no token is configured', () => {
    expect(handleSelf(new Request('https://nandomoreira.dev/eu?token=x'), null).status).toBe(404);
  });
});

describe('cookieDomainFor', () => {
  it('names the registrable domain for the main host and its subdomains only', () => {
    expect(cookieDomainFor('nandomoreira.dev')).toBe('nandomoreira.dev');
    expect(cookieDomainFor('www.nandomoreira.dev')).toBe('nandomoreira.dev');
    expect(cookieDomainFor('contrate.nandomoreira.dev')).toBe('nandomoreira.dev');
    expect(cookieDomainFor('localhost')).toBeUndefined();
    expect(cookieDomainFor('evilnandomoreira.dev')).toBeUndefined();
    expect(cookieDomainFor('nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app')).toBeUndefined();
  });
});
