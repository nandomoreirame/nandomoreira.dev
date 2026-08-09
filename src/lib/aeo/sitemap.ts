import type { Project } from '../../content/schemas/project';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  projects: readonly Project[];
}

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

interface Entry {
  path: string;
  lastmod?: string;
}

/** Machine routes and error pages are deliberately absent (REQ-012). */
export const buildSitemap = ({ site, projects }: Input): string => {
  const entries: Entry[] = [
    { path: '/' },
    { path: '/projetos' },
    ...projects.map((project) => ({
      path: `/projetos/${project.slug}`,
      lastmod: project.updatedAt,
    })),
  ];

  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = `    <loc>${escapeXml(absoluteUrl(site, path))}</loc>`;
      const modified = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';

      return `  <url>\n${loc}${modified}\n  </url>`;
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
};
