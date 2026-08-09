import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/index.astro', 'utf8');

describe('/projetos', () => {
  it('reads projects through the access layer, never through getCollection', () => {
    expect(page).toContain('getProjectsByBlock');
    expect(page).not.toContain('getCollection(');
  });

  it('renders every block, so an empty one stays visible', () => {
    expect(page).toContain('BlockSection');
  });

  it('uses the shared layout', () => {
    expect(page).toContain('BaseLayout');
  });
});
