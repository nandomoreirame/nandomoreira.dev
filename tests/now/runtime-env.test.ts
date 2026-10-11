import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// `astro dev` does not copy .env into process.env, so a loader that reads
// process.env sees no credential locally. getSecret reads .env in dev and
// process.env at runtime in the Node adapter, and never inlines the value.
describe('/now credentials at runtime', () => {
  const source = readFileSync('src/lib/now/load.ts', 'utf8');

  it('reads them through astro:env getSecret', () => {
    expect(source).toContain("from 'astro:env/server'");
    for (const name of ['OPENXBL_API_KEY', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN', 'GITHUB_TOKEN']) {
      expect(source).toContain(`getSecret('${name}')`);
    }
  });

  it('never hands process.env straight to the config', () => {
    expect(source).not.toContain('readNowConfig(process.env)');
  });
});
