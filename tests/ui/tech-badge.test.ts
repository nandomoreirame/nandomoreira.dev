import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TechBadge from '../../src/components/ui/TechBadge.astro';

const render = async (name: string) => {
  const container = await AstroContainer.create();
  return container.renderToString(TechBadge, { props: { name } });
};

describe('TechBadge', () => {
  it('renders the stack logo next to the name', async () => {
    const html = await render('TypeScript');
    expect(html).toContain('TypeScript');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('falls back to text only when the stack has no logo', async () => {
    const html = await render('DDD');
    expect(html).toContain('DDD');
    expect(html).not.toContain('<svg');
  });

  it('paints the logo with the text colour, never the brand hex', async () => {
    const html = await render('Rust');
    expect(html).toContain('currentColor');
    expect(html).not.toMatch(/fill="#/);
  });
});
