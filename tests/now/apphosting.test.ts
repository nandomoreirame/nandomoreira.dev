import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = readFileSync('apphosting.yaml', 'utf8');

const SECRETS = [
  ['SPOTIFY_CLIENT_ID', 'now-spotify-client-id'],
  ['SPOTIFY_CLIENT_SECRET', 'now-spotify-client-secret'],
  ['SPOTIFY_REFRESH_TOKEN', 'now-spotify-refresh-token'],
  ['OPENXBL_API_KEY', 'now-openxbl-api-key'],
  ['GITHUB_TOKEN', 'now-github-token'],
] as const;

const blocks = (): Map<string, string> => {
  const entries = new Map<string, string>();
  for (const chunk of manifest.split(/\n  - variable: /).slice(1)) {
    const name = chunk.slice(0, chunk.indexOf('\n'));
    entries.set(name, chunk);
  }
  return entries;
};

describe('apphosting.yaml now secrets', () => {
  it('declares the five runtime secrets and never a literal value', () => {
    const entries = blocks();

    for (const [variable, secret] of SECRETS) {
      const block = entries.get(variable);
      expect(block, variable).toBeDefined();
      expect(block).toContain(`secret: ${secret}`);
      expect(block).toContain('RUNTIME');
      expect(block).not.toMatch(/^\s*value:/m);
    }
  });
});
