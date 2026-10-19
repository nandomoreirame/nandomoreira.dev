import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPosts, getArchivedPosts, getCurrentPosts } from '../../src/lib/content';
import { toShortDate } from '../../src/lib/format/date';
import PostsPage from '../../src/pages/posts/index.astro';

const source = readFileSync('src/pages/posts/index.astro', 'utf8');

const render = async (search = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(PostsPage, { request: new Request(`https://nandomoreira.dev/posts${search}`) });
};
const slugsOn = (html: string) => [...html.matchAll(/<article[^>]*data-latest-post[\s\S]*?<a[^>]*href="\/([^"]+)"/g)].map((m) => m[1]);

describe('/posts listing', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(source).toContain('getCurrentPosts');
    expect(source).not.toContain('getCollection(');
  });

  it('renders exactly the current posts, each linked at the root', async () => {
    const [current, archived] = await Promise.all([getCurrentPosts(), getArchivedPosts()]);
    // Six a page since 2026-10-17: walk every page.
    const pages = await Promise.all(
      Array.from({ length: Math.ceil(current.length / 6) }, (_, index) => render(index ? `?pagina=${index + 1}` : '')),
    );
    const html = pages.join('');

    expect(current.length).toBeGreaterThan(0);
    expect(pages.flatMap(slugsOn)).toEqual(current.map((post) => post.slug));

    for (const post of current) {
      expect(html).toContain(`href="/${post.slug}"`);
      expect(html).toContain(post.title);
      expect(html).toContain(toShortDate(post.date));
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

  it('puts the archive link beside the post count, shaped like the RSS link', async () => {
    const html = await render();
    const row = html.slice(html.indexOf('data-listing-bar'), html.indexOf('data-latest-post'));
    const rss = row.match(/<a[^>]*href="\/rss\.xml"[^>]*>/)?.[0] ?? '';
    const archive = row.match(/<a[^>]*href="\/posts\/arquivo"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(archive).toMatch(/data-icon="lucide:archive"[\s\S]*Arquivo por ano/);
    expect(archive.match(/class="([^"]*)"/)?.[1]).toBe(rss.match(/class="([^"]*)"/)?.[1]);
    expect(row.indexOf('href="/posts/arquivo"')).toBeLessThan(row.indexOf('data-post-count'));
    expect(html.match(/href="\/posts\/arquivo"/g)).toHaveLength(1);
  });

  it('puts the archive then the count on the left, the feed alone on the right', async () => {
    const html = await render();
    const bar = html.match(/<div[^>]*data-listing-bar[^>]*>/)?.[0] ?? '';
    expect(bar).toContain('justify-between');
    const left = html.match(/<div class="flex flex-wrap items-center gap-sm">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(left).toContain('href="/posts/arquivo"');
    expect(left).toContain('data-post-count');
    expect(left).not.toContain('href="/rss.xml"');
    const row = html.slice(html.indexOf('data-listing-bar'), html.indexOf('data-latest-post'));
    expect(row.indexOf('data-post-count')).toBeLessThan(row.indexOf('href="/rss.xml"'));
  });

  it('keeps the drafts apart from the newsletter', async () => {
    const html = await render();
    expect(html).toMatch(/<div[^>]*class="mt-2xl mb-3xl"[^>]*>\s*<section[^>]*id="novidades"/);
  });

  it('names the page Blog in the browser tab', async () => {
    expect(await render()).toContain('<title>Blog // Fernando Moreira</title>');
  });

  it('shows six current posts a page, newest first, with the pagination under them', async () => {
    const current = await getCurrentPosts();
    const first = await render();
    expect(slugsOn(first)).toEqual(current.slice(0, 6).map((post) => post.slug));
    expect(first).toMatch(/<nav[^>]*aria-label="Paginação"/);
    expect(first.indexOf('data-pagination')).toBeGreaterThan(first.lastIndexOf('data-latest-post'));
  });

  it('reads the page from ?pagina and clamps a page past the end', async () => {
    const current = await getCurrentPosts();
    const second = await render('?pagina=2');
    expect(slugsOn(second)).toEqual(current.slice(6, 12).map((post) => post.slug));
    expect(second).toContain('href="/posts"');
    const far = await render('?pagina=99');
    expect(slugsOn(far)).toEqual(slugsOn(await render(`?pagina=${Math.ceil(current.length / 6)}`)));
  });

  it('keeps the post count on the whole blog, not the page', async () => {
    const html = await render('?pagina=2');
    expect(html).toMatch(/data-post-count[^>]*>\s*\d+ artigos?\s*</);
    const published = (await getAllPosts()).filter((post) => !post.draft).length;
    expect(html.match(/data-post-count[^>]*>\s*(\d+)/)?.[1]).toBe(String(published));
  });
});
