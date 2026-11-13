import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostPage from '../../src/components/pages/PostPage.astro';
import PostsPage from '../../src/components/pages/PostsPage.astro';
import { getAllPostEntries } from '../../src/lib/content';
import { handleListingView } from '../../src/lib/posts/listing-view';
import { blogCopy } from '../../src/lib/posts/blog-copy';
import { jsonLdForPost } from '../../src/lib/posts/post-ld';
import { ptLeftovers } from '../helpers/pt-leftovers';

const renderListing = async (locale: string, view: 'list' | 'grid' = 'list') =>
  (await AstroContainer.create()).renderToString(PostsPage, {
    props: { locale, view },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en/posts' : 'https://nandomoreira.dev/posts'),
  });

/** Body of the page; chrome outside <main> is owned by other tasks. */
const mainOf = (html: string): string => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

/**
 * Drop Portuguese content that stays until i18n-content: the article body
 * (`data-prose` through the author box), title, lead, TOC entries, snapshot
 * values and related cards. Chrome labels stay for ptLeftovers.
 */
const withoutPortugueseContent = (html: string): string =>
  mainOf(html)
    .replace(/<div\b[^>]*data-prose\b[\s\S]*?<aside\b[^>]*data-author-box/i, '<aside data-author-box')
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '')
    .replace(/<p\b[^>]*data-post-lead\b[^>]*>[\s\S]*?<\/p>/i, '')
    .replace(/<nav\b[^>]*data-toc\b[^>]*>[\s\S]*?<\/nav>/i, '')
    .replace(/<section\b[^>]*data-post-snapshot\b[^>]*>[\s\S]*?<\/section>/i, '')
    .replace(/<article\b[^>]*data-related-post\b[^>]*>[\s\S]*?<\/article>/gi, '');

describe('English blog', () => {
  it('listing renders in English, empty until i18n-content', async () => {
    const html = await renderListing('en');
    expect(html).toContain('<html lang="en"');
    expect(ptLeftovers(withoutPortugueseContent(html))).toEqual([]);
  });

  it('omits the archive link and points RSS at the English feed (D12, REQ-014)', async () => {
    const html = await renderListing('en');
    // D12: no English archive; omit the link rather than send visitors to a 404.
    expect(html).not.toContain('href="/posts/arquivo"');
    expect(html).not.toContain('href="/en/posts/arquivo"');
    // Listing button (after the view toggle), not only the head alternate.
    expect(html).toMatch(/data-view-toggle[\s\S]*?href="\/en\/rss\.xml"/);
    expect(html).not.toMatch(/data-view-toggle[\s\S]*?href="\/rss\.xml"/);
  });

  it('copy resolves by locale', () => {
    expect(blogCopy('pt-BR').title).toBe('Meu caderno aberto');
    expect(blogCopy('en').title).not.toBe('Meu caderno aberto');
  });

  it('post JSON-LD carries the language and the English URL', () => {
    const post = {
      slug: 'the-false-green',
      title: 'T',
      summary: 'S',
      date: '2026-10-09',
      markers: ['a', 'b', 'c'],
    };
    const ld = jsonLdForPost(post as never, 'https://nandomoreira.dev', undefined, 'en');
    expect(ld.inLanguage).toBe('en');
    expect(ld.url).toBe('https://nandomoreira.dev/en/the-false-green');
    expect(ld.image).toBe('https://nandomoreira.dev/og/en/the-false-green.png');
  });

  it('POST /en/posts saves the view and redirects to the English listing', async () => {
    const response = await handleListingView(
      new Request('https://nandomoreira.dev/en/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'visao=grade',
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en/posts');
  });

  it('POST /en/posts?pagina=2 keeps the page in the redirect', async () => {
    const response = await handleListingView(
      new Request('https://nandomoreira.dev/en/posts?pagina=2', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'visao=lista',
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en/posts?pagina=2');
  });

  it('PostPage chrome is English when locale is en, even with a pt-BR entry', async () => {
    const entries = await getAllPostEntries();
    const entry =
      entries.find(item => item.data.slug === 'fluxo-rpi-claude-code-grok-codex') ??
      entries.find(item => !item.data.draft);
    expect(entry).toBeDefined();

    const html = await (
      await AstroContainer.create()
    ).renderToString(PostPage, {
      props: { entry, locale: 'en' },
      request: new Request(`https://nandomoreira.dev/en/${entry!.data.slug}`),
    });

    expect(html).toContain('<html lang="en"');
    expect(html).toMatch(/min read|Reading mode|Copy link/i);
    // Body, title and lead stay Portuguese; chrome outside them must be English.
    expect(ptLeftovers(withoutPortugueseContent(html))).toEqual([]);
  });
});

describe('PostsPage', () => {
  it('keeps the pt-BR listing byte for byte', async () => {
    const html = (await renderListing('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/posts.pt.html');
  });
});

describe('PostPage', () => {
  it('keeps a pt-BR post with cover and index byte for byte', async () => {
    const entries = await getAllPostEntries();
    const entry =
      entries.find(item => item.data.slug === 'fluxo-rpi-claude-code-grok-codex') ??
      entries.find(item => item.data.cover && !item.data.draft);
    expect(entry).toBeDefined();

    const html = (
      await (
        await AstroContainer.create()
      ).renderToString(PostPage, {
        props: { entry, locale: 'pt-BR' },
        request: new Request(`https://nandomoreira.dev/${entry!.data.slug}`),
      })
    )
      .replaceAll(process.cwd(), '<root>')
      // The code block ids come from a counter shared by every render in the worker.
      .replace(/code-\d+/g, 'code-N');
    await expect(html).toMatchFileSnapshot('../__snapshots__/post-fluxo-rpi.pt.html');
  });
});
