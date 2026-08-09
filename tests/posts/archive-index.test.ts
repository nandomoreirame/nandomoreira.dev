import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync('src/pages/posts/arquivo/index.astro', 'utf8');

describe('/posts/arquivo index', () => {
  it('lists every year that has content, with its count', () => {
    const html = source();
    expect(html).toContain('getArchiveYears');
    expect(html).toContain('href={`/posts/arquivo/${year.year}`}');
    expect(html).toContain('year.count');
  });

  it('costs no client JavaScript, so the year split is routing not filtering', () => {
    expect(source()).not.toContain('client:');
  });
});
