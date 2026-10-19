import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { getProfile } from '../../src/lib/content';

const site = new URL('https://nandomoreira.dev');

describe('/now machine surfaces', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers the AI view at /now and /now.md', async () => {
    const page = await markdownForPath(site, 'now');

    expect(page?.humanPath).toBe('/now');
    expect(page?.mdPath).toBe('/now.md');
    expect(page?.markdown).toContain('title: Agora');
  });

  it('lists /now in the sitemap and in the AI index', async () => {
    expect(buildSitemap({ site, projects: [] })).toContain('<loc>https://nandomoreira.dev/now</loc>');

    const index = buildAiIndex({ site, profile: await getProfile(), projects: [], posts: [] });
    const pages = index.entries.filter(entry => entry.type === 'page');

    expect(pages).toContainEqual({
      type: 'page',
      url: 'https://nandomoreira.dev/now',
      title: 'Now',
    });
  });

  it('keeps /now on the client-js gate and the AEO route checks', () => {
    expect(readFileSync('tests/design-system/no-client-js.build-test.ts', 'utf8')).toContain("'/now'");
    const script = readFileSync('scripts/verify-aeo-routes.sh', 'utf8');
    expect(script).toMatch(/check "\/now\.md"\s+"text\/markdown"\s+"title: Agora"/);
    expect(script).toMatch(/check "\/now\/ia"\s+"text\/html"\s+'name="robots" content="noindex"'/);
  });
});
