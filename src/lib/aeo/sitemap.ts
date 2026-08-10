import type { Post } from '../../content/schemas/post';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  projects: readonly Project[];
  posts?: readonly Post[];
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

/**
 * Error pages and the discovery files themselves stay out: a crawler reaches
 * `robots.txt` and `llms.txt` by convention, so listing them adds noise.
 *
 * The two résumé routes DO belong here (REQ-012 of structured-resume). They are
 * indexable content, not protocol files: an agent that never renders a page
 * still gets a route to the same facts. `/api/health` and `/api/hire` remain
 * absent, being a probe and a write endpoint.
 */
export const buildSitemap = ({ site, projects, posts = [] }: Input): string => {
  const entries: Entry[] = [
    { path: '/' },
    { path: '/portfolio' },
    { path: '/lab' },
    { path: '/sobre' },
    { path: '/contato' },
    { path: '/api/resume.json' },
    { path: '/api/resume.txt' },
    ...projects.map((project) => ({
      path: `/${collectionOfBlock(project.block)}/${project.slug}`,
      lastmod: project.updatedAt,
    })),
  ];

  if (posts.length > 0) {
    entries.push({ path: '/posts' });

    const years = new Set(
      posts.filter((post) => post.archived).map((post) => post.date.slice(0, 4)),
    );
    if (years.size > 0) {
      entries.push({ path: '/posts/arquivo' });
      for (const year of [...years].sort().reverse()) {
        entries.push({ path: `/posts/arquivo/${year}` });
      }
    }

    for (const post of posts) {
      entries.push({
        path: `/${post.slug}`,
        lastmod: post.date,
      });
    }
  }

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
