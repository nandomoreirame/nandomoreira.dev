import { describe, expect, it } from 'vitest';
import { getCurrentPosts } from '../../src/lib/content';

describe('snapshot on the published current posts', () => {
  it('every published current post carries a snapshot', async () => {
    const missing = (await getCurrentPosts()).filter((post) => !post.draft && !post.snapshot).map((post) => post.slug);
    expect(missing).toEqual([]);
  });
});
