import { readLimitedText } from '../hire/read-body';
import type { Locale } from '../i18n/locale';
import { htmlLang } from '../i18n/locale';
import { type ConfirmStore, confirmSubscription, localeOfToken } from './confirm';
import { newsletterConfirmCopy } from './copy';

const redirectFor = (locale: Locale): string =>
  locale === 'en' ? '/en/posts?assinatura=ok#novidades' : '/posts?assinatura=ok#novidades';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => HTML_ESCAPES[char] ?? char);

/**
 * The GET answer changes nothing: link scanners and prefetchers fetch GET links,
 * so the confirmation happens only when the visitor presses the button (POST).
 */
export const confirmPage = (token: string, locale: Locale = 'pt-BR'): string => {
  const copy = newsletterConfirmCopy(locale);
  return `<!doctype html>
<html lang="${htmlLang(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(copy.pageTitle)}</title>
</head>
<body>
<main>
<h1>${escapeHtml(copy.heading)}</h1>
<p>${escapeHtml(copy.body)}</p>
<form method="post" action="/api/subscribe/confirm">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<button type="submit">${escapeHtml(copy.button)}</button>
</form>
</main>
</body>
</html>`;
};

export interface ConfirmDependencies {
  store: ConfirmStore;
  now: () => Date;
  /** Sent once, to the single request that confirmed the address. */
  onConfirmed: (email: string) => Promise<void>;
}

/**
 * Valid and invalid tokens redirect to the same place. The difference would
 * tell a probe whether an address is waiting for confirmation (REQ-003).
 * English subscriptions redirect to /en/posts; the stored locale only chooses
 * the copy and the path, and never appears in the response body.
 */
export const handleConfirm = async (
  request: Request,
  { store, now, onConfirmed }: ConfirmDependencies,
): Promise<Response> => {
  if (request.method === 'GET') {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    const locale = token ? await localeOfToken(token, store) : 'pt-BR';
    return new Response(confirmPage(token, locale), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }

  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
  }

  // Locale is resolved before claim so a valid and an expired token for the
  // same pending address still redirect to the same place (REQ-003).
  let locale: Locale = 'pt-BR';
  try {
    const token = new URLSearchParams(await readLimitedText(request)).get('token') ?? '';
    if (token) locale = await localeOfToken(token, store);
    const claimed = await confirmSubscription(token, now(), store);
    if (claimed) {
      try {
        await onConfirmed(claimed.email);
      } catch {
        console.warn('newsletter: confirmation follow-up could not be sent');
      }
    }
  } catch {
    console.warn('newsletter: confirmation could not be stored');
  }

  return new Response(null, {
    status: 303,
    headers: { location: redirectFor(locale), 'cache-control': 'no-store' },
  });
};
