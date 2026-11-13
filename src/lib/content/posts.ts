import { getCollection, type CollectionEntry } from 'astro:content';
import type { Post } from '../../content/schemas/post';
import { collectionOfBlock } from '../catalog/groups';
import type { Locale } from '../i18n/locale';
import { readingMinutes } from '../posts/reading-time';
import { assertPostTranslations, mergePost } from './translations';
import { assertUniqueSlugs } from './validate';

/** Collection entry with merged Post data (pt-BR source or English overlay). */
export type PostEntry = (CollectionEntry<'posts'> | CollectionEntry<'postsEn'>) & { data: Post };

/** A loaded post plus the minutes it takes to read (REQ-008). */
export type PostSummary = Post & { readingMinutes: number };

export type ArchiveYear = {
  year: string;
  count: number;
};

/** A page that exists in both languages: [pt-BR path, en path]. */
export type TranslationPair = { 'pt-BR': string; en: string };

/**
 * Drafts show on the local dev server (`astro dev`, mode development) and on
 * the homelab staging build (`astro build --mode staging`), where the author
 * reviews them. The production build and Vitest (mode test) never see them, so
 * the suite checks exactly what production serves.
 */
export const showDrafts = (env: { DEV: boolean; MODE: string }): boolean =>
  (env.DEV && env.MODE === 'development') || env.MODE === 'staging';

const SHOW_DRAFTS = showDrafts(import.meta.env);

export const publishedPosts = <T extends Post>(posts: readonly T[], includeDrafts = false): T[] =>
  includeDrafts ? [...posts] : posts.filter(post => post.draft !== true);

/**
 * The instant a post was published. Without `publishedAt` it is the start of
 * its day in the author's offset (São Paulo), so a timed post of the same day
 * still lists above it.
 */
const publishedInstant = (post: Post): number => Date.parse(post.publishedAt ?? `${post.date}T00:00:00-03:00`);

/** Newest first, by the full timestamp. Equal instants keep insertion order. */
export const sortPosts = <T extends Post>(posts: readonly T[]): T[] =>
  posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => publishedInstant(b.post) - publishedInstant(a.post) || a.index - b.index)
    .map(({ post }) => post);

/** Not archived. Drafts only when the caller opts in (the dev server). */
export const currentOf = <T extends Post>(posts: readonly T[], includeDrafts = false): T[] =>
  publishedPosts(posts, includeDrafts).filter(post => post.archived !== true);

/** Archived. Drafts only when the caller opts in (the dev server). */
export const archivedOf = <T extends Post>(posts: readonly T[], includeDrafts = false): T[] =>
  publishedPosts(posts, includeDrafts).filter(post => post.archived === true);

/** Drafts above published posts, each group keeping its order (dev only has drafts). */
export const draftsFirst = <T extends Post>(posts: readonly T[]): T[] => [
  ...posts.filter(post => post.draft === true),
  ...posts.filter(post => post.draft !== true),
];

/** Current drafts, newest first: the "Rascunhos em andamento" teaser. */
export const draftsOf = (posts: readonly Post[]): Post[] =>
  sortPosts(posts.filter(post => post.draft === true && post.archived !== true));

/** Years that have at least one archived post, newest year first. */
export const groupArchiveYears = (posts: readonly Post[], includeDrafts = false): ArchiveYear[] => {
  const counts = new Map<string, number>();

  for (const post of archivedOf(posts, includeDrafts)) {
    const year = post.date.slice(0, 4);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.year.localeCompare(a.year));
};

/**
 * Single loader: fetch once, assert unique slugs once (drafts included, so a
 * draft cannot later collide with a live post), drop drafts outside dev once.
 * Both the Post[] and PostEntry[] views derive from this path so the
 * uniqueness gate cannot be skipped by a route that only needs data.
 */
const loadAllEntries = async (): Promise<PostEntry[]> => {
  const entries = await getCollection('posts');
  assertUniqueSlugs(
    entries.map(entry => entry.data),
    'post',
  );
  return entries as PostEntry[];
};

/** English overlays merged onto pt-BR sources (drafts included for validation). */
const loadAllEntriesEn = async (): Promise<PostEntry[]> => {
  const [sourceEntries, overlayEntries] = await Promise.all([
    getCollection('posts'),
    getCollection('postsEn'),
  ]);
  const sources = sourceEntries.map(entry => entry.data);
  const overlays = overlayEntries.map(entry => entry.data);

  assertUniqueSlugs(sources, 'post');
  assertPostTranslations(sources, overlays);

  const bySlug = new Map(sources.map(post => [post.slug, post]));

  return overlayEntries.map(entry => {
    const merged = mergePost(bySlug.get(entry.data.translationOf)!, entry.data);
    return { ...entry, data: merged } as PostEntry;
  });
};

const loadEntries = async (locale: Locale = 'pt-BR'): Promise<PostEntry[]> => {
  const all = locale === 'en' ? await loadAllEntriesEn() : await loadAllEntries();
  const visible = all.filter(entry => SHOW_DRAFTS || entry.data.draft !== true);
  const order = new Map(sortPosts(visible.map(entry => entry.data)).map((post, index) => [post.slug, index]));

  return [...visible].sort((a, b) => (order.get(a.data.slug) ?? 0) - (order.get(b.data.slug) ?? 0));
};

const toSummary = (entry: PostEntry): PostSummary => ({
  ...entry.data,
  readingMinutes: readingMinutes(entry.body ?? ''),
});

const load = async (locale: Locale = 'pt-BR'): Promise<PostSummary[]> =>
  (await loadEntries(locale)).map(toSummary);

/** All visible posts (current + archived; drafts only in dev). Used by sitemap, RSS, detail routes. */
export const getAllPosts = async (locale: Locale = 'pt-BR'): Promise<PostSummary[]> => load(locale);

export const getCurrentPosts = async (locale: Locale = 'pt-BR'): Promise<PostSummary[]> =>
  draftsFirst(sortPosts(currentOf(await load(locale), SHOW_DRAFTS)));

export const getArchivedPosts = async (locale: Locale = 'pt-BR'): Promise<PostSummary[]> =>
  draftsFirst(sortPosts(archivedOf(await load(locale), SHOW_DRAFTS)));

export const getArchiveYears = async (): Promise<ArchiveYear[]> => groupArchiveYears(await load(), SHOW_DRAFTS);

/**
 * Drafts by title for the teaser, in every mode: production names what is
 * coming without linking it, because the draft pages exist only in dev.
 */
export const getUpcomingPosts = async (locale: Locale = 'pt-BR'): Promise<Post[]> => {
  const entries = locale === 'en' ? await loadAllEntriesEn() : await loadAllEntries();
  return draftsOf(entries.map(entry => entry.data));
};

export const getArchivedPostsByYear = async (year: string): Promise<PostSummary[]> =>
  draftsFirst(sortPosts(archivedOf(await load(), SHOW_DRAFTS).filter(post => post.date.startsWith(year))));

export const getPost = async (slug: string, locale: Locale = 'pt-BR'): Promise<PostSummary | undefined> =>
  (await load(locale)).find(post => post.slug === slug);

/** Full collection entry for body rendering; drafts only in dev. */
export const getAllPostEntries = async (locale: Locale = 'pt-BR'): Promise<PostEntry[]> =>
  loadEntries(locale);

export const getPostEntry = async (slug: string, locale: Locale = 'pt-BR'): Promise<PostEntry | undefined> =>
  (await loadEntries(locale)).find(entry => entry.data.slug === slug);

/** Post tagged with the language of the text it carries. */
export type Localized<T> = T & { locale: Locale };

/**
 * One entry per visible post: English when a translation exists for a current
 * post, archive always pt-BR. Machine routes prefer English per item (REQ-014).
 */
export const getMachinePosts = async (): Promise<Localized<PostSummary>[]> => {
  const [pt, en, overlays] = await Promise.all([getAllPosts(), getAllPosts('en'), getCollection('postsEn')]);
  const enBySlug = new Map(en.map(post => [post.slug, post]));
  const enBySource = new Map<string, PostSummary>();
  for (const entry of overlays) {
    const translated = enBySlug.get(entry.data.slug);
    if (translated) enBySource.set(entry.data.translationOf, translated);
  }

  return pt.map(post => {
    if (post.archived) return { ...post, locale: 'pt-BR' as const };
    const translated = enBySource.get(post.slug);
    if (translated) return { ...translated, locale: 'en' as const };
    return { ...post, locale: 'pt-BR' as const };
  });
};

/**
 * Content pages paired through their translations (posts and cases).
 * Posts use the English slug on `/en/<slug>`; cases keep the source slug.
 */
export const translationPairs = async (): Promise<TranslationPair[]> => {
  const pairs: TranslationPair[] = [];

  const [postSources, postOverlays, projectSources, projectOverlays] = await Promise.all([
    getCollection('posts'),
    getCollection('postsEn'),
    getCollection('projects'),
    getCollection('projectsEn'),
  ]);

  const postsBySlug = new Map(postSources.map(entry => [entry.data.slug, entry.data]));
  for (const entry of postOverlays) {
    const source = postsBySlug.get(entry.data.translationOf);
    if (!source) continue;
    if (!SHOW_DRAFTS && source.draft === true) continue;
    pairs.push({
      'pt-BR': `/${entry.data.translationOf}`,
      en: `/en/${entry.data.slug}`,
    });
  }

  const projectsBySlug = new Map(projectSources.map(entry => [entry.data.slug, entry.data]));
  for (const entry of projectOverlays) {
    const source = projectsBySlug.get(entry.data.translationOf);
    if (!source) continue;
    const collection = collectionOfBlock(source.block);
    pairs.push({
      'pt-BR': `/${collection}/${source.slug}`,
      en: `/en/${collection}/${source.slug}`,
    });
  }

  return pairs;
};
