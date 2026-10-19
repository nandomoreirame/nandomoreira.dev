import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getArchivedPostsByYear, getArchiveYears } from '../../src/lib/content';
import YearPage, { getStaticPaths } from '../../src/pages/posts/arquivo/[year].astro';

const source = readFileSync('src/pages/posts/arquivo/[year].astro', 'utf8');

describe('/posts/arquivo/[year]', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(source).toContain('getArchivedPostsByYear');
    expect(source).not.toContain('getCollection(');
  });

  it('getStaticPaths returns one entry per non-empty year and none for empty years', async () => {
    const [paths, years] = await Promise.all([getStaticPaths(), getArchiveYears()]);

    expect(paths.map(p => p.params.year).sort()).toEqual(years.map(y => y.year).sort());
    expect(paths.every(p => years.some(y => y.year === p.params.year))).toBe(true);
    expect(paths.some(p => p.params.year === '2024')).toBe(false);
  });

  it('renders only titles that belong to the requested year', async () => {
    const years = await getArchiveYears();
    const year = years[0]?.year;
    expect(year).toBeTruthy();

    const posts = await getArchivedPostsByYear(year!);
    expect(posts.length).toBeGreaterThan(0);

    const container = await AstroContainer.create();
    const html = await container.renderToString(YearPage, {
      props: { year },
      params: { year },
    });

    for (const post of posts) {
      expect(html).toContain(post.title);
      expect(html).toContain(`href="/${post.slug}"`);
    }

    // A post from another archived year must not appear on this page.
    const otherYear = years.find(y => y.year !== year);
    if (otherYear) {
      const otherPosts = await getArchivedPostsByYear(otherYear.year);
      for (const post of otherPosts) {
        expect(html).not.toContain(post.title);
      }
    }
  });
});
