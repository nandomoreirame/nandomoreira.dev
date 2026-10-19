import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RELEASES } from '../../src/lib/releases/releases';
import { parseReleases, releaseSchema } from '../../src/lib/releases/data';

const valid = {
  version: 'v17.800',
  date: '2026-10-20',
  title: 'Um dia qualquer',
  summary: 'O que mudou para quem visita o site naquele dia.',
  highlights: ['Primeira coisa que entrou no ar.', 'Segunda coisa que entrou no ar.'],
};

describe('releaseSchema', () => {
  it('accepts a complete day', () => {
    expect(releaseSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['a version without the commit count', { version: 'v17' }],
    ['a date out of ISO', { date: '20/10/2026' }],
    ['one highlight only', { highlights: ['Só uma.'] }],
    ['seven highlights', { highlights: Array.from({ length: 7 }, (_, i) => `Item ${i}.`) }],
    ['a dash used as an aside', { summary: 'Um dia — e outro.' }],
    ['a placeholder left by the draft script', { title: '[[PREENCHER]]' }],
    ['a placeholder in a highlight', { highlights: ['Pronto.', '[[PREENCHER]]'] }],
  ])('rejects %s', (_, change) => {
    expect(releaseSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});

describe('parseReleases', () => {
  const file = (date: string) => `../../data/releases/${date}.md`;

  it('orders the days newest first', () => {
    const releases = parseReleases({
      [file('2026-10-19')]: { frontmatter: { ...valid, date: '2026-10-19', version: 'v17.753' } },
      [file('2026-10-20')]: { frontmatter: valid },
    });

    expect(releases.map(release => release.date)).toEqual(['2026-10-20', '2026-10-19']);
  });

  it('fails when a file is not named after its date', () => {
    expect(() => parseReleases({ [file('2026-10-21')]: { frontmatter: valid } })).toThrow(/2026-10-21/);
  });

  it('fails naming the file whose frontmatter is invalid', () => {
    expect(() =>
      parseReleases({ [file('2026-10-20')]: { frontmatter: { ...valid, title: '[[PREENCHER]]' } } }),
    ).toThrow(/2026-10-20\.md/);
  });
});

describe('release files', () => {
  it('serves one release per file in src/data/releases', () => {
    const files = readdirSync('src/data/releases').filter(name => name.endsWith('.md'));

    expect(RELEASES).toHaveLength(files.length);
    expect(RELEASES.map(release => `${release.date}.md`).sort()).toEqual(files.sort());
  });
});
