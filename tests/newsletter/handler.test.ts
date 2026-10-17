import { describe, expect, it, vi } from 'vitest';
import { handleSubscribe } from '../../src/lib/newsletter/handler';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';

const form = (fields: Record<string, string>) =>
  new Request('https://nandomoreira.dev/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
    body: new URLSearchParams(fields).toString(),
  });

const deps = (overrides = {}) => ({
  store: { save: vi.fn().mockResolvedValue(undefined) },
  limiter: { check: vi.fn().mockReturnValue(true) },
  now: () => new Date('2026-10-17T12:00:00Z'),
  ...overrides,
});

const location = (response: Response) => response.headers.get('location');

describe('handleSubscribe', () => {
  it('stores a valid email and redirects back with ok', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(response.status).toBe(303);
    expect(location(response)).toBe('/posts?assinatura=ok#novidades');
    expect(d.store.save).toHaveBeenCalledWith('fulano@exemplo.com', new Date('2026-10-17T12:00:00Z'));
  });

  it('rejects an invalid email without storing', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'nao-e-email' }), d);
    expect(location(response)).toBe('/posts?assinatura=invalido#novidades');
    expect(d.store.save).not.toHaveBeenCalled();
  });

  it('answers a filled honeypot as ok and stores nothing', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'bot@exemplo.com', [FORM_HONEYPOT]: 'x' }), d);
    expect(location(response)).toBe('/posts?assinatura=ok#novidades');
    expect(d.store.save).not.toHaveBeenCalled();
  });

  it('rate-limits per IP', async () => {
    const d = deps({ limiter: { check: vi.fn().mockReturnValue(false) } });
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(location(response)).toBe('/posts?assinatura=limite#novidades');
  });

  it('reports a storage failure as erro, never the driver message', async () => {
    const d = deps({ store: { save: vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED collection newsletter_subscribers')) } });
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(location(response)).toBe('/posts?assinatura=erro#novidades');
    expect(await response.text()).not.toContain('newsletter_subscribers');
  });

  it('refuses anything but a form POST', async () => {
    const response = await handleSubscribe(new Request('https://nandomoreira.dev/api/subscribe'), deps());
    expect(location(response)).toBe('/posts?assinatura=erro#novidades');
  });

  it('sends a home subscriber back to the home, from ?origem=/ on the form action', async () => {
    const request = new Request('https://nandomoreira.dev/api/subscribe?origem=/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
      body: new URLSearchParams({ email: 'fulano@exemplo.com' }).toString(),
    });
    expect(location(await handleSubscribe(request, deps()))).toBe('/?assinatura=ok#novidades');
  });

  it('also sends the rate-limit answer back to the origin', async () => {
    const request = new Request('https://nandomoreira.dev/api/subscribe?origem=/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
      body: 'email=a%40b.com',
    });
    const d = deps({ limiter: { check: vi.fn().mockReturnValue(false) } });
    expect(location(await handleSubscribe(request, d))).toBe('/?assinatura=limite#novidades');
  });

  it('ignores an origin outside the allowlist, so it is never an open redirect', async () => {
    for (const origem of ['https://evil.example', '//evil.example', '/contato', '']) {
      const request = new Request(`https://nandomoreira.dev/api/subscribe?origem=${encodeURIComponent(origem)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
        body: 'email=a%40b.com',
      });
      expect(location(await handleSubscribe(request, deps()))).toBe('/posts?assinatura=ok#novidades');
    }
  });
});

