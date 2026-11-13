import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { confirmPage, handleConfirm } from '../../src/lib/newsletter/confirm-page';
import { confirmationMail } from '../../src/lib/newsletter/mail';
import { canConfirm, newConfirmation, toSubscriber } from '../../src/lib/newsletter/store';
import { ptLeftovers } from '../helpers/pt-leftovers';

/** Exact pt-BR page before this task; the default call must stay byte-identical. */
const PT_BR_PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Confirmar inscrição</title>
</head>
<body>
<main>
<h1>Confirmar inscrição na newsletter</h1>
<p>Clique no botão para confirmar que este e-mail é seu.</p>
<form method="post" action="/api/subscribe/confirm">
<input type="hidden" name="token" value="tok-1">
<button type="submit">Confirmar inscrição</button>
</form>
</main>
</body>
</html>`;

const NOW = new Date('2026-11-03T12:00:00Z');

const postRequest = (token: string) =>
  new Request('https://nandomoreira.dev/api/subscribe/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  });

const getRequest = (token: string) =>
  new Request(`https://nandomoreira.dev/api/subscribe/confirm?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });

describe('newsletter confirmation in English', () => {
  it('confirm page is English when locale is en, and pt-BR stays byte-identical', () => {
    expect(confirmPage('tok-1')).toBe(PT_BR_PAGE);
    expect(confirmPage('tok-1', 'pt-BR')).toBe(PT_BR_PAGE);

    const en = confirmPage('tok-1', 'en');
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('<title>Confirm subscription</title>');
    expect(en).toContain('Confirm subscription');
    expect(en).toContain('name="token" value="tok-1"');
    expect(ptLeftovers(en)).toEqual([]);
  });

  it('confirmation e-mail follows the subscription locale', async () => {
    const fromEn = await confirmationMail({
      email: 'ana@example.org',
      token: 'plain-token',
      locale: 'en',
    });
    expect(fromEn.subject).toBe('Confirm your subscription');
    expect(fromEn.html).toContain('lang="en"');
    expect(ptLeftovers(fromEn.html)).toEqual([]);

    const fromPt = await confirmationMail({ email: 'ana@example.org', token: 'plain-token' });
    expect(fromPt.subject).toBe('Confirme sua assinatura');
    expect(fromPt.html).toContain('Confirme seu e-mail');
  });

  it('redirects to /en/posts after confirming an English subscription', async () => {
    const response = await handleConfirm(postRequest('tok-en'), {
      store: {
        claim: async () => ({ email: 'ana@example.com', locale: 'en' }),
        localeOf: async () => 'en',
      },
      now: () => NOW,
      onConfirmed: vi.fn(async () => {}),
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en/posts?assinatura=ok#novidades');
  });

  it('redirects to /posts after confirming a Portuguese subscription', async () => {
    const response = await handleConfirm(postRequest('tok-pt'), {
      store: {
        claim: async () => ({ email: 'ana@example.com', locale: 'pt-BR' }),
        localeOf: async () => 'pt-BR',
      },
      now: () => NOW,
      onConfirmed: vi.fn(async () => {}),
    });
    expect(response.headers.get('location')).toBe('/posts?assinatura=ok#novidades');
  });

  it('GET confirm page uses the stored locale without consuming the token', async () => {
    const claim = vi.fn(async () => ({ email: 'ana@example.com', locale: 'en' as const }));
    const localeOf = vi.fn(async () => 'en' as const);
    const response = await handleConfirm(getRequest('tok-en'), {
      store: { claim, localeOf },
      now: () => NOW,
      onConfirmed: vi.fn(),
    });
    const body = await response.text();
    expect(claim).not.toHaveBeenCalled();
    expect(localeOf).toHaveBeenCalled();
    expect(body).toContain('<html lang="en">');
    expect(body).toContain('<title>Confirm subscription</title>');
  });

  it('stores locale on the pending subscriber and never leaks it into the public response', async () => {
    const doc = toSubscriber('ana@example.com', NOW, newConfirmation(NOW), 'en');
    expect(doc.locale).toBe('en');
    expect(toSubscriber('bob@example.com', NOW).locale).toBeUndefined();

    const response = await handleConfirm(postRequest('tok-en'), {
      store: {
        claim: async () => ({ email: 'ana@example.com', locale: 'en' }),
        localeOf: async () => 'en',
      },
      now: () => NOW,
      onConfirmed: vi.fn(async () => {}),
    });
    const body = await response.text();
    expect(body).toBe('');
    expect(body).not.toContain('locale');
    expect(JSON.stringify(Object.fromEntries(response.headers))).not.toMatch(/"locale"/i);
  });

  it('claim returns the stored locale so the redirect can choose the copy', async () => {
    const { confirmSubscription } = await import('../../src/lib/newsletter/confirm');
    const confirmation = newConfirmation(NOW);
    const doc: Record<string, unknown> = {
      ...toSubscriber('ana@example.com', NOW, confirmation, 'en'),
    };
    const store = {
      claim: async (tokenHash: string, now: Date) => {
        if (!canConfirm(doc, tokenHash, now)) return null;
        Object.assign(doc, { status: 'confirmed', confirmTokenHash: null });
        return {
          email: String(doc.email),
          locale: doc.locale === 'en' ? ('en' as const) : ('pt-BR' as const),
        };
      },
      localeOf: async () => 'en' as const,
    };
    const claimed = await confirmSubscription(confirmation.token, NOW, store);
    expect(claimed).toEqual({ email: 'ana@example.com', locale: 'en' });
    expect(createHash('sha256').update(confirmation.token).digest('hex')).toBe(confirmation.tokenHash);
  });
});
