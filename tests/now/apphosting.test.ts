import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = readFileSync('apphosting.yaml', 'utf8');

const NOW_VARIABLES = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REFRESH_TOKEN',
  'OPENXBL_API_KEY',
  'GITHUB_TOKEN',
] as const;

const blocksOf = (source: string): Map<string, string> => {
  const entries = new Map<string, string>();
  for (const chunk of source.split(/\n  - variable: /).slice(1)) {
    const name = chunk.slice(0, chunk.indexOf('\n'));
    entries.set(name, chunk);
  }
  return entries;
};

/** Variables that are absent are off. A declared one must be a runtime secret, never a literal. */
const literalNowValues = (source: string): string[] => {
  const entries = blocksOf(source);
  return NOW_VARIABLES.filter((variable) => {
    const block = entries.get(variable);
    if (!block) return false;
    return !block.includes('secret:') || !block.includes('RUNTIME') || /^\s*value:/m.test(block);
  });
};

describe('apphosting.yaml now secrets', () => {
  it('allows a now variable only as a runtime secret and does not require any of them', () => {
    expect(literalNowValues(manifest)).toEqual([]);
  });

  it('rejects a literal value on a declared now variable', () => {
    const hostile = `
  - variable: OPENXBL_API_KEY
    value: abc
    availability:
      - RUNTIME
`;
    expect(literalNowValues(hostile)).toEqual(['OPENXBL_API_KEY']);
  });
});
