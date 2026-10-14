import { readFileSync } from 'node:fs';
import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/[...path].md.ts';

const site = new URL('https://nandomoreira.dev');

const invoke = (path: string | undefined) =>
  GET({
    params: { path },
    site,
  } as unknown as APIContext);

describe('GET /[...path].md', () => {
  it('serves the home markdown at index.md', async () => {
    const response = await invoke('index');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const body = await response.text();
    expect(body).toMatch(/^---\n/);
    expect(body).toContain('title:');
    expect(body.length).toBeGreaterThan(100);
  });

  it('serves /sobre.md with text/markdown', async () => {
    const response = await invoke('sobre');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await response.text()).toContain('Sobre');
  });

  it('serves nested paths such as posts/arquivo', async () => {
    const response = await invoke('posts/arquivo');

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Arquivo');
  });

  it('returns 404 text/plain for an unknown path', async () => {
    const response = await invoke('nao-existe');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toMatch(/text\/plain/);
  });

  it('treats a missing path param as the home page', async () => {
    const response = await invoke(undefined);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
  });

  it('opts out of prerendering', () => {
    const source = readFileSync('src/pages/[...path].md.ts', 'utf8');
    expect(source).toContain('prerender = false');
  });

  it('reads through the access layer, never through getCollection', () => {
    const source = readFileSync('src/pages/[...path].md.ts', 'utf8');
    expect(source).not.toContain('getCollection(');
  });
});

describe('GET /[...path].md canonical', () => {
  it('points search engines at the human page with a Link header', async () => {
    expect((await invoke('sobre')).headers.get('link')).toBe('<https://nandomoreira.dev/sobre>; rel="canonical"');
    expect((await invoke('index')).headers.get('link')).toBe('<https://nandomoreira.dev/>; rel="canonical"');
  });
});
