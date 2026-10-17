import { describe, expect, it } from 'vitest';
import {
  NOW_DECLINING,
  NOW_FOCUS,
  NOW_GAME_EXCLUDE,
  NOW_GAMES,
  NOW_LEAD,
  NOW_PATH,
  NOW_REPO_EXCLUDE,
  NOW_STUDYING,
  NOW_TTL,
  NOW_UPDATED_AT,
} from '../../src/lib/now/now';

const curated = [
  NOW_LEAD,
  ...NOW_FOCUS,
  ...NOW_DECLINING,
  ...NOW_GAMES.flatMap((game) => [game.name, game.note ?? '']),
  ...NOW_STUDYING.flatMap((study) => [study.topic, study.note]),
];

describe('now curated data', () => {
  it('publishes /now with a valid ISO update date', () => {
    expect(NOW_PATH).toBe('/now');
    expect(NOW_UPDATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(NOW_UPDATED_AT))).toBe(false);
  });

  it('has at least one focus item and no TODO in curated copy', () => {
    expect(NOW_FOCUS.length).toBeGreaterThan(0);
    for (const text of curated) expect(text).not.toContain('TODO');
  });

  it('keeps curated copy free of dashes and of a present-tense Liquid job', () => {
    for (const text of curated) {
      expect(text).not.toMatch(/[—–]/);
      expect(text.toLowerCase()).not.toContain('trabalho na liquid');
      expect(text.toLowerCase()).not.toContain('estou na liquid');
    }
    // The Derek Sivers explanation moved to the card at the end of the page
    // (2026-10-17); the lead says what the page covers instead.
    expect(NOW_LEAD).not.toContain('nownownow');
    expect(NOW_LEAD).toContain('estudando');
    expect(NOW_LEAD.length).toBeLessThanOrEqual(160);
  });

  it('lists what is being studied, each with a public reading a visitor can open', () => {
    expect(NOW_STUDYING.length).toBeGreaterThan(0);
    for (const study of NOW_STUDYING) {
      expect(study.topic.length).toBeGreaterThan(0);
      expect(study.note.length).toBeGreaterThan(0);
      expect(new URL(study.url).protocol).toBe('https:');
      // estudos.home lives on the homelab: a link to it would 404 for everyone else.
      expect(study.url).not.toContain('.home');
    }
  });

  it('matches the source TTLs and the exclusion lists from the spec', () => {
    expect(NOW_TTL).toEqual({
      github: 30 * 60_000,
      spotify: 5 * 60_000,
      spotifyTop: 60 * 60_000,
      xbox: 5 * 60_000,
    });
    expect(NOW_REPO_EXCLUDE).toEqual(['.dotfiles', 'dotfiles', 'nandomoreirame']);
    expect(NOW_GAME_EXCLUDE).toEqual(['Microsoft Jewel']);
  });
});
