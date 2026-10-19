import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.astro') ? [path] : [];
  });

describe('page title separator', () => {
  it('never hand-writes the old " | " separator in a page title: titles go through pageTitle', () => {
    const offenders = walk('src/pages').filter(file =>
      /title=(\{`[^`]*\s\|\s[^`]*`\}|"[^"]*\s\|\s[^"]*")/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('builds the home title with the same separator', () => {
    expect(readFileSync('src/lib/home/meta.ts', 'utf8')).toContain('TITLE_SEPARATOR');
  });
});
