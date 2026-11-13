import { buildCaseMarkdown } from '../aeo/case-markdown';
import { OPEN_SOURCE_REPOS } from '../catalog/open-source';
import { collectionCopy } from '../catalog/collection-copy';
import { privacyMarkdown } from '../privacy/policy';
import { loadNow } from '../now/load';
import { nowMarkdown } from '../now/markdown';
import { setupMarkdown } from '../setup/setup';
import { HISTORY_PATH, historyMarkdown, siteVersionTag } from '../history/history';
import { loadSiteCommits } from '../history/commits';
import { RELEASES_PATH, liveReleases, releasesMarkdown } from '../releases/releases';
import { absoluteUrl } from '../aeo/urls';
import { collectionOfBlock, type CatalogCollection } from '../catalog/groups';
import {
  getAllProjects,
  getArchivedPostsByYear,
  getArchiveYears,
  getCurrentPosts,
  getPostEntry,
  getProfile,
  getProject,
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
import { EN_PUBLISHED } from '../i18n/live';
import { localeOfPath, type Locale } from '../i18n/locale';
import { staticCounterpart } from '../i18n/routes';
import { messagesFor } from '../i18n/messages';

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

/** Human and .md paths for a registry key in the given locale. */
const pathsFor = (
  key: string,
  locale: Locale,
): { lookupKey: string; humanPath: string; mdPath: string } | undefined => {
  if (locale === 'pt-BR') {
    const humanPath = key === '' ? '/' : `/${key}`;
    return {
      lookupKey: key,
      humanPath,
      mdPath: key === '' ? '/index.md' : `/${key}.md`,
    };
  }

  const absolute = key === '' ? '/en' : `/${key}`;
  const pair = staticCounterpart(absolute);
  if (pair) {
    const ptPath = pair['pt-BR'];
    return {
      lookupKey: ptPath === '/' ? '' : ptPath.slice(1),
      humanPath: pair.en,
      mdPath: pair.en === '/en' ? '/en/index.md' : `${pair.en}.md`,
    };
  }

  // English case: /en/portfolio/<slug> or /en/lab/<slug>
  const caseMatch = key.match(/^en\/(portfolio|lab)\/([^/]+)$/);
  if (caseMatch) {
    const collection = caseMatch[1];
    const slug = caseMatch[2];
    return {
      lookupKey: `${collection}/${slug}`,
      humanPath: `/${key}`,
      mdPath: `/${key}.md`,
    };
  }

  // English post at /en/<slug>
  if (key.startsWith('en/') && !key.slice(3).includes('/')) {
    const slug = key.slice(3);
    return {
      lookupKey: slug,
      humanPath: `/${key}`,
      mdPath: `/${key}.md`,
    };
  }

  return undefined;
};

export const markdownForPathIn = async (site: URL, path: string, live: boolean): Promise<AiPage | undefined> => {
  const key = normalise(path);
  const locale = localeOfPath(key === '' ? '/' : `/${key}`);

  if (locale === 'en' && !live) return undefined;

  const paths = pathsFor(key, locale);
  if (!paths) return undefined;

  const { lookupKey, humanPath, mdPath } = paths;

  if (lookupKey === '') {
    // Home: English profile, Portuguese cases until i18n-content (same as HomePage).
    const [profile, projects] = await Promise.all([
      getProfile(locale),
      getAllProjects(locale === 'en' ? 'pt-BR' : locale),
    ]);
    const portfolio = projects.filter(project => collectionOfBlock(project.block) === 'portfolio');
    const lab = projects.filter(project => collectionOfBlock(project.block) === 'lab');
    const markdown = homeMarkdown({ site, profile, portfolio, lab, locale });
    return page(titleFromFrontmatter(markdown, profile.headline), humanPath, mdPath, markdown);
  }

  if (lookupKey === 'sobre') {
    const [profile, projects] = await Promise.all([
      getProfile(locale),
      // Cases stay pt-BR until i18n-content; service caseSlug matches.
      getAllProjects(locale === 'en' ? 'pt-BR' : locale),
    ]);
    const markdown = aboutMarkdown({ site, profile, projects, locale });
    return page(
      titleFromFrontmatter(markdown, `${messagesFor(locale).about.title} | ${profile.name}`),
      humanPath,
      mdPath,
      markdown,
    );
  }

  if (lookupKey === 'portfolio' || lookupKey === 'lab') {
    const collection = lookupKey as CatalogCollection;
    const projects = (await getAllProjects(locale)).filter(project => collectionOfBlock(project.block) === collection);
    const copy = collectionCopy(collection, locale);
    const markdown = collectionMarkdown({
      site,
      collection,
      title: copy.title,
      description: copy.description,
      projects,
      openSource: collection === 'lab' ? OPEN_SOURCE_REPOS : [],
      locale,
    });
    return page(copy.title, humanPath, mdPath, markdown);
  }

  const caseMatch = lookupKey.match(/^(portfolio|lab)\/([^/]+)$/);
  if (caseMatch) {
    const collection = caseMatch[1] as CatalogCollection;
    const slug = caseMatch[2];
    const project = await getProject(slug, locale);
    if (!project || collectionOfBlock(project.block) !== collection) {
      return undefined;
    }
    const markdown = buildCaseMarkdown({ site, project });
    return page(project.title, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'posts') {
    const posts = await getCurrentPosts(locale);
    const markdown = postsMarkdown({ site, posts, locale });
    return page(messagesFor(locale).aiView.postsTitle, humanPath, mdPath, markdown);
  }

  // Archive has no English side (D12).
  if (lookupKey === 'posts/arquivo') {
    if (locale === 'en') return undefined;
    const years = await getArchiveYears();
    const markdown = archiveMarkdown({ site, years, locale });
    return page(messagesFor(locale).aiView.archiveTitle, humanPath, mdPath, markdown);
  }

  const yearMatch = lookupKey.match(/^posts\/arquivo\/(\d{4})$/);
  if (yearMatch) {
    if (locale === 'en') return undefined;
    const year = yearMatch[1];
    const posts = await getArchivedPostsByYear(year);
    if (posts.length === 0) return undefined;
    const markdown = archiveYearMarkdown({ site, year, posts, locale });
    return page(`${messagesFor(locale).aiView.archiveTitle} ${year}`, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'contato') {
    const profile = await getProfile(locale);
    const markdown = contactMarkdown({ site, profile, locale });
    return page(messagesFor(locale).contactPage.title, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'privacidade') {
    const markdown = privacyMarkdown({ site, locale });
    return page(messagesFor(locale).privacyPage.title, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'setup') {
    const markdown = setupMarkdown({ site, locale });
    return page(messagesFor(locale).setupPage.title, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'releases') {
    if (locale === 'en') return undefined;
    return page(
      'Versões do site',
      HISTORY_PATH,
      `${HISTORY_PATH}.md`,
      historyMarkdown({ site, commits: await loadSiteCommits(), now: new Date() }),
    );
  }

  if (lookupKey === 'releases/17') {
    if (locale === 'en') return undefined;
    const releases = liveReleases(siteVersionTag(await loadSiteCommits()));
    return page('Lançamentos', RELEASES_PATH, `${RELEASES_PATH}.md`, releasesMarkdown({ site, releases }));
  }

  if (lookupKey === 'now') {
    const data = await loadNow(locale);
    const markdown = nowMarkdown({ site, data, locale });
    return page(messagesFor(locale).nowPage.title, humanPath, mdPath, markdown);
  }

  if (lookupKey === 'mcp') {
    const markdown = connectMarkdown({ site, locale });
    return page(messagesFor(locale).mcpPage.title, humanPath, mdPath, markdown);
  }

  // Post at the site root (pt-BR) or under /en/<slug>
  if (!lookupKey.includes('/')) {
    const entry = await getPostEntry(lookupKey, locale);
    if (!entry) return undefined;

    const postPath = locale === 'en' ? `/en/${entry.data.slug}` : `/${entry.data.slug}`;
    const url = absoluteUrl(site, postPath);
    const markdown = [
      '---',
      `title: ${entry.data.title}`,
      `url: ${url}`,
      `date: ${entry.data.date}`,
      '---',
      '',
      entry.body ?? '',
    ].join('\n');

    return page(entry.data.title, humanPath, mdPath, markdown);
  }

  return undefined;
};

export const markdownForPath = async (site: URL, path: string): Promise<AiPage | undefined> =>
  markdownForPathIn(site, path, EN_PUBLISHED);
