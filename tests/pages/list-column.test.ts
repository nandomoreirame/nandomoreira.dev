import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Posts from '../../src/pages/posts/index.astro';

// Since 2026-10-17 every page shares the same container: the blog pages no
// longer narrow to the list measure (the home list sections still do).
describe('blog pages container', () => {
  it('renders /posts on the page container, without the narrower list column', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Posts);
    const main = html.slice(html.indexOf('<main'));

    expect(main).not.toContain('max-w-list');
  });

  it.each([
    'src/pages/posts/index.astro',
    'src/pages/posts/arquivo/index.astro',
    'src/pages/posts/arquivo/[year].astro',
  ])('%s does not narrow to max-w-list', (file) => {
    expect(readFileSync(file, 'utf8')).not.toContain('max-w-list');
  });
});
