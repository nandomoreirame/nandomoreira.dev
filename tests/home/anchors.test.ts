import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPECTED_ANCHORS = ['inicio', 'projetos', 'trajetoria', 'servicos', 'sobre', 'contato'];

const homeSources = readdirSync('src/components/home')
  .filter((file) => file.endsWith('.astro'))
  .map((file) => readFileSync(join('src/components/home', file), 'utf8'))
  .join('\n');

const nav = readFileSync('src/components/layout/SiteNav.astro', 'utf8');

describe('section anchors', () => {
  it.each(EXPECTED_ANCHORS)('exposes a stable id for %s', (anchor) => {
    expect(homeSources).toContain(`id="${anchor}"`);
  });

  it('never links to a route that does not exist yet', () => {
    expect(nav).not.toContain('href="/sobre"');
    expect(nav).not.toContain('href="/contato"');
    expect(nav).not.toContain('href="/agents"');
  });
});
