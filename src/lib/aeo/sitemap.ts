import type { Note } from '../../content/schemas/note';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  projects: readonly Project[];
  notes?: readonly Note[];
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
export const buildSitemap = ({ site, projects, notes = [] }: Input): string => {
  const entries: Entry[] = [
    { path: '/' },
    { path: '/portfolio' },
    { path: '/lab' },
    { path: '/sobre' },
    ...projects.map((project) => ({
      path: `/${collectionOfBlock(project.block)}/${project.slug}`,
      lastmod: project.updatedAt,
    })),
  ];

  if (notes.length > 0) {
    entries.push({ path: '/notas' });
    for (const note of notes) {
      entries.push({
        path: `/notas/${note.slug}`,
        lastmod: note.date,
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
