import { buildCaseMarkdown } from '../aeo/case-markdown';
import { OPEN_SOURCE_REPOS } from '../catalog/open-source';
import { COLLECTION_COPY } from '../catalog/collection-copy';
import { privacyMarkdown } from '../privacy/policy';
import { loadNow } from '../now/load';
import { nowMarkdown } from '../now/markdown';
import { NOW_PATH } from '../now/now';
import { SETUP_PATH, setupMarkdown } from '../setup/setup';
import { absoluteUrl } from '../aeo/urls';
import { collectionOfBlock, type CatalogCollection } from '../catalog/groups';
import {
  getAllProjects,
  getArchivedPostsByYear,
  getArchiveYears,
  getCurrentPosts,
  getPostEntry,
  getProfile,
} from '../content';
import {
  aboutMarkdown,
  archiveMarkdown,
  archiveYearMarkdown,
  collectionMarkdown,
  connectMarkdown,
  contactMarkdown,
  homeMarkdown,
  postsMarkdown,
} from './pages';

export type AiPage = {
  title: string;
  humanPath: string;
  mdPath: string;
  markdown: string;
};

/** Strip a trailing slash; treat '' and 'index' as the home key. */
const normalise = (path: string): string => {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (trimmed === '' || trimmed === 'index') return '';
  return trimmed;
};

const page = (title: string, humanPath: string, mdPath: string, markdown: string): AiPage => ({
  title,
  humanPath,
  mdPath,
  markdown,
});

const titleFromFrontmatter = (markdown: string, fallback: string): string => {
  const match = markdown.match(/^---\n[\s\S]*?\ntitle:\s*(.+)\n/);
  return match?.[1]?.trim() || fallback;
};

export const markdownForPath = async (site: URL, path: string): Promise<AiPage | undefined> => {
  const key = normalise(path);

  if (key === '') {
    const [profile, projects] = await Promise.all([getProfile(), getAllProjects()]);
    const portfolio = projects.filter(project => collectionOfBlock(project.block) === 'portfolio');
    const lab = projects.filter(project => collectionOfBlock(project.block) === 'lab');
    const markdown = homeMarkdown({ site, profile, portfolio, lab });
    return page(titleFromFrontmatter(markdown, profile.headline), '/', '/index.md', markdown);
  }

  if (key === 'sobre') {
    const [profile, projects] = await Promise.all([getProfile(), getAllProjects()]);
    const markdown = aboutMarkdown({ site, profile, projects });
    return page(titleFromFrontmatter(markdown, `Sobre | ${profile.name}`), '/sobre', '/sobre.md', markdown);
  }

  if (key === 'portfolio' || key === 'lab') {
    const collection = key as CatalogCollection;
    const projects = (await getAllProjects()).filter(project => collectionOfBlock(project.block) === collection);
    const copy = COLLECTION_COPY[collection];
    const markdown = collectionMarkdown({
      site,
      collection,
      title: copy.title,
      description: copy.description,
      projects,
      openSource: collection === 'lab' ? OPEN_SOURCE_REPOS : [],
    });
    return page(copy.title, `/${collection}`, `/${collection}.md`, markdown);
  }

  const caseMatch = key.match(/^(portfolio|lab)\/([^/]+)$/);
  if (caseMatch) {
    const collection = caseMatch[1] as CatalogCollection;
    const slug = caseMatch[2];
    const project = (await getAllProjects()).find(entry => entry.slug === slug);
    if (!project || collectionOfBlock(project.block) !== collection) {
      return undefined;
    }
    const markdown = buildCaseMarkdown({ site, project });
    return page(project.title, `/${collection}/${slug}`, `/${collection}/${slug}.md`, markdown);
  }

  if (key === 'posts') {
    const posts = await getCurrentPosts();
    const markdown = postsMarkdown({ site, posts });
    return page('Posts', '/posts', '/posts.md', markdown);
  }

  if (key === 'posts/arquivo') {
    const years = await getArchiveYears();
    const markdown = archiveMarkdown({ site, years });
    return page('Arquivo', '/posts/arquivo', '/posts/arquivo.md', markdown);
  }

  const yearMatch = key.match(/^posts\/arquivo\/(\d{4})$/);
  if (yearMatch) {
    const year = yearMatch[1];
    const posts = await getArchivedPostsByYear(year);
    if (posts.length === 0) return undefined;
    const markdown = archiveYearMarkdown({ site, year, posts });
    return page(`Arquivo ${year}`, `/posts/arquivo/${year}`, `/posts/arquivo/${year}.md`, markdown);
  }

  if (key === 'contato') {
    const profile = await getProfile();
    const markdown = contactMarkdown({ site, profile });
    return page('Contato', '/contato', '/contato.md', markdown);
  }

  if (key === 'privacidade') {
    return page('Política de privacidade', '/privacidade', '/privacidade.md', privacyMarkdown({ site }));
  }

  if (key === 'setup') {
    return page('Setup', SETUP_PATH, `${SETUP_PATH}.md`, setupMarkdown({ site }));
  }

  if (key === 'now') {
    const data = await loadNow();
    const markdown = nowMarkdown({ site, data });
    return page('Agora', NOW_PATH, '/now.md', markdown);
  }

  if (key === 'mcp') {
    const markdown = connectMarkdown({ site });
    return page('Conectar via MCP', '/mcp', '/mcp.md', markdown);
  }

  // Post at the site root: /<slug>
  if (!key.includes('/')) {
    const entry = await getPostEntry(key);
    if (!entry) return undefined;

    const url = absoluteUrl(site, `/${entry.data.slug}`);
    const markdown = [
      '---',
      `title: ${entry.data.title}`,
      `url: ${url}`,
      `date: ${entry.data.date}`,
      '---',
      '',
      entry.body ?? '',
    ].join('\n');

    return page(entry.data.title, `/${entry.data.slug}`, `/${entry.data.slug}.md`, markdown);
  }

  return undefined;
};
