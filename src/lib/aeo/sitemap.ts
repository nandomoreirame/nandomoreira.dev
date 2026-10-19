import type { Post } from '../../content/schemas/post';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { detailSlugs } from '../sales/catalog';
import { SALES_HOST_LIVE, salesPath } from '../sales/host';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  projects: readonly Project[];
  posts?: readonly Post[];
  /** Date the /setup page was last revised (SETUP_UPDATED_AT). */
  setupUpdatedAt?: string;
  /** When true, /servicos is omitted (main host 301s to the subdomain). */
  salesLive?: boolean;
}

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export interface SitemapEntry {
  path: string;
  lastmod?: string;
}

/**
 * Error pages and the discovery files themselves stay out: a crawler reaches
 * `robots.txt`, `llms.txt`, `llms-full.txt` and `ai-index.json` by convention,
 * and the per-case `.md` mirrors are agent alternates, so listing them adds
 * noise.
 *
 * The two résumé routes DO belong here (REQ-012 of structured-resume). They are
 * indexable content, not protocol files: an agent that never renders a page
 * still gets a route to the same facts. `/api/health` and `/api/hire` remain
 * absent, being a probe and a write endpoint.
 */
export const sitemapEntries = ({
  projects,
  posts = [],
  setupUpdatedAt,
  salesLive = SALES_HOST_LIVE,
}: Omit<Input, 'site'>): SitemapEntry[] => {
  const entries: SitemapEntry[] = [
    { path: '/' },
    { path: '/portfolio' },
    { path: '/lab' },
    { path: '/sobre' },
    { path: '/contato' },
    { path: '/mcp' },
    { path: '/setup', lastmod: setupUpdatedAt },
    { path: '/now' },
    { path: '/releases' },
    { path: '/releases/17' },
    { path: '/privacidade' },
    // On the main host only until the subdomain is live (sales-landing, REQ-033).
    ...(salesLive ? [] : [salesPath(undefined, false), ...detailSlugs().map(slug => salesPath(slug, false))]).map(
      path => ({ path }),
    ),
    { path: '/api/resume.json' },
    { path: '/api/resume.txt' },
    ...projects.map(project => ({
      path: `/${collectionOfBlock(project.block)}/${project.slug}`,
      lastmod: project.updatedAt,
    })),
  ];

  if (posts.length > 0) {
    // A listing changes when a post enters it: its date is the newest post's.
    const newest = (list: readonly Post[]): string | undefined =>
      list
        .map(post => post.date)
        .sort()
        .at(-1);
    entries.push({ path: '/posts', lastmod: newest(posts.filter(post => !post.archived)) });

    const years = new Set(posts.filter(post => post.archived).map(post => post.date.slice(0, 4)));
    if (years.size > 0) {
      entries.push({ path: '/posts/arquivo' });
      for (const year of [...years].sort().reverse()) {
        entries.push({
          path: `/posts/arquivo/${year}`,
          lastmod: newest(posts.filter(post => post.archived && post.date.startsWith(year))),
        });
      }
    }

    for (const post of posts) {
      entries.push({
        path: `/${post.slug}`,
        lastmod: post.date,
      });
    }
  }

  return entries;
};

export const buildSitemap = ({ site, ...rest }: Input): string => {
  const entries = sitemapEntries(rest);

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
