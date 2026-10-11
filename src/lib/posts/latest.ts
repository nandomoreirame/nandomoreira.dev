import type { Post } from '../../content/schemas/post';
import { currentOf, sortPosts } from '../content/posts';

/**
 * Newest current published posts for surfaces that must never show drafts,
 * including the home in development.
 */
export const latestPosts = (posts: readonly Post[], limit = 4): Post[] =>
  sortPosts(currentOf(posts, false)).slice(0, limit);
