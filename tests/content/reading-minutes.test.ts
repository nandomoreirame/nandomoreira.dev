import { describe, expect, it } from 'vitest';
import { getAllPosts, getCurrentPosts, getPost } from '../../src/lib/content';

describe('readingMinutes on loaded posts', () => {
  it('attaches at least one minute to every visible post', async () => {
    const posts = await getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) expect(post.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('keeps it through the current listing and the single lookup', async () => {
    const [first] = await getCurrentPosts();
    expect(first?.readingMinutes).toBeGreaterThanOrEqual(1);
    expect((await getPost(first!.slug))?.readingMinutes).toBe(first!.readingMinutes);
  });
});
