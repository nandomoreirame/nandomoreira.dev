import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART_MOTIFS } from '../../src/content/motifs';

const DIR = 'src/content/posts';

// Read from disk, not through the collection: the dev data store can lag
// behind a new frontmatter field and would make this pass on stale content.
const frontmatterOf = (file: string) => readFileSync(join(DIR, file), 'utf8').split(/^---$/m)[1] ?? '';

const coverless = readdirSync(DIR)
  .filter(file => file.endsWith('.md'))
  .map(file => ({ file, frontmatter: frontmatterOf(file) }))
  .filter(({ frontmatter }) => !/^cover:/m.test(frontmatter) && !/^draft:\s*true/m.test(frontmatter))
  .map(({ file, frontmatter }) => ({ file, art: frontmatter.match(/^art:\s*(\S+)/m)?.[1] }));

describe('art declared by every published post without a cover', () => {
  it('finds the coverless posts', () => {
    expect(coverless.length).toBeGreaterThan(0);
  });

  // The drawing is chosen by what the post is about, so it cannot be a default.
  it.each(coverless)('$file declares a known art motif', ({ art }) => {
    expect(ART_MOTIFS).toContain(art);
  });

  it('gives each of them its own drawing', () => {
    const motifs = coverless.map(({ art }) => art);
    expect(new Set(motifs).size).toBe(motifs.length);
  });
});
