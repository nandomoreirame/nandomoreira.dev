import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART_MOTIFS } from '../../src/content/motifs';

const DIR = 'src/content/projects';

// Read from disk, not through the collection: the dev data store can lag
// behind a new frontmatter field and would make this pass on stale content.
const cases = readdirSync(DIR)
  .filter(file => file.endsWith('.md'))
  .map(file => ({
    file,
    art: (readFileSync(join(DIR, file), 'utf8').split(/^---$/m)[1] ?? '').match(/^art:\s*(\S+)/m)?.[1],
  }));

describe('art declared by every case (REQ-019)', () => {
  it.each(cases)('$file declares a known art motif', ({ art }) => {
    expect(ART_MOTIFS).toContain(art);
  });

  it('gives the portfolio and the lab variety, not one drawing repeated', () => {
    expect(new Set(cases.map(({ art }) => art)).size).toBeGreaterThanOrEqual(12);
  });
});
