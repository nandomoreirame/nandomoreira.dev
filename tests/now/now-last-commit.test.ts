import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NowLastCommit from '../../src/components/now/NowLastCommit.astro';

const commit = {
  repo: 'noctalia-aibar',
  message: 'feat: <b>one</b> thing',
  url: 'https://github.com/nandomoreirame/noctalia-aibar/commit/1',
  committedAt: '2026-10-19T12:00:00Z',
};

const render = async () => (await AstroContainer.create()).renderToString(NowLastCommit, { props: { commit } });

describe('NowLastCommit', () => {
  it('is a row linking to the commit on GitHub, in a new tab, free of the Prose underline', async () => {
    const row = (await render()).match(/<a[^>]*data-last-commit[^>]*>/)?.[0] ?? '';
    expect(row).toContain('href="https://github.com/nandomoreirame/noctalia-aibar/commit/1"');
    expect(row).toContain('target="_blank"');
    expect(row).toMatch(/\bno-underline!/);
    // The frame belongs to the GitHub card around it.
    expect(row).not.toMatch(/\bborder-border-strong\b/);
  });

  it('reads in three levels: eyebrow, the message in mono, then the repo and the day', async () => {
    const html = await render();
    expect(html).toContain('Último commit');
    expect(html).toContain('lucide:git-commit-horizontal');
    expect(html).toContain('feat: &lt;b&gt;one&lt;/b&gt; thing');
    expect(html).toContain('noctalia-aibar');
    expect(html).toMatch(/<time datetime="2026-10-19">19 de outubro de 2026<\/time>/);
    expect(html.indexOf('Último commit')).toBeLessThan(html.indexOf('feat: &lt;b&gt;'));
  });
});
