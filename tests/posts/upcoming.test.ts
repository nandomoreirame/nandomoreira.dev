import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import UpcomingPosts from '../../src/components/posts/UpcomingPosts.astro';
import { UPCOMING_LIMIT } from '../../src/components/posts/upcoming-limit';

const draft = (title: string) => ({ title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') });

const render = async (titles: string[], linked = false) => {
  const container = await AstroContainer.create();
  return container.renderToString(UpcomingPosts, { props: { posts: titles.map(draft), linked } });
};

describe('UpcomingPosts', () => {
  it('names the section and lists the drafts by title, one per line, without linking them', async () => {
    const html = await render(['Memória em 4 camadas', 'O falso verde']);

    expect(html).toMatch(/<section[^>]*aria-labelledby="upcoming-heading"/);
    expect(html).toMatch(/id="upcoming-heading"[^>]*>[\s\S]*?<\/svg>\s*Rascunhos em andamento/);
    expect(html).toMatch(/<ul[^>]*list-disc/);
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(html).toContain('Memória em 4 camadas');
    expect(html).not.toMatch(/<a\b/);
  });

  it('colours the heading like the newsletter eyebrow, in the accent', async () => {
    const heading = (await render(['x'])).match(/<h2[^>]*id="upcoming-heading"[^>]*>/)?.[0] ?? '';
    expect(heading).toContain('text-primary');
    expect(heading).not.toContain('text-muted-foreground');
  });

  it('opens the heading with a plain file icon, like the newsletter mail icon', async () => {
    const heading = (await render(['x'])).match(/<h2[^>]*id="upcoming-heading"[^>]*>[\s\S]*?<\/h2>/)?.[0] ?? '';
    expect(heading).toMatch(/<h2[^>]*class="[^"]*\bflex\b[^"]*\bitems-center\b/);
    expect(heading).toMatch(/<svg[^>]*data-icon="lucide:file"[\s\S]*?<\/svg>\s*Rascunhos em andamento/);
    expect(heading).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('shows at most five drafts', async () => {
    expect(UPCOMING_LIMIT).toBe(5);
    const html = await render(['1', '2', '3', '4', '5', '6', '7']);
    expect(html.match(/<li\b/g)).toHaveLength(5);
  });

  it('links each draft to its page when linked, which is dev and staging only', async () => {
    const html = await render(['O falso verde'], true);
    expect(html).toMatch(/<li[^>]*>\s*<a[^>]*href="\/o-falso-verde"[^>]*>O falso verde<\/a>/);
  });

  it('renders nothing when there is no draft', async () => {
    expect((await render([])).trim()).toBe('');
  });

  it('links the drafts only where draft pages exist, and keeps them out of the main list', () => {
    const page = readFileSync('src/pages/posts/index.astro', 'utf8');
    expect(page).toContain('linked={showDrafts(import.meta.env)}');
    expect(page).toContain('const listed = posts.filter((post) => !post.draft);');
    expect(page).toContain('paginate(listed,');
  });

  it('closes the posts list, before the newsletter', () => {
    const page = readFileSync('src/pages/posts/index.astro', 'utf8');
    expect(page).toContain('<UpcomingPosts');
    expect(page.indexOf('<UpcomingPosts')).toBeLessThan(page.indexOf('<NewsletterCard'));
  });
});

describe('draft badge', () => {
  it('marks a draft on its page and in the posts list while in dev', () => {
    expect(readFileSync('src/pages/[slug].astro', 'utf8')).toContain('post.draft');
    expect(readFileSync('src/pages/posts/index.astro', 'utf8')).toContain('post.draft');
  });
});
