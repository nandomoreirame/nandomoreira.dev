import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArtCard from '../../src/components/catalog/ArtCard.astro';
import { generateArt } from '../../src/lib/art';

const props = {
  href: '/lab/forja',
  title: 'Forja',
  stamp: '01/2026',
  art: generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' }),
  tags: ['Rust', 'Tauri', 'TypeScript', 'React', 'Vite'],
};

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(ArtCard, { props });
};

describe('ArtCard', () => {
  it('is a single link to the real case route', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/lab/forja"');
  });

  it('shows the art, the title, the date and the stack', async () => {
    const html = await render();
    expect(html).toContain('data-motif="orbit"');
    expect(html).toContain('Forja');
    expect(html).toContain('01/2026');
    expect(html).toContain('Tauri');
  });

  it('caps the stack at four tags, so a long list never pushes the card open', async () => {
    const html = await render();
    expect(html).toContain('React');
    expect(html).not.toContain('Vite');
  });

  it('marks itself as the parallax target', async () => {
    expect(await render()).toContain('data-art');
  });

  it('keeps the art out of the accessible name', async () => {
    expect(await render()).toContain('aria-hidden="true"');
  });

  it('delimits its interactive surface with a perceivable border, not the hairline token', async () => {
    const html = await render();
    // Scoped to the link itself: the rule protects the interactive surface.
    // The stack badges inside it are decorative and may use the hairline.
    const link = html.match(/<a\b[^>]*>/)?.[0] ?? '';
    expect(link).toContain('border-border-strong');
    expect(link).not.toMatch(/\bborder-border\b(?!-)/);
  });

  it('exposes a visible focus ring, since the card is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });
});
