import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import UpcomingPosts from '../../src/components/posts/UpcomingPosts.astro';
import { UPCOMING_LIMIT } from '../../src/components/posts/upcoming-limit';

const render = async (titles: string[]) => {
  const container = await AstroContainer.create();
  return container.renderToString(UpcomingPosts, { props: { titles } });
};

describe('UpcomingPosts', () => {
  it('names the section and lists the drafts by title, one per line, without linking them', async () => {
    const html = await render(['Memória em 4 camadas', 'O falso verde']);

    expect(html).toMatch(/<section[^>]*aria-labelledby="upcoming-heading"/);
    expect(html).toMatch(/id="upcoming-heading"[^>]*>\s*Rascunhos em andamento/);
    expect(html).toMatch(/<ul[^>]*list-disc/);
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(html).toContain('Memória em 4 camadas');
    expect(html).not.toMatch(/<a\b/);
  });

  it('shows at most five drafts', async () => {
    expect(UPCOMING_LIMIT).toBe(5);
    const html = await render(['1', '2', '3', '4', '5', '6', '7']);
    expect(html.match(/<li\b/g)).toHaveLength(5);
  });

  it('renders nothing when there is no draft', async () => {
    expect((await render([])).trim()).toBe('');
  });

  it('closes the posts page, before the archive link', () => {
    const page = readFileSync('src/pages/posts/index.astro', 'utf8');
    expect(page).toContain('<UpcomingPosts');
    expect(page.indexOf('<UpcomingPosts')).toBeLessThan(page.indexOf('Arquivo por ano'));
  });
});

describe('draft badge', () => {
  it('marks a draft on its page and in the posts list while in dev', () => {
    expect(readFileSync('src/pages/[slug].astro', 'utf8')).toContain('post.draft');
    expect(readFileSync('src/pages/posts/index.astro', 'utf8')).toContain('post.draft');
  });
});
