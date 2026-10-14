import { describe, expect, it } from 'vitest';
import { handleSelf } from '../../src/lib/analytics/self';

const TOKEN = 't'.repeat(40);
const visit = (query: string, method = 'GET') => handleSelf(new Request(`https://nandomoreira.dev/eu${query}`, { method }), TOKEN);

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
    for (const response of [visit('?token=nope'), visit(''), visit(`?token=${TOKEN}x`), visit(`?token=${TOKEN}`, 'POST')]) {
      expect(response.status).toBe(404);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('answers 404 when no token is configured', () => {
    expect(handleSelf(new Request('https://nandomoreira.dev/eu?token=x'), null).status).toBe(404);
  });
});
