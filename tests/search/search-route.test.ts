import { describe, expect, it } from 'vitest';
import { GET, prerender } from '../../src/pages/search.json';
import { getArchivedPosts, getCurrentPosts } from '../../src/lib/content';

describe('/search.json', () => {
  it('is built once, at build time', () => {
    expect(prerender).toBe(true);
  });

  it('answers JSON with every current post and no e-mail', async () => {
    const response = await GET({} as never);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const items = JSON.parse(body) as Array<{ path: string; kind: string }>;
    for (const post of await getCurrentPosts()) {
      if (!post.draft) expect(items.some((item) => item.path === `/${post.slug}`)).toBe(true);
    }
    expect(items.filter((item) => item.kind === 'archive')).toHaveLength((await getArchivedPosts()).filter((post) => !post.draft).length);
    expect(body).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});
