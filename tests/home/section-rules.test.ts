import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The home dropped its <hr> dividers on 2026-10-17 and halved the space between
// blocks: the blocks before the last pad only their top, so two neighbours no
// longer add their paddings up. AgentBrief, last, keeps both sides.
describe('home section spacing', () => {
  const page = readFileSync('src/pages/index.astro', 'utf8');

  it('draws no SectionRule between the home blocks', () => {
    expect(page).not.toContain('SectionRule');
  });

  it('pads only the top of the blocks before the last one', () => {
    for (const file of [
      'src/components/home/LatestPosts.astro',
      'src/components/home/Trajectory.astro',
      'src/components/home/Services.astro',
    ]) {
      const section = readFileSync(file, 'utf8').match(/<section[\s\S]*?>/)?.[0] ?? '';
      expect(section, file).toContain('pt-2xl lg:pt-3xl');
      expect(section, file).not.toMatch(/\b(py|pb)-/);
    }
  });
});
