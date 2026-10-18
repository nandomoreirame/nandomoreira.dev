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
  if (url.hostname === SALES_DEV_HOST) return subdomainRoute(path);
  if (!live) return undefined;
  if (url.hostname === SALES_HOST) return subdomainRoute(path);

  // Only the real main host moves to the subdomain; localhost and the
  // *.hosted.app backend keep serving /servicos (REQ-004).
  if (!MAIN_HOSTS.has(url.hostname)) return undefined;
  if (path !== SALES_BASE && !path.startsWith(`${SALES_BASE}/`)) return undefined;
  const rest = path.slice(SALES_BASE.length);
  if (!/^(\/[a-z0-9-]+)?$/.test(rest)) return undefined;

  return { redirect: `https://${SALES_HOST}${rest || '/'}${url.search}` };
};
