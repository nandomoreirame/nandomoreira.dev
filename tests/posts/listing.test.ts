import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getArchivedPosts, getCurrentPosts } from '../../src/lib/content';
import { toCompactStamp } from '../../src/lib/format/date';
import PostsPage from '../../src/pages/posts/index.astro';

const source = readFileSync('src/pages/posts/index.astro', 'utf8');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(PostsPage);
};

describe('/posts listing', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(source).toContain('getCurrentPosts');
    expect(source).not.toContain('getCollection(');
  });

  it('renders exactly the current posts, each linked at the root', async () => {
    const [html, current, archived] = await Promise.all([render(), getCurrentPosts(), getArchivedPosts()]);

    expect(current.length).toBeGreaterThan(0);
    // The header no longer prints a total (2026-10-08), so count the rows.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main.match(/<li>/g)).toHaveLength(current.length);

    for (const post of current) {
      expect(html).toContain(`href="/${post.slug}"`);
      expect(html).toContain(post.title);
      expect(html).toContain(toCompactStamp(post.date));
      expect(html).not.toContain(`href="/posts/${post.slug}"`);
    }

    for (const post of archived) {
      expect(html).not.toContain(post.title);
    }
  });

  it('links to the archive index', async () => {
    const html = await render();
    expect(html).toContain('href="/posts/arquivo"');
  });

  it('names the page Blog in the browser tab', async () => {
    expect(await render()).toContain('<title>Blog | Fernando Moreira</title>');
  });
});
