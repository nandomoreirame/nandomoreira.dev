import type { Locale } from '../i18n/locale';
import { EN_PUBLISHED } from '../i18n/live';

/** The sales pages' own address (sales-landing, decided 2026-10-18). */
export const SALES_HOST = 'contrate.nandomoreira.dev';

/**
 * True since the custom domain answered on Firebase Hosting (2026-10-18): the
 * subdomain rewrites onto the pages, the main host 301s /servicos to it and
 * the canonical points there. Flipping it back to false is the rollback.
 * Runbook: docs/runbooks/sales-subdomain.md.
 */
export const SALES_HOST_LIVE = true;

/**
 * Local stand-in for SALES_HOST, so the landing can be reviewed at its own
 * address in `astro dev` (map it to ::1 in /etc/hosts). It answers whatever
 * the flag says: a .local name never resolves outside this machine.
 */
export const SALES_DEV_HOST = 'contrate.nandomoreira.local';

/** Homelab staging stand-in (scripts/deploy-staging.sh); also flag-independent. */
export const SALES_STAGING_HOST = 'contrate.nandomoreira.home';

const PREVIEW_HOSTS = new Set([SALES_DEV_HOST, SALES_STAGING_HOST]);

/** Main-site hosts of `astro dev` and of the homelab staging. */
const DEV_MAIN_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const STAGING_MAIN_HOST = 'nandomoreira.home';

export const SALES_BASE = '/servicos';
export const SALES_BASE_EN = '/en/services';
const MAIN_ORIGIN = 'https://nandomoreira.dev';

/** Hosts that 301 /servicos to the subdomain once live (REQ-004). */
const MAIN_HOSTS = new Set(['nandomoreira.dev', 'www.nandomoreira.dev']);

/** First path segments the subdomain must never rewrite. */
const RESERVED = new Set(['api', 'go', 'servicos', 'en', 'services']);

/** Root-relative path of a sales page as served right now. */
export const salesPath = (slug?: string, live: boolean = SALES_HOST_LIVE, locale: Locale = 'pt-BR'): string => {
  if (locale === 'en') return `${live ? '/en' : SALES_BASE_EN}${slug ? `/${slug}` : ''}`;
  if (live) return slug ? `/${slug}` : '/';
  return slug ? `${SALES_BASE}/${slug}` : SALES_BASE;
};

/** Absolute URL of a sales page: canonical, sitemap and links from the main site. */
export const salesUrl = (slug?: string, live: boolean = SALES_HOST_LIVE, locale: Locale = 'pt-BR'): string =>
  `${live ? `https://${SALES_HOST}` : MAIN_ORIGIN}${salesPath(slug, live, locale)}`;

/**
 * Sales origin of a dev or staging main host, keeping the request's scheme
 * and port; undefined in production, where the flag decides.
 */
const previewOrigin = (url: URL): string | undefined => {
  const port = url.port ? `:${url.port}` : '';
  if (DEV_MAIN_HOSTS.has(url.hostname)) return `${url.protocol}//${SALES_DEV_HOST}${port}`;
  if (url.hostname === STAGING_MAIN_HOST) return `${url.protocol}//${SALES_STAGING_HOST}${port}`;
  return undefined;
};

/** Link to a sales page from the main site, on the environment the request came from. */
export const salesLink = (
  url: URL,
  slug?: string,
  live: boolean = SALES_HOST_LIVE,
  locale: Locale = 'pt-BR',
): string => {
  const origin = previewOrigin(url);
  return origin ? `${origin}${salesPath(slug, true, locale)}` : salesUrl(slug, live, locale);
};

export type SalesRoute = { rewrite: string } | { redirect: string } | undefined;

/** Rewrite for a request that arrived on the sales host itself. */
const subdomainRoute = (path: string, en: boolean): SalesRoute => {
  if (en && path === '/en') return { rewrite: SALES_BASE_EN };
  if (path.startsWith('/en/')) {
    const slug = /^\/en\/([a-z0-9-]+)$/.exec(path)?.[1];
    return en && slug && !RESERVED.has(slug) ? { rewrite: `${SALES_BASE_EN}/${slug}` } : undefined;
  }
  if (path === '/') return { rewrite: SALES_BASE };
  const slug = /^\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (slug && !RESERVED.has(slug)) return { rewrite: `${SALES_BASE}/${slug}` };
  return undefined;
};

/**
 * What the middleware does with a request. Only a bare slug is rewritten, so
 * anything with a dot (assets, the pixel) or a second segment passes through.
 */
export const salesRouting = (url: URL, live: boolean = SALES_HOST_LIVE, en: boolean = EN_PUBLISHED): SalesRoute => {
  // A trailing slash names the same page; strip it once for every branch below.
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
  if (PREVIEW_HOSTS.has(url.hostname)) return subdomainRoute(path, en);

  // Dev and staging always move /servicos to their own sales host.
  const preview = previewOrigin(url);
  if (preview) return mainHostRedirect(url, path, preview, en);

  if (!live) return undefined;
  if (url.hostname === SALES_HOST) return subdomainRoute(path, en);

  // Only the real main host moves to the subdomain; the *.hosted.app
  // backend keeps serving /servicos (REQ-004).
  if (!MAIN_HOSTS.has(url.hostname)) return undefined;
  return mainHostRedirect(url, path, `https://${SALES_HOST}`, en);
};

/**
 * The internal path a rewrite asks for, with the request's query: next() takes
 * only what it is given, and without this the `?envio=` the form handler sends
 * back would never reach the landing on the subdomain.
 */
export const rewriteTarget = (rewrite: string, url: URL): string => `${rewrite}${url.search}`;

/** 301 from /servicos[/slug] on a main host to the same page on `origin`. */
const mainHostRedirect = (url: URL, path: string, origin: string, en: boolean): SalesRoute => {
  if (en && (path === SALES_BASE_EN || path.startsWith(`${SALES_BASE_EN}/`))) {
    const rest = path.slice(SALES_BASE_EN.length);
    return /^(\/[a-z0-9-]+)?$/.test(rest) ? { redirect: `${origin}/en${rest}${url.search}` } : undefined;
  }
  if (path !== SALES_BASE && !path.startsWith(`${SALES_BASE}/`)) return undefined;
  const rest = path.slice(SALES_BASE.length);
  if (!/^(\/[a-z0-9-]+)?$/.test(rest)) return undefined;
  return { redirect: `${origin}${rest || '/'}${url.search}` };
};
