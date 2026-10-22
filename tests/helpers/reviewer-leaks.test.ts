import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reviewerLeaks } from './reviewer-leaks';

describe('reviewerLeaks', () => {
  it('names every built file that carries the reviewer', () => {
    const dir = mkdtempSync(join(tmpdir(), 'reviewer-leaks-'));
    mkdirSync(join(dir, 'client/_astro'), { recursive: true });
    writeFileSync(join(dir, 'client/_astro/app.js'), 'send("post-review:save")');
    writeFileSync(join(dir, 'client/index.html'), '<button>Revisar texto</button>');
    writeFileSync(join(dir, 'client/clean.html'), '<article data-post-slug="x"></article>');
    writeFileSync(join(dir, 'client/logo.png'), 'post-review:save');
    writeFileSync(join(dir, 'client/shortcut.js'), 'hasAttribute("data-post-review")');

    expect(reviewerLeaks(dir).sort()).toEqual(
      [join(dir, 'client/_astro/app.js'), join(dir, 'client/index.html'), join(dir, 'client/shortcut.js')].sort(),
    );
  });
});
