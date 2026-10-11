import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LatestPosts from '../../src/components/home/LatestPosts.astro';
import type { Post } from '../../src/content/schemas/post';
import PostsPage from '../../src/pages/posts/index.astro';
import { BLOG_COPY } from '../../src/lib/posts/blog-copy';

const post = (overrides: Partial<Post> & Pick<Post, 'slug' | 'title' | 'date'>): Post => ({
  summary: 'Resumo do post.',
  markers: ['a', 'b', 'c'],
  draft: false,
  archived: false,
  ...overrides,
});

const render = async (posts: Post[]) => {
  const container = await AstroContainer.create();
  return container.renderToString(LatestPosts, { props: { posts } });
};

describe('LatestPosts', () => {
  it('renders nothing when there are no posts', async () => {
    const html = await render([]);
    expect(html).not.toContain('id="blog"');
    expect(html).not.toContain('Ver todos os posts');
  });

  it('lists posts with ListRow links to /<slug> and a stamp', async () => {
    const html = await render([
      post({
        slug: 'meu-post',
        title: 'Meu post',
        date: '2026-08-01',
        summary: 'Um resumo.',
      }),
    ]);

    expect(html).toContain('id="blog"');
    expect(html).toContain('href="/meu-post"');
    expect(html).toContain('Meu post');
    expect(html).toContain('Um resumo.');
    expect(html).toContain('08/2026');
  });

  it('offers a plain text link to /posts, never a primary button', async () => {
    const html = await render([
      post({ slug: 'a', title: 'A', date: '2026-01-01' }),
    ]);

    expect(html).toContain('href="/posts"');
    expect(html).toContain('Ver todos os posts');
    expect(html).not.toContain('variant="primary"');
    expect(html).not.toContain('bg-primary');
  });

  it('describes the blog with the same text as /posts, from one source', async () => {
    const html = await render([post({ slug: 'a', title: 'A', date: '2026-10-01' })]);
    expect(html).toContain(BLOG_COPY.description.replace(':)', ''));

    const container = await AstroContainer.create();
    expect(await container.renderToString(PostsPage)).toContain(BLOG_COPY.description.replace(':)', ''));
  });
});
