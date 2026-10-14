import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLIENT = 'dist/client';
const PIXEL = '<img src="/v.gif"';

const pagesUnder = (dir: string): string[] =>
  existsSync(join(CLIENT, dir))
    ? readdirSync(join(CLIENT, dir))
        .map((name) => join(CLIENT, dir, name, 'index.html'))
        .filter(existsSync)
    : [];

describe('pixel placement in the build', () => {
  it('puts the pixel on every prerendered case and archive year', () => {
    const pages = [...pagesUnder('lab'), ...pagesUnder('portfolio'), ...pagesUnder('posts/arquivo')];
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(readFileSync(page, 'utf8'), page).toContain(PIXEL);
  });

  it('puts the pixel on a prerendered post', () => {
    const post = join(CLIENT, 'como-exibir-calendario-do-terminal', 'index.html');
    expect(readFileSync(post, 'utf8')).toContain(PIXEL);
  });

  it('ships no prerendered home, so the SSR pages stay pixel-free', () => {
    expect(existsSync(join(CLIENT, 'index.html'))).toBe(false);
  });
});
