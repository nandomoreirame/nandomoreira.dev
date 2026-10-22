import { describe, expect, it, vi } from 'vitest';
import { readNowConfig } from '../../src/lib/now/config';
import { createNowLoader } from '../../src/lib/now/load';
import { NOW_UPDATED_AT } from '../../src/lib/now/now';
import { nowUpdatedAt } from '../../src/lib/now/updated';

const today = new Date('2026-10-20T15:00:00Z');

describe('nowUpdatedAt', () => {
  it('keeps the text date when nothing newer came from Spotify or Xbox', () => {
    expect(nowUpdatedAt({ base: '2026-10-17', today })).toBe('2026-10-17');
    expect(nowUpdatedAt({ base: '2026-10-17', trackPlayedAt: ['2026-10-10T12:00:00Z'], today })).toBe('2026-10-17');
  });

  it('moves to the day of the latest track, in São Paulo time', () => {
    // 01:30 UTC on the 19th is still the 18th in São Paulo.
    expect(
      nowUpdatedAt({ base: '2026-10-17', trackPlayedAt: ['2026-10-19T01:30:00Z', '2026-10-18T10:00:00Z'], today }),
    ).toBe('2026-10-18');
  });

  it('moves to the day of the latest game, and to today while a game is playing', () => {
    expect(nowUpdatedAt({ base: '2026-10-17', gameDays: ['2026-10-19', '2026-10-18'], today })).toBe('2026-10-19');
    expect(nowUpdatedAt({ base: '2026-10-17', playingNow: true, today })).toBe('2026-10-20');
  });

  it('moves to the day of the last commit', () => {
    expect(nowUpdatedAt({ base: '2026-10-17', commitAt: '2026-10-19T12:00:00Z', today })).toBe('2026-10-19');
  });

  it('ignores a timestamp it cannot read', () => {
    expect(nowUpdatedAt({ base: '2026-10-17', trackPlayedAt: ['nope'], today })).toBe('2026-10-17');
  });
});

describe('loadNow updatedAt', () => {
  it('falls back to the text date without Spotify or Xbox', async () => {
    const load = createNowLoader({
      config: readNowConfig({}),
      fetch: vi.fn().mockRejectedValue(new Error('offline')),
      now: () => today.getTime(),
      logger: { warn: vi.fn() },
      fallbackGames: [],
    });
    expect((await load()).updatedAt).toBe(NOW_UPDATED_AT);
  });
});
