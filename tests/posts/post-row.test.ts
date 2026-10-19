import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostRow from '../../src/components/posts/PostRow.astro';

const base = {
  href: '/espanso',
  title: 'espanso: a substituição de texto do iPhone, agora no meu Linux',
  summary: 'Usei a Substituição de texto do macOS por anos.',
  date: '2026-10-16',
  readingMinutes: 4,
  markers: ['linux', 'espanso', 'wayland', 'niri'],
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(PostRow, { props: { ...base, ...props } });
};

describe('PostRow', () => {
  it('is one link to the post, with no trailing arrow', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/espanso"');
    expect(html).not.toContain('lucide:arrow-right');
    expect(html).not.toContain('→');
  });

  it('opens with the date and the reading time in mono, with a clock icon', async () => {
    const meta = (await render()).match(/<span[^>]*data-post-meta[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(meta).toContain('16 out. 2026');
    expect(meta).toContain('4 min de leitura');
    expect(meta).toContain('lucide:clock');
  });

  it('shows at most three markers as chips', async () => {
    const chips = (await render()).match(/<span[^>]*data-marker[^s>]/g) ?? [];
    expect(chips).toHaveLength(3);
  });

  it('sets the title large in the editorial serif, amber on hover', async () => {
    const title = (await render()).match(/<span[^>]*data-title[^>]*>/)?.[0] ?? '';
    expect(title).toContain('font-serif');
    expect(title).toContain('font-normal');
    expect(title).toContain('sm:text-h1');
    expect(title).toContain('group-hover:text-primary');
  });

  it('shows the whole summary, unclamped', async () => {
    const summary = (await render()).match(/<span[^>]*data-summary[^>]*>/)?.[0] ?? '';
    expect(summary).not.toContain('line-clamp');
  });

  it('lets the summary use the full row width, with no measure cap', async () => {
    const summary = (await render()).match(/<span[^>]*data-summary[^>]*>/)?.[0] ?? '';
    expect(summary).not.toMatch(/\bmax-w-/);
  });

  it('shows the extras line only when given, the first one in the accent', async () => {
    expect(await render()).not.toContain('data-extras');
    const extras =
      (await render({ extras: ['5 dias → 30 min', 'Python'] })).match(
        /<span[^>]*data-extras[^>]*>[\s\S]*?<\/span>\s*<\/span>/,
      )?.[0] ?? '';
    expect(extras).toMatch(/<span class="text-primary">5 dias → 30 min<\/span>/);
    expect(extras).toContain('•');
    expect(extras).toContain('Python');
  });

  it('puts the draft chip before the date', async () => {
    const html = await render({ draft: true });
    expect(html.indexOf('Rascunho')).toBeLessThan(html.indexOf('16 out. 2026'));
  });
});
