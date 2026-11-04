const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Empty when the secret is unset, which leaves verification off. */
export const turnstileSecretOf = (env: Record<string, string | undefined>): string =>
  (env.TURNSTILE_SECRET_KEY ?? '').trim();

export const requiresCaptcha = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

export const verifyTurnstile = async (
  token: string,
  { secret, fetch, remoteIp }: { secret: string; fetch: typeof globalThis.fetch; remoteIp: string },
): Promise<boolean> => {
  if (token.trim() === '') return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
  const response = await fetch(SITEVERIFY, { method: 'POST', body });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
};
