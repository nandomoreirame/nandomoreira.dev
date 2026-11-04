import { describe, expect, it, vi } from 'vitest';
import { handleConfirm } from '../../src/lib/newsletter/confirm-page';

const NOW = new Date('2026-11-03T12:00:00Z');

const getRequest = (token: string) =>
  new Request(`https://nandomoreira.dev/api/subscribe/confirm?token=${encodeURIComponent(token)}`, { method: 'GET' });

const postRequest = (token: string) =>
  new Request('https://nandomoreira.dev/api/subscribe/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  });

describe('confirmação em duas etapas', () => {
  it('GET mostra a página sem confirmar, para leitor de link não consumir o token', async () => {
    const claim = vi.fn(async () => 'ana@example.com');
    const response = await handleConfirm(getRequest('tok-1'), {
      store: { claim },
      now: () => NOW,
      onConfirmed: vi.fn(),
    });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(claim).not.toHaveBeenCalled();
    expect(body).toContain('method="post" action="/api/subscribe/confirm"');
    expect(body).toContain('name="token" value="tok-1"');
  });

  it('o token é escapado na página', async () => {
    const response = await handleConfirm(getRequest('"><script>x</script>'), {
      store: { claim: vi.fn(async () => null) },
      now: () => NOW,
      onConfirmed: vi.fn(),
    });
    const body = await response.text();
    expect(body).not.toContain('<script>x</script>');
  });

  it('POST confirma e avisa uma única vez', async () => {
    const onConfirmed = vi.fn(async () => {});
    const response = await handleConfirm(postRequest('tok-1'), {
      store: { claim: vi.fn(async () => 'ana@example.com') },
      now: () => NOW,
      onConfirmed,
    });
    expect(onConfirmed).toHaveBeenCalledWith('ana@example.com');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/posts?assinatura=ok#novidades');
  });

  it('POST com token inválido responde igual e não avisa', async () => {
    const onConfirmed = vi.fn(async () => {});
    const response = await handleConfirm(postRequest('errado'), {
      store: { claim: vi.fn(async () => null) },
      now: () => NOW,
      onConfirmed,
    });
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe('/posts?assinatura=ok#novidades');
  });
});
