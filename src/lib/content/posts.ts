import { getCollection, type CollectionEntry } from 'astro:content';
import type { Post } from '../../content/schemas/post';
import { assertUniqueSlugs } from './validate';

export type PostEntry = CollectionEntry<'posts'>;

export const publishedPosts = (posts: readonly Post[]): Post[] =>
  posts.filter((post) => post.draft !== true);

/** Newest first. Equal dates keep insertion order (stable sort). */
export const sortPosts = (posts: readonly Post[]): Post[] =>
  posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      const byDate = b.post.date.localeCompare(a.post.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    })
    .map(({ post }) => post);

const loadEntries = async (): Promise<PostEntry[]> => {
  const entries = await getCollection('posts');
  const published = entries.filter((entry) => entry.data.draft !== true);

  assertUniqueSlugs(
    published.map((entry) => entry.data),
    'post',
  );

  return published.sort((a, b) => {
    const byDate = b.data.date.localeCompare(a.data.date);
    return byDate !== 0 ? byDate : 0;
  });
};

const load = async (): Promise<Post[]> =>
  sortPosts(publishedPosts((await getCollection('posts')).map((entry) => entry.data)));

export const getAllPosts = async (): Promise<Post[]> => load();

export const getPost = async (slug: string): Promise<Post | undefined> =>
  (await load()).find((post) => post.slug === slug);

/** Full collection entry for body rendering; drafts already excluded. */
export const getAllPostEntries = async (): Promise<PostEntry[]> => loadEntries();

export const getPostEntry = async (slug: string): Promise<PostEntry | undefined> =>
  (await loadEntries()).find((entry) => entry.data.slug === slug);
