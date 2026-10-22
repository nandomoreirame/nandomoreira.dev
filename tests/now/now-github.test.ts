import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NowGithub from '../../src/components/now/NowGithub.astro';

const calendar = {
  total: 12,
  weeks: [[{ date: '2026-10-10', count: 12, level: 4 as const }]],
  busiest: { date: '2026-10-10', count: 12 },
};
const commit = {
  repo: 'noctalia-aibar',
  message: 'feat: one thing',
  url: 'https://github.com/nandomoreirame/noctalia-aibar/commit/1',
  committedAt: '2026-10-19T12:00:00Z',
};

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(NowGithub, { props });

describe('NowGithub', () => {
  it('holds the contribution grid and the last commit in one card, split by a rule', async () => {
    const html = await render({ calendar, commit });
    const card = html.match(/<div[^>]*data-github-card[^>]*>/)?.[0] ?? '';
    expect(card).toMatch(/\bborder-border-strong\b/);
    expect(card).toContain('not-prose');
    expect(html.indexOf('data-contributions')).toBeLessThan(html.indexOf('data-last-commit'));
    expect(html).toMatch(/<div[^>]*\bborder-t\b[^>]*>\s*<a[^>]*data-last-commit/);
  });

  it('keeps whichever part it has, without a rule, and renders nothing with neither', async () => {
    const onlyCommit = await render({ commit });
    expect(onlyCommit).toContain('data-last-commit');
    expect(onlyCommit).not.toContain('data-contributions');
    expect(onlyCommit).not.toMatch(/\bborder-t\b/);
    expect(await render({ calendar })).not.toContain('data-last-commit');
    expect((await render({})).trim()).toBe('');
  });
});
