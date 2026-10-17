import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LatestPosts from '../../src/components/home/LatestPosts.astro';
import type { PostSummary } from '../../src/lib/content';

const SITE = 'https://nandomoreira.dev';

const post = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  slug: 'meu-post',
  title: 'Meu post',
  summary: 'Um resumo.',
  date: '2026-10-16',
  markers: ['niri', 'wayland', 'shell', 'linux'],
  draft: false,
  archived: false,
  readingMinutes: 6,
  ...overrides,
});

const render = async (props: { posts?: PostSummary[] }) => {
  const container = await AstroContainer.create();
  return container.renderToString(LatestPosts, { props: { site: SITE, posts: [], ...props } });
};

describe('LatestPosts', () => {
  it('renders nothing without posts', async () => {
    const html = await render({});
    expect(html).not.toContain('id="blog"');
    expect(html).not.toContain('POSTS RECENTES');
  });

  it('shows one card per post, in the order given', async () => {
    const html = await render({
      posts: [
        post({ slug: 'novo', title: 'Novo' }),
        post({ slug: 'meio', title: 'Meio' }),
        post({ slug: 'antigo', title: 'Antigo' }),
      ],
    });
    expect(html.match(/data-latest-post/g)).toHaveLength(3);
    const order = ['/novo', '/meio', '/antigo'].map((href) => html.indexOf(`href="${href}"`));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('heads the section with the accent label and a quiet see-all link', async () => {
    const html = await render({ posts: [post()] });
    const heading = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/)?.[0] ?? '';
    expect(heading).toContain('POSTS RECENTES');
    expect(heading).toMatch(/<span[^>]*aria-hidden="true"[^>]*>\/\/ <\/span>/);
    expect(heading).toContain('text-primary');

    const link = html.match(/<a[^>]*href="\/posts"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('Ver todos os posts no blog');
    expect(link).toContain('font-mono');
    expect(link).toContain('data-icon="lucide:arrow-right"');
    expect(link).not.toContain('bg-primary');
  });

  it('shows one card whose title is the only link to the post, stretched over the card', async () => {
    const html = await render({ posts: [post()] });
    expect(html.match(/data-latest-post/g)).toHaveLength(1);
    expect(html.match(/href="\/meu-post"/g)).toHaveLength(1);

    const title = html.match(/<h3[^>]*>[\s\S]*?<\/h3>/)?.[0] ?? '';
    const link = title.match(/<a[^>]*href="\/meu-post"[^>]*>/)?.[0] ?? '';
    expect(title).toContain('Meu post');
    expect(link).toContain('after:absolute');
    expect(link).toContain('after:inset-0');
    expect(link).toContain('focus-visible:after:outline-primary');
    expect(html).toMatch(/<article[^>]*class="[^"]*\brelative\b/);
  });

  it('never wraps the card in a link and ships no button or script', async () => {
    const html = await render({ posts: [post({ keyPoints: ['um'] })] });
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<article/);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script');
  });

  it('puts the short date and the reading time in the meta line', async () => {
    const html = await render({ posts: [post()] });
    const meta = html.match(/<p[^>]*data-post-meta[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(meta).toContain('<time datetime="2026-10-16">16 out. 2026</time>');
    expect(meta).toContain('6 min de leitura');
  });

  it('shows the first extra as a success badge, and nothing without extras', async () => {
    const withExtras = await render({ posts: [post({ extras: ['5 dias → 30 min', 'Python'] })] });
    const badge = withExtras.match(/<span[^>]*data-badge[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(badge).toContain('5 dias → 30 min');
    expect(badge).toContain('text-success');
    expect(withExtras).not.toContain('Python');

    const without = await render({ posts: [post()] });
    expect(without).not.toContain('data-badge');
    expect(without).not.toMatch(/>\|</);
  });

  it('lists up to three markers as hashtags under the summary', async () => {
    const html = await render({ posts: [post()] });
    expect(html).toContain('Um resumo.');
    expect(html).toContain('#niri');
    expect(html).toContain('#wayland');
    expect(html).toContain('#shell');
    expect(html).not.toContain('#linux');
  });

  it('cues "Ler artigo completo" visually, never as a second tab stop', async () => {
    const html = await render({ posts: [post()] });
    const cue = html.match(/<span[^>]*data-read-cue[^>]*>/)?.[0] ?? '';
    expect(cue).toContain('aria-hidden="true"');
    expect(html).toContain('Ler artigo completo');
  });

  it('puts the quick preview toggle beside the read cue and opens the panel below the row', async () => {
    const html = await render({ posts: [post({ keyPoints: ['Primeiro ponto.', 'Segundo ponto.'] })] });
    const footer = html.match(/<div[^>]*data-post-footer[^>]*>[\s\S]*<\/article>/)?.[0] ?? '';

    const toggle = footer.match(/<input[^>]*data-preview-toggle[^>]*>/)?.[0] ?? '';
    expect(toggle).toContain('type="checkbox"');
    expect(toggle).toContain('id="preview-meu-post"');
    expect(toggle).toContain('aria-controls="preview-panel-meu-post"');
    expect(toggle).toContain('sr-only');

    const row = footer.match(/<div[^>]*data-post-actions[^>]*>[\s\S]*?data-read-cue/)?.[0] ?? '';
    const label = row.match(/<label[^>]*for="preview-meu-post"[^>]*>[\s\S]*?<\/label>/)?.[0] ?? '';
    expect(label).toContain('Preview rápido');
    expect(label).toContain('data-icon="lucide:terminal"');
    expect(label).toMatch(/class="[^"]*\brelative\b[^"]*\bz-10\b/);
    expect(label).toContain('group-has-focus-visible/toggle:outline-2');

    const panel = footer.match(/<div[^>]*id="preview-panel-meu-post"[^>]*>[\s\S]*$/)?.[0] ?? '';
    expect(panel).toMatch(/<div[^>]*data-post-preview[^>]*class="[^"]*\bhidden\b[^"]*\bgroup-has-checked\/footer:flex\b/);
    expect(panel).toMatch(/class="[^"]*\brelative\b[^"]*\bz-10\b/);
    expect(footer.indexOf('data-read-cue')).toBeLessThan(footer.indexOf('id="preview-panel-meu-post"'));

    expect(panel).toContain('TL;DR // PONTOS-CHAVE');
    expect(panel).toContain('Primeiro ponto.');
    expect(panel).toContain('Segundo ponto.');
    expect(panel).toContain('Resumir com IA:');
    expect(panel.split(encodeURIComponent(`${SITE}/meu-post.md`)).length - 1).toBe(3);
  });

  it('has no preview when the post has no key points', async () => {
    const html = await render({ posts: [post()] });
    expect(html).not.toContain('data-preview-toggle');
    expect(html).not.toContain('Preview rápido');
  });
});
