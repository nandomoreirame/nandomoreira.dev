import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUpcomingPosts } from '../../src/lib/content';
import { NOW_UPDATED_AT } from '../../src/lib/now/now';
import NowPage from '../../src/pages/now.astro';
import SetupPage from '../../src/pages/setup.astro';

const render = async (page: typeof NowPage) => {
  const container = await AstroContainer.create();
  return container.renderToString(page);
};

const headings = (html: string): string[] =>
  [...html.matchAll(/<h2\b[^>]*>(.*?)<\/h2>/g)].map((match) => match[1] ?? '');

describe('/now page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the five sections in order, the update date, and the games fallback', async () => {
    const html = await render(NowPage);
    expect(headings(html)).toEqual([
      'Foco',
      'Projetos em andamento',
      'Escrevendo',
      'Ouvindo',
      'Jogando',
    ]);
    expect(html).toContain('Atualizada em');
    expect(html).toContain(`datetime="${NOW_UPDATED_AT}"`);
    const playing = html.split('>Jogando<')[1]?.split('</section>')[0] ?? '';
    expect(playing).toContain('Sem dados no momento.');
  });

  it('lists draft titles without a link', async () => {
    const drafts = (await getUpcomingPosts()).slice(0, 5);
    const html = await render(NowPage);
    const writing = html.split('>Escrevendo<')[1]?.split('>Ouvindo<')[0] ?? '';

    expect(drafts.length).toBeGreaterThan(0);
    for (const draft of drafts) {
      expect(writing).toContain(draft.title);
      const title = draft.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(writing).not.toMatch(new RegExp(`<a\\b[^>]*>[\\s\\S]*?${title}[\\s\\S]*?</a>`));
    }
  });

  it('adds no script beyond the one layout script /setup already has', async () => {
    const nowHtml = await render(NowPage);
    const setupHtml = await render(SetupPage);
    const scripts = (html: string) => [...html.matchAll(/<script\b/gi)].length;
    expect(scripts(nowHtml)).toBe(scripts(setupHtml));
  });

  it('is server rendered and cacheable for five minutes at the edge', () => {
    const source = readFileSync('src/pages/now.astro', 'utf8');
    expect(source).not.toContain('prerender');
    expect(source).toContain('s-maxage=300');
    expect(source).not.toContain('client:');
  });
});
