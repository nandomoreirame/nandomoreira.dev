import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const profile = readFileSync('src/content/profile/profile.md', 'utf8');
const liquid = profile.slice(profile.indexOf('- name: Liquid AI'), profile.indexOf('- name: Norte Marketing'));

describe('Liquid AI is a past position', () => {
  it('ends on 2026-09-30', () => {
    expect(liquid).toContain('endDate: "2026-09-30"');
  });

  // The last day was 2026-09-30, so the profile speaks of it in the past.
  it.each(['Respondo', 'Orquestro', 'Sustento', 'respondo pela', 'que opero'])(
    'no longer says "%s" about it',
    (present) => {
      expect(profile).not.toContain(present);
    },
  );
});
