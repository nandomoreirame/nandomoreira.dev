import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';

const dir = 'src/content/projects';
const blockOf = (file: string): string =>
  readFileSync(`${dir}/${file}`, 'utf8').match(/^block:\s*(\S+)$/m)?.[1] ?? '';

describe('catalogue coverage', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

  it('publishes at least the eight cases the MVP asks for', () => {
    // A floor, not an equality: the first version pinned this to exactly eight
    // and turned the coverage gate into a cap, so publishing a ninth case broke
    // the build for no reason. The MVP-SCOPE asks for a minimum, never a limit.
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it.each(BLOCKS)('covers %s with at least two cases', (block) => {
    // A block with one case reads as an unfinished section, and the MVP-SCOPE
    // treats the eight cases as the mitigation for RISK-003.
    expect(files.filter((f) => blockOf(f) === block).length).toBeGreaterThanOrEqual(2);
  });
});
