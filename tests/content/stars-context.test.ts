import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('GitHub stars in the profile', () => {
  it('never states the total without the share that comes from old themes', () => {
    const source = readFileSync('src/content/profile/profile.md', 'utf8');
    const mentionsTotal = /9\d\d\s*(estrelas|stars)/i.test(source);

    // 764 of 964 stars come from Jekyll themes published between 2017 and 2021.
    // The bare total is arithmetic truth and positioning fiction (RISK-004).
    if (mentionsTotal) {
      expect(source).toMatch(/temas|2017|2018|Jekyll/i);
    }
  });
});
