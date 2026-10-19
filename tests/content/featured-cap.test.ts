import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('featured cases', () => {
  it('never exceeds the five the home lists', () => {
    const dir = 'src/content/projects';
    const featured = readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .filter(f => /^featured:\s*true$/m.test(readFileSync(`${dir}/${f}`, 'utf8')));

    // The home caps at five (REQ-008 of theme-restyle). A sixth flag would be
    // silently ignored, and the author would not know which case was dropped.
    expect(featured.length, `featured: ${featured.join(', ')}`).toBeLessThanOrEqual(5);
  });
});
