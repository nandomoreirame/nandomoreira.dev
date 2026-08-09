import { getCollection, type CollectionEntry } from 'astro:content';
import type { Post } from '../../content/schemas/post';
import { assertUniqueSlugs } from './validate';

export type PostEntry = CollectionEntry<'posts'>;

export type ArchiveYear = {
  year: string;
  count: number;
};

export const publishedPosts = (posts: readonly Post[]): Post[] => posts.filter((post) => post.draft !== true);

/** Newest first. Equal dates keep insertion order (stable sort). */
export const sortPosts = (posts: readonly Post[]): Post[] =>
  posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      const byDate = b.post.date.localeCompare(a.post.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    })
    .map(({ post }) => post);

/** Published and not archived. Drafts never appear. */
export const currentOf = (posts: readonly Post[]): Post[] =>
  publishedPosts(posts).filter((post) => post.archived !== true);

/** Published and archived. Drafts never appear. */
export const archivedOf = (posts: readonly Post[]): Post[] =>
  publishedPosts(posts).filter((post) => post.archived === true);

/** Years that have at least one archived post, newest year first. */
export const groupArchiveYears = (posts: readonly Post[]): ArchiveYear[] => {
  const counts = new Map<string, number>();

  for (const post of archivedOf(posts)) {
    const year = post.date.slice(0, 4);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.year.localeCompare(a.year));
};

/**
 * Single loader: fetch once, drop drafts once, assert unique slugs once.
 * Both the Post[] and PostEntry[] views derive from this path so the
 * uniqueness gate cannot be skipped by a route that only needs data.
 */
const loadEntries = async (): Promise<PostEntry[]> => {
  const entries = await getCollection('posts');
  const published = entries.filter((entry) => entry.data.draft !== true);

  assertUniqueSlugs(
    published.map((entry) => entry.data),
    'post',
  );

  const order = new Map(sortPosts(published.map((entry) => entry.data)).map((post, index) => [post.slug, index]));

  return [...published].sort((a, b) => (order.get(a.data.slug) ?? 0) - (order.get(b.data.slug) ?? 0));
};

const load = async (): Promise<Post[]> => (await loadEntries()).map((entry) => entry.data);

/** All published posts (current + archived). Used by sitemap, RSS, detail routes. */
export const getAllPosts = async (): Promise<Post[]> => load();

export const getCurrentPosts = async (): Promise<Post[]> => sortPosts(currentOf(await load()));

export const getArchivedPosts = async (): Promise<Post[]> => sortPosts(archivedOf(await load()));

export const getArchiveYears = async (): Promise<ArchiveYear[]> => groupArchiveYears(await load());

export const getArchivedPostsByYear = async (year: string): Promise<Post[]> =>
  sortPosts(archivedOf(await load()).filter((post) => post.date.startsWith(year)));

export const getPost = async (slug: string): Promise<Post | undefined> =>
  (await load()).find((post) => post.slug === slug);

/** Full collection entry for body rendering; drafts already excluded. */
export const getAllPostEntries = async (): Promise<PostEntry[]> => loadEntries();

export const getPostEntry = async (slug: string): Promise<PostEntry | undefined> =>
  (await loadEntries()).find((entry) => entry.data.slug === slug);
