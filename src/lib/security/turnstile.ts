const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Both keys or neither. One alone either breaks every form (secret without a widget)
 * or ships an unverified widget (site key without a secret), so it fails at boot.
 * The error names the missing variable, never the value of the other one.
 */
export const turnstileConfigOf = (env: Record<string, string | undefined>): { secret: string; siteKey: string } => {
  const secret = (env.TURNSTILE_SECRET_KEY ?? '').trim();
  const siteKey = (env.TURNSTILE_SITE_KEY ?? '').trim();
  if ((secret === '') !== (siteKey === '')) {
    const missing = secret === '' ? 'TURNSTILE_SECRET_KEY' : 'TURNSTILE_SITE_KEY';
    throw new Error(`Turnstile needs TURNSTILE_SECRET_KEY and TURNSTILE_SITE_KEY together. Missing: ${missing}.`);
  }
  return { secret, siteKey };
};

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
