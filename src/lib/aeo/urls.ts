/**
 * Without `site` configured every machine route would emit relative URLs,
 * which makes a sitemap useless. Fail loudly instead.
 */
export const requireSite = (site: URL | undefined): URL => {
  if (!site) {
    throw new Error(
      'Astro `site` is not configured. Machine routes require absolute URLs.',
    );
  }

  return site;
};

export const absoluteUrl = (site: URL, path: string): string => {
  const normalized = `/${path.replace(/^\/+/, '')}`;

  return new URL(normalized, site).toString();
};
