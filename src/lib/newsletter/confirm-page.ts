import { readLimitedText } from '../hire/read-body';
import { type ConfirmStore, confirmSubscription } from './confirm';

const REDIRECT = '/posts?assinatura=ok#novidades';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => HTML_ESCAPES[char] ?? char);

/**
 * The GET answer changes nothing: link scanners and prefetchers fetch GET links,
 * so the confirmation happens only when the visitor presses the button (POST).
 */
export const confirmPage = (token: string): string => `<!doctype html>
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
<input type="hidden" name="token" value="${escapeHtml(token)}">
<button type="submit">Confirmar inscrição</button>
</form>
</main>
</body>
</html>`;

export interface ConfirmDependencies {
  store: ConfirmStore;
  now: () => Date;
  /** Sent once, to the single request that confirmed the address. */
  onConfirmed: (email: string) => Promise<void>;
}

/**
 * Valid and invalid tokens redirect to the same place. The difference would
 * tell a probe whether an address is waiting for confirmation (REQ-003).
 */
export const handleConfirm = async (
  request: Request,
  { store, now, onConfirmed }: ConfirmDependencies,
): Promise<Response> => {
  if (request.method === 'GET') {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    return new Response(confirmPage(token), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }

  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
  }

  try {
    const token = new URLSearchParams(await readLimitedText(request)).get('token') ?? '';
    const email = await confirmSubscription(token, now(), store);
    if (email) {
      try {
        await onConfirmed(email);
      } catch {
        console.warn('newsletter: confirmation follow-up could not be sent');
      }
    }
  } catch {
    console.warn('newsletter: confirmation could not be stored');
  }

  return new Response(null, {
    status: 303,
    headers: { location: REDIRECT, 'cache-control': 'no-store' },
  });
};
