import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A case page and its image folder share a path: public/lab/forja/ holds the
 * images of /lab/forja. With build.format 'file' the page became lab/forja.html,
 * the static server found the folder first and answered 404 for every such case
 * (production, 2026-10-13). The page must live inside that folder.
 */
describe('case pages that share a path with their image folder', () => {
  const cases = ['lab', 'portfolio'].flatMap(collection => {
    const dir = join('public', collection);
    return existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter(entry => entry.isDirectory())
          .map(entry => `${collection}/${entry.name}`)
      : [];
  });

  it('exist, so the check is not vacuous', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)('%s is built as an index.html inside the folder', path => {
    expect(existsSync(join('dist/client', path, 'index.html'))).toBe(true);
  });
});
