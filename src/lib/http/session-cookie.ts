/**
 * Firebase App Hosting forwards only the cookie named `__session` and drops
 * every other name before the request reaches the server. The author mark and
 * the /posts view therefore share this one value: `self`, `grid` or `self.grid`.
 */
export const SESSION_COOKIE = '__session';

const SELF_TOKEN = 'self';
const GRID_TOKEN = 'grid';
const YEAR_SECONDS = 60 * 60 * 24 * 365;
const SITE_DOMAIN = 'nandomoreira.dev';

export type SessionView = 'list' | 'grid';

export interface SessionState {
  self: boolean;
  view: SessionView;
}

/** Unknown tokens are ignored. `self` alone stays on the list. */
export const parseSession = (raw: string | null | undefined): SessionState => {
  const tokens = new Set((raw ?? '').split('.'));
  return {
    self: tokens.has(SELF_TOKEN),
    view: tokens.has(GRID_TOKEN) ? 'grid' : 'list',
  };
};

/** The first `__session` pair in a Cookie header, or undefined when it is absent. */
export const sessionValueFrom = (cookieHeader: string | null | undefined): string | undefined => {
  for (const part of (cookieHeader ?? '').split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === SESSION_COOKIE) return trimmed.slice(eq + 1);
  }
  return undefined;
};

/** `null` means the cookie should be cleared: a visitor on the list stores nothing. */
export const serializeSession = (state: SessionState): string | null => {
  const tokens: string[] = [];
  if (state.self) tokens.push(SELF_TOKEN);
  if (state.view === 'grid') tokens.push(GRID_TOKEN);
  return tokens.length === 0 ? null : tokens.join('.');
};

/**
 * The site and every subdomain share one cookie. Any other host (the
 * *.hosted.app backend, localhost) keeps a host-only cookie.
 */
export const cookieDomainFor = (hostname: string): string | undefined =>
  hostname === SITE_DOMAIN || hostname.endsWith(`.${SITE_DOMAIN}`) ? SITE_DOMAIN : undefined;

export const sessionSetCookie = (
  value: string | null,
  options: { secure: boolean; domain?: string },
): string => {
  const parts = [
    `${SESSION_COOKIE}=${value ?? ''}`,
    'Path=/',
    `Max-Age=${value === null ? 0 : YEAR_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
};
