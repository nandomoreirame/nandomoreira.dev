import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import RelatedPostCard from '../../src/components/posts/RelatedPostCard.astro';
import type { Post } from '../../src/content/schemas/post';

const post: Post = {
  slug: 'espanso',
  title: 'espanso no Linux',
  summary: 'Um resumo.',
  date: '2026-10-16',
  markers: ['linux', 'cli', 'produtividade'],
  draft: false,
  archived: false,
};
const render = async () => (await AstroContainer.create()).renderToString(RelatedPostCard, { props: { post } });

describe('RelatedPostCard', () => {
  it('shows the short date, the first marker, the title and the summary', async () => {
    const html = await render();
    expect(html).toContain('<time datetime="2026-10-16">16 out. 2026</time>');
    expect(html).toContain('#linux');
    expect(html).not.toContain('#cli');
    expect(html).toMatch(/<h3[^>]*>[\s\S]*espanso no Linux[\s\S]*<\/h3>/);
    expect(html).toMatch(/<p[^>]*line-clamp-3[^>]*>\s*Um resumo\.\s*<\/p>/);
  });

  it('has one link, the title, stretched over the card', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    const link = html.match(/<a[^>]*href="\/espanso"[^>]*>/)?.[0] ?? '';
    expect(link).toContain('after:absolute');
    expect(link).toContain('after:inset-0');
    expect(html).toMatch(/<article[^>]*class="[^"]*\brelative\b/);
  });

  it('cues "Ler artigo" visually, never as a second tab stop', async () => {
    const html = await render();
    expect(html).toMatch(/<span[^>]*data-read-cue[^>]*aria-hidden="true"[^>]*>[\s\S]*?Ler artigo/);
  });
});
