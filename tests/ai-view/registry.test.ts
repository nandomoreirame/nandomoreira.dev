import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { markdownForPath } from '../../src/lib/ai-view/registry';

const site = new URL('https://nandomoreira.dev');

const covered = [
  '',
  'index',
  'sobre',
  'portfolio',
  'lab',
  'portfolio/financial-normalization',
  'lab/forja',
  'posts',
  'posts/arquivo',
  'posts/arquivo/2017',
  'como-exibir-calendario-do-terminal',
  'contato',
  'mcp',
] as const;

describe('markdownForPath', () => {
  it.each(covered)('returns non-empty markdown for covered path %j', async (path) => {
    const page = await markdownForPath(site, path);
    expect(page).toBeDefined();
    expect(page!.markdown.length).toBeGreaterThan(0);
    expect(page!.title.length).toBeGreaterThan(0);
    expect(page!.humanPath.startsWith('/')).toBe(true);
    expect(page!.mdPath.endsWith('.md')).toBe(true);
  });

  it('normalises index and empty path to the home page', async () => {
    const a = await markdownForPath(site, '');
    const b = await markdownForPath(site, 'index');
    const c = await markdownForPath(site, 'index/');

    expect(a?.humanPath).toBe('/');
    expect(a?.mdPath).toBe('/index.md');
    expect(b?.markdown).toBe(a?.markdown);
    expect(c?.markdown).toBe(a?.markdown);
  });

  it('serves a case only in its own collection', async () => {
    const right = await markdownForPath(site, 'lab/forja');
    const wrong = await markdownForPath(site, 'portfolio/forja');

    expect(right?.markdown).toContain('Forja');
    expect(wrong).toBeUndefined();
  });

  it('returns undefined for unknown, wrong-collection and empty-year paths', async () => {
    expect(await markdownForPath(site, 'nao-existe')).toBeUndefined();
    expect(await markdownForPath(site, 'lab/financial-normalization')).toBeUndefined();
    expect(await markdownForPath(site, 'posts/arquivo/1999')).toBeUndefined();
  });

  it('prefixes a post body with title, url and date frontmatter', async () => {
    const page = await markdownForPath(site, 'como-exibir-calendario-do-terminal');
    expect(page?.markdown.startsWith('---\n')).toBe(true);
    expect(page?.markdown).toContain('title:');
    expect(page?.markdown).toContain(
      'url: https://nandomoreira.dev/como-exibir-calendario-do-terminal',
    );
    expect(page?.markdown).toContain('date:');
    expect(page?.humanPath).toBe('/como-exibir-calendario-do-terminal');
    expect(page?.mdPath).toBe('/como-exibir-calendario-do-terminal.md');
  });

  it('reads only through the content access layer', () => {
    const source = readFileSync('src/lib/ai-view/registry.ts', 'utf8');
    expect(source).toContain("from '../content'");
    expect(source).not.toContain('getCollection');
    expect(source).not.toContain('astro:content');
  });
});
