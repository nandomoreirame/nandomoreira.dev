import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { archiveYearDescription } from '../../src/lib/posts/archive-copy';

const post = (markers: string[]) => ({ markers });

describe('archiveYearDescription', () => {
  it('counts the texts of the year and names its three most common subjects', () => {
    const posts = [post(['sass', 'css', 'gulp']), post(['sass', 'css']), post(['jekyll', 'sass']), post(['wordpress'])];
    expect(archiveYearDescription('2015', posts)).toBe(
      '4 textos de 2015 sobre sass, css e gulp, mantidos como registro.',
    );
  });

  it('reads well with a single text', () => {
    expect(archiveYearDescription('2019', [post(['carreira'])])).toBe(
      '1 texto de 2019 sobre carreira, mantido como registro.',
    );
  });

  it('is what the yearly archive page uses', () => {
    expect(readFileSync('src/pages/posts/arquivo/[year].astro', 'utf8')).toContain('archiveYearDescription(');
  });
});

describe('static meta descriptions', () => {
  it.each([['src/pages/contato.astro'], ['src/pages/posts/arquivo/index.astro']])(
    '%s describes the page in at least 70 characters',
    file => {
      const meta = readFileSync(file, 'utf8').match(/<BaseLayout[\s\S]*?description="([^"]*)"/)?.[1] ?? '';
      expect(meta.length).toBeGreaterThanOrEqual(70);
      expect(meta.length).toBeLessThanOrEqual(160);
    },
  );
});
