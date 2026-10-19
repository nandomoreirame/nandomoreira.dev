/**
 * Without `site` configured every machine route would emit relative URLs,
 * which makes a sitemap useless. Fail loudly instead.
 */
export const requireSite = (site: URL | undefined): URL => {
  if (!site) {
    throw new Error('Astro `site` is not configured. Machine routes require absolute URLs.');
  }

  return site;
};

export const absoluteUrl = (site: URL, path: string): string => {
  const normalized = `/${path.replace(/^\/+/, '')}`;

  return new URL(normalized, site).toString();
};

/**
 * The public path of a page. Pre-rendered pages see `/x.html` at build time
 * (build.format 'file') and a request may carry `/x/`; the sitemap and the
 * internal links use `/x`, so the canonical, the nav state and the AI view
 * switcher all go through this.
 */
export const pagePath = (pathname: string): string => {
  const trimmed = pathname.replace(/(?:\/index)?\.html$/, '').replace(/\/+$/, '');

  return trimmed === '' ? '/' : trimmed;
};

/** Absolute canonical URL of a page, always in its public form (see pagePath). */
export const canonicalUrl = (site: URL, path: string): string => absoluteUrl(site, pagePath(path));
