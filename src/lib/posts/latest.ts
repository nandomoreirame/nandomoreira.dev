import type { Post } from '../../content/schemas/post';
import { currentOf, sortPosts } from '../content/posts';

/**
 * Newest current published posts for surfaces that must never show drafts,
 * including the home in development.
 */
export const latestPosts = <T extends Post>(posts: readonly T[], limit = 4): T[] =>
  sortPosts(currentOf(posts, false)).slice(0, limit);
