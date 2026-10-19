import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('post and case titles', () => {
  it.each(['src/pages/[slug].astro', 'src/components/catalog/CaseArticle.astro'])(
    '%s sets the h1 in Newsreader 400',
    file => {
      const h1 = readFileSync(file, 'utf8').match(/<h1 class="([^"]*)"/)?.[1] ?? '';
      expect(h1).toContain('font-serif');
      expect(h1).toContain('font-normal');
      expect(h1).toContain('tracking-tight');
      expect(h1).not.toContain('font-semibold');
    },
  );
});
