import { describe, expect, it } from 'vitest';
import {
  PLACEHOLDER,
  dayBounds,
  macroCommits,
  missingDays,
  parseCommits,
  releaseSkeleton,
} from '../../scripts/release-draft.mjs';

const log = [
  '✨ feat(now): show the GitHub card and rename the work section',
  '🐛 fix(about): give Grok an icon so every stack item has one',
  '✅ test(now): expect six artists',
  '📝 docs(posts): publish the tiling post',
  '⚡ perf(css): inline stylesheets',
  '💄 style(ui): light the tech badges',
  'Merge branch main',
].join('\n');

describe('dayBounds', () => {
  it('spans the São Paulo day', () => {
    expect(dayBounds('2026-10-19')).toEqual({ since: '2026-10-19T00:00:00-03:00', until: '2026-10-19T23:59:59-03:00' });
  });

  it('rejects anything but an ISO date', () => {
    expect(() => dayBounds('19/10/2026')).toThrow();
  });
});

describe('parseCommits', () => {
  it('reads type, scope and subject from gitmoji subjects, skipping the rest', () => {
    const commits = parseCommits(log);

    expect(commits[0]).toEqual({
      type: 'feat',
      scope: 'now',
      subject: 'show the GitHub card and rename the work section',
    });
    expect(commits).toHaveLength(6);
  });
});

describe('macroCommits', () => {
  it('keeps what a visitor can see, grouped by scope', () => {
    expect(macroCommits(parseCommits(log))).toEqual({
      about: ['fix: give Grok an icon so every stack item has one'],
      css: ['perf: inline stylesheets'],
      now: ['feat: show the GitHub card and rename the work section'],
    });
  });
});

describe('releaseSkeleton', () => {
  it('writes the date and the version, with placeholders the schema rejects and the commits as comments', () => {
    const text = releaseSkeleton({ date: '2026-10-20', version: 'v17.800', groups: { now: ['feat: a card'] } });

    expect(text).toMatch(/^---\nversion: v17\.800\ndate: "2026-10-20"\n/);
    expect(text.split(PLACEHOLDER).length - 1).toBeGreaterThanOrEqual(4);
    expect(text).toContain('# now: feat: a card');
    expect(text.trimEnd().endsWith('---')).toBe(true);
  });
});

describe('missingDays', () => {
  it('lists the days with visible commits and no release, minus the skipped ones', () => {
    expect(
      missingDays({
        visibleDays: ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'],
        releaseDays: ['2026-10-19'],
        skipped: ['2026-10-18'],
      }),
    ).toEqual(['2026-10-20', '2026-10-21']);
  });
});
