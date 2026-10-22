import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostsPage from '../../src/pages/posts/index.astro';
import { getCurrentPosts } from '../../src/lib/content';

const render = async (search = '', cookie?: string) => {
  const container = await AstroContainer.create();
  const headers = cookie ? { cookie } : undefined;
  return container.renderToString(PostsPage, {
    request: new Request(`https://nandomoreira.dev/posts${search}`, { headers }),
  });
};

const barUntilPosts = (html: string) => {
  const start = html.indexOf('data-listing-bar');
  const list = html.indexOf('data-latest-post');
  const grid = html.indexOf('data-related-post');
  const end = list === -1 ? grid : grid === -1 ? list : Math.min(list, grid);
  return html.slice(start, end === -1 ? undefined : end);
};

const formOf = (html: string) => html.match(/<form[^>]*data-view-form[\s\S]*?<\/form>/)?.[0] ?? '';

describe('/posts grid view', () => {
  it('offers the grid from a form beside the RSS feed, on the list when there is no cookie', async () => {
    const html = await render();
    const bar = barUntilPosts(html);
    const form = formOf(bar);
    const button = form.match(/<button[^>]*data-view-toggle[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
    const rss = bar.match(/<a[^>]*href="\/rss\.xml"[^>]*>/)?.[0] ?? '';

    expect(html).toContain('data-latest-post');
    expect(html).not.toContain('data-related-post');
    expect(html).not.toMatch(/[?&]visao=/);
    expect(form).toContain('method="post"');
    expect(form).toContain('action="/posts"');
    expect(form).toContain('name="visao"');
    expect(form).toContain('value="grade"');
    expect(button).toContain('data-icon="lucide:layout-grid"');
    expect(button).toContain('Ver em grade');
    expect(button.match(/class="([^"]*)"/)?.[1]).toBe(rss.match(/class="([^"]*)"/)?.[1]);
    expect(bar.indexOf('data-view-toggle')).toBeGreaterThan(bar.indexOf('data-post-count'));
    expect(bar.indexOf('data-view-toggle')).toBeLessThan(bar.indexOf('href="/rss.xml"'));
    expect(bar.indexOf('</button>', bar.indexOf('data-view-toggle'))).toBeLessThan(bar.indexOf('href="/rss.xml"'));
  });

  it('renders the grid from the cookie on a clean /posts url', async () => {
    const current = await getCurrentPosts();
    const html = await render('', 'theme=paper; listing-view=grid');
    const cards = [...html.matchAll(/<article[^>]*data-related-post[\s\S]*?<\/article>/g)].map(match => match[0]);

    expect(html).not.toContain('data-latest-post');
    expect(html).not.toMatch(/[?&]visao=/);
    expect(cards).toHaveLength(Math.min(12, current.length));
    expect(cards.map(card => card.match(/href="\/([^"]+)"/)?.[1])).toEqual(current.slice(0, 12).map(post => post.slug));
    expect(html).toMatch(/<ul[^>]*class="[^"]*\bgrid\b[^"]*\bgrid-cols-1\b[^"]*\bmd:grid-cols-3\b[^"]*"/);
    expect(html).toContain('Ler artigo');
    expect(formOf(html)).toContain('value="lista"');
    expect(html.indexOf('data-pagination')).toBeGreaterThan(html.lastIndexOf('data-related-post'));
  });

  it('pages the grid by twelve and keeps the toggle on the page it shows', async () => {
    const current = await getCurrentPosts();
    const size = 12;
    const html = await render('?pagina=2', 'listing-view=grid');
    const totalPages = Math.max(1, Math.ceil(current.length / size));
    const shown = Math.min(2, totalPages);
    const start = (shown - 1) * size;
    const cards = [...html.matchAll(/<article[^>]*data-related-post[\s\S]*?<\/article>/g)].map(match => match[0]);
    const form = formOf(html);

    expect(cards.map(card => card.match(/href="\/([^"]+)"/)?.[1])).toEqual(
      current.slice(start, start + size).map(post => post.slug),
    );
    expect(form).toContain(`action="${shown === 1 ? '/posts' : '/posts?pagina=2'}"`);
    expect(form).toContain('value="lista"');
    expect(form).toContain('data-icon="lucide:layout-list"');
    expect(form).toContain('Ver em lista');
    expect(html).not.toMatch(/[?&]visao=/);
    expect(html).not.toContain('pagina=1');
  });

  it('ignores an unknown cookie and drops a leftover ?visao from the url', async () => {
    const list = await render('', 'listing-view=grade');
    expect(list).toContain('data-latest-post');
    expect(list).not.toContain('data-related-post');

    const container = await AstroContainer.create();
    const response = await container.renderToResponse(PostsPage, {
      request: new Request('https://nandomoreira.dev/posts?pagina=2&visao=grade'),
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/posts?pagina=2');
  });

  it('does not cache the listing, because the view depends on the cookie', async () => {
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(PostsPage, {
      request: new Request('https://nandomoreira.dev/posts'),
    });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
