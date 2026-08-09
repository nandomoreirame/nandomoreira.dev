import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getArchiveYears } from '../../src/lib/content';
import ArchiveIndexPage from '../../src/pages/posts/arquivo/index.astro';

const source = readFileSync('src/pages/posts/arquivo/index.astro', 'utf8');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(ArchiveIndexPage);
};

describe('/posts/arquivo index', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(source).toContain('getArchiveYears');
    expect(source).not.toContain('getCollection(');
  });

  it('renders one link per year that has archived content, with its count', async () => {
    const [html, years] = await Promise.all([render(), getArchiveYears()]);

    expect(years.length).toBeGreaterThan(0);

    for (const year of years) {
      expect(html).toContain(`href="/posts/arquivo/${year.year}"`);
      // The bare number would also match the year itself, an href or any markup,
      // so assert the rendered phrase the page actually writes.
      expect(html).toContain(`${year.count} ${year.count === 1 ? 'texto' : 'textos'}`);
    }

    // 2024 holds only current posts, so it must not appear as an archive year.
    expect(years.some((y) => y.year === '2024')).toBe(false);
    expect(html).not.toContain('href="/posts/arquivo/2024"');
  });

  it('costs no client JavaScript, so the year split is routing not filtering', async () => {
    const html = await render();
    expect(html).not.toContain('client:');
    expect(source).not.toContain('client:');
  });
});
