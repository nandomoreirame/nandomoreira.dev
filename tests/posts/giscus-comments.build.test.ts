import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import PostPage from '../../src/pages/[slug].astro';
import { GISCUS_MARKER, scriptViolations } from '../helpers/client-scripts';

const render = async (slug: string) => {
  const entry = (await getAllPostEntries()).find(item => item.data.slug === slug);
  expect(entry, slug).toBeTruthy();
  const container = await AstroContainer.create();
  return container.renderToString(PostPage, { props: { entry }, params: { slug } });
};

describe('giscus in the initial post HTML', () => {
  it('puts the loader on a current post and leaves an archived post without it', async () => {
    const current = await render('fluxo-rpi-claude-code-grok-codex');
    const archived = await render('comece-com-gulp');

    expect(current).toContain('data-giscus-comments');
    expect(readFileSync('src/lib/posts/giscus-loader.ts', 'utf8')).toContain(GISCUS_MARKER);
    expect(archived).not.toContain('data-giscus-comments');
    expect(archived).not.toContain('giscus.app');

    expect(current).not.toMatch(/<script[^>]*\ssrc=["'][^"']*giscus\.app/);
    expect(current).not.toMatch(/<iframe\b[^>]*giscus/i);
    expect(scriptViolations([{ route: '/fluxo-rpi-claude-code-grok-codex', scripts: [GISCUS_MARKER] }])).toEqual([]);
  });
});
