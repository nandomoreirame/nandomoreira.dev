import { getCollection, type CollectionEntry } from 'astro:content';
import type { Post } from '../../content/schemas/post';
import { assertUniqueSlugs } from './validate';

export type PostEntry = CollectionEntry<'posts'>;

export type ArchiveYear = {
  year: string;
  count: number;
};

/**
 * Drafts show on the local dev server (`astro dev`, mode development) and on
 * the homelab staging build (`astro build --mode staging`), where the author
 * reviews them. The production build and Vitest (mode test) never see them, so
 * the suite checks exactly what production serves.
 */
export const showDrafts = (env: { DEV: boolean; MODE: string }): boolean =>
  (env.DEV && env.MODE === 'development') || env.MODE === 'staging';

const SHOW_DRAFTS = showDrafts(import.meta.env);

export const publishedPosts = (posts: readonly Post[], includeDrafts = false): Post[] =>
  includeDrafts ? [...posts] : posts.filter((post) => post.draft !== true);

/**
 * The instant a post was published. Without `publishedAt` it is the start of
 * its day in the author's offset (São Paulo), so a timed post of the same day
 * still lists above it.
 */
const publishedInstant = (post: Post): number =>
  Date.parse(post.publishedAt ?? `${post.date}T00:00:00-03:00`);

/** Newest first, by the full timestamp. Equal instants keep insertion order. */
export const sortPosts = (posts: readonly Post[]): Post[] =>
  posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => publishedInstant(b.post) - publishedInstant(a.post) || a.index - b.index)
    .map(({ post }) => post);

/** Not archived. Drafts only when the caller opts in (the dev server). */
export const currentOf = (posts: readonly Post[], includeDrafts = false): Post[] =>
  publishedPosts(posts, includeDrafts).filter((post) => post.archived !== true);

/** Archived. Drafts only when the caller opts in (the dev server). */
export const archivedOf = (posts: readonly Post[], includeDrafts = false): Post[] =>
  publishedPosts(posts, includeDrafts).filter((post) => post.archived === true);

/** Drafts above published posts, each group keeping its order (dev only has drafts). */
export const draftsFirst = (posts: readonly Post[]): Post[] => [
  ...posts.filter((post) => post.draft === true),
  ...posts.filter((post) => post.draft !== true),
];

/** Current drafts, newest first: the "Rascunhos em andamento" teaser. */
export const draftsOf = (posts: readonly Post[]): Post[] =>
  sortPosts(posts.filter((post) => post.draft === true && post.archived !== true));

/** Years that have at least one archived post, newest year first. */
export const groupArchiveYears = (posts: readonly Post[], includeDrafts = false): ArchiveYear[] => {
  const counts = new Map<string, number>();

  for (const post of archivedOf(posts, includeDrafts)) {
    const year = post.date.slice(0, 4);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .filter((entry) => entry.count > 0)
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
    entries.map((entry) => entry.data),
    'post',
  );
  return entries;
};

const loadEntries = async (): Promise<PostEntry[]> => {
  const visible = (await loadAllEntries()).filter((entry) => SHOW_DRAFTS || entry.data.draft !== true);
  const order = new Map(sortPosts(visible.map((entry) => entry.data)).map((post, index) => [post.slug, index]));

  return [...visible].sort((a, b) => (order.get(a.data.slug) ?? 0) - (order.get(b.data.slug) ?? 0));
};

const load = async (): Promise<Post[]> => (await loadEntries()).map((entry) => entry.data);

/** All visible posts (current + archived; drafts only in dev). Used by sitemap, RSS, detail routes. */
export const getAllPosts = async (): Promise<Post[]> => load();

export const getCurrentPosts = async (): Promise<Post[]> =>
  draftsFirst(sortPosts(currentOf(await load(), SHOW_DRAFTS)));

export const getArchivedPosts = async (): Promise<Post[]> =>
  draftsFirst(sortPosts(archivedOf(await load(), SHOW_DRAFTS)));

export const getArchiveYears = async (): Promise<ArchiveYear[]> => groupArchiveYears(await load(), SHOW_DRAFTS);

/**
 * Drafts by title for the teaser, in every mode: production names what is
 * coming without linking it, because the draft pages exist only in dev.
 */
export const getUpcomingPosts = async (): Promise<Post[]> =>
  draftsOf((await loadAllEntries()).map((entry) => entry.data));

export const getArchivedPostsByYear = async (year: string): Promise<Post[]> =>
  draftsFirst(sortPosts(archivedOf(await load(), SHOW_DRAFTS).filter((post) => post.date.startsWith(year))));

export const getPost = async (slug: string): Promise<Post | undefined> =>
  (await load()).find((post) => post.slug === slug);

/** Full collection entry for body rendering; drafts only in dev. */
export const getAllPostEntries = async (): Promise<PostEntry[]> => loadEntries();

export const getPostEntry = async (slug: string): Promise<PostEntry | undefined> =>
  (await loadEntries()).find((entry) => entry.data.slug === slug);
