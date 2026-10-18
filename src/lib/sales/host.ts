/** The sales pages' own address (sales-landing, decided 2026-10-18). */
export const SALES_HOST = 'contrate.nandomoreira.dev';

/**
 * False until the custom domain answers on App Hosting. While false the pages
 * live at /servicos on the main host; flipping it turns on the rewrite, the
 * 301 from the main host and the canonical on the subdomain. Runbook:
 * docs/runbooks/sales-subdomain.md.
 */
export const SALES_HOST_LIVE = false;

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
const MAIN_ORIGIN = 'https://nandomoreira.dev';

/** Hosts that 301 /servicos to the subdomain once live (REQ-004). */
const MAIN_HOSTS = new Set(['nandomoreira.dev', 'www.nandomoreira.dev']);

/** First path segments the subdomain must never rewrite. */
const RESERVED = new Set(['api', 'go', 'servicos']);

/** Root-relative path of a sales page as served right now. */
export const salesPath = (slug?: string, live: boolean = SALES_HOST_LIVE): string => {
  if (live) return slug ? `/${slug}` : '/';
  return slug ? `${SALES_BASE}/${slug}` : SALES_BASE;
};

/** Absolute URL of a sales page: canonical, sitemap and links from the main site. */
export const salesUrl = (slug?: string, live: boolean = SALES_HOST_LIVE): string =>
  `${live ? `https://${SALES_HOST}` : MAIN_ORIGIN}${salesPath(slug, live)}`;

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
export const salesLink = (url: URL, slug?: string, live: boolean = SALES_HOST_LIVE): string => {
  const origin = previewOrigin(url);
  return origin ? `${origin}${salesPath(slug, true)}` : salesUrl(slug, live);
};

export type SalesRoute = { rewrite: string } | { redirect: string } | undefined;

/** Rewrite for a request that arrived on the sales host itself. */
const subdomainRoute = (path: string): SalesRoute => {
  if (path === '/') return { rewrite: SALES_BASE };
  const slug = /^\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (slug && !RESERVED.has(slug)) return { rewrite: `${SALES_BASE}/${slug}` };
  return undefined;
};

/**
 * What the middleware does with a request. Only a bare slug is rewritten, so
 * anything with a dot (assets, the pixel) or a second segment passes through.
 */
export const salesRouting = (url: URL, live: boolean = SALES_HOST_LIVE): SalesRoute => {
  const path = url.pathname;
  if (PREVIEW_HOSTS.has(url.hostname)) return subdomainRoute(path);

  // Dev and staging always move /servicos to their own sales host.
  const preview = previewOrigin(url);
  if (preview) return mainHostRedirect(url, preview);

  if (!live) return undefined;
  if (url.hostname === SALES_HOST) return subdomainRoute(path);

  // Only the real main host moves to the subdomain; the *.hosted.app
  // backend keeps serving /servicos (REQ-004).
  if (!MAIN_HOSTS.has(url.hostname)) return undefined;
  return mainHostRedirect(url, `https://${SALES_HOST}`);
};

/** 301 from /servicos[/slug] on a main host to the same page on `origin`. */
const mainHostRedirect = (url: URL, origin: string): SalesRoute => {
  const path = url.pathname;
  if (path !== SALES_BASE && !path.startsWith(`${SALES_BASE}/`)) return undefined;
  const rest = path.slice(SALES_BASE.length);
  if (!/^(\/[a-z0-9-]+)?$/.test(rest)) return undefined;
  return { redirect: `${origin}${rest || '/'}${url.search}` };
};
