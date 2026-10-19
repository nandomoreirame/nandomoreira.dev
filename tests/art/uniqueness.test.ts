import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/content/blocks';
import type { ArtMotif } from '../../src/content/motifs';
import { generateArt } from '../../src/lib/art';

const DIR = 'src/content/projects';

const published = readdirSync(DIR)
  .filter(file => file.endsWith('.md'))
  .map(file => {
    const frontmatter = readFileSync(join(DIR, file), 'utf8').split(/^---$/m)[1] ?? '';
    return {
      slug: frontmatter.match(/^slug:\s*(\S+)/m)?.[1] ?? '',
      block: frontmatter.match(/^block:\s*(\S+)/m)?.[1] as Block,
      art: frontmatter.match(/^art:\s*(\S+)/m)?.[1] as ArtMotif | undefined,
    };
  });

describe('art across the published cases', () => {
  it('reads every case', () => {
    expect(published.length).toBeGreaterThanOrEqual(15);
    for (const entry of published) expect(entry.slug).not.toBe('');
  });

  it.each(['card', 'banner'] as const)('never repeats a %s between two cases', aspect => {
    const drawings = published.map(entry => generateArt({ ...entry, aspect }));
    expect(new Set(drawings).size).toBe(drawings.length);
  });
});
