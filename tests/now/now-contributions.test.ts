import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NowContributions from '../../src/components/now/NowContributions.astro';
import type { ContributionCalendar } from '../../src/lib/now/contributions';

const week = (start: number, level: 0 | 1 | 2 | 3 | 4) =>
  Array.from({ length: 7 }, (_, d) => ({
    date: `2026-10-${String(start + d).padStart(2, '0')}`,
    count: level * 10,
    level,
  }));

const calendar: ContributionCalendar = {
  total: 9497,
  weeks: [week(4, 0), week(11, 2), week(18, 4)],
  busiest: { date: '2026-10-18', count: 40 },
};

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(NowContributions, { props });

describe('NowContributions', () => {
  it('draws one cell per day, coloured by level through classes, with the count as hover text', async () => {
    const html = await render({ calendar });
    // The legend draws five more squares, without a position of their own.
    expect(html.match(/<rect x="\d+"[^>]*class="contrib contrib-\d"/g)).toHaveLength(21);
    expect(html).toContain('class="contrib contrib-4"');
    expect(html).toMatch(/<title>40 contribuições em 18 de outubro de 2026<\/title>/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('says the year in text, for screen readers and for anyone who skips the chart', async () => {
    const html = await render({ calendar });
    expect(html).toContain('9.497 contribuições no GitHub no último ano');
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-labelledby="contrib-summary"/);
    expect(html).toContain('Menos');
    expect(html).toContain('Mais');
  });

  it('renders nothing without a calendar', async () => {
    expect((await render({})).trim()).toBe('');
  });
});
