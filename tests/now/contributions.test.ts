import { describe, expect, it, vi } from 'vitest';
import { fetchContributions, parseContributions } from '../../src/lib/now/contributions';
import { SourceError } from '../../src/lib/now/http';

const day = (date: string, contributionCount: number, contributionLevel: string) => ({ date, contributionCount, contributionLevel });

const body = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 9497,
          weeks: [
            { contributionDays: [day('2025-10-19', 21, 'FIRST_QUARTILE'), day('2025-10-20', 0, 'NONE')] },
            { contributionDays: [day('2025-10-26', 80, 'FOURTH_QUARTILE'), day('2025-10-27', 40, 'THIRD_QUARTILE'), day('2025-10-28', 30, 'SECOND_QUARTILE')] },
          ],
        },
      },
    },
  },
};

describe('parseContributions', () => {
  it('keeps the total and every day, with the level as a number from 0 to 4', () => {
    const calendar = parseContributions(body);
    expect(calendar.total).toBe(9497);
    expect(calendar.weeks).toHaveLength(2);
    expect(calendar.weeks[0]).toEqual([
      { date: '2025-10-19', count: 21, level: 1 },
      { date: '2025-10-20', count: 0, level: 0 },
    ]);
    expect(calendar.weeks[1]!.map((d) => d.level)).toEqual([4, 3, 2]);
  });

  it('names the busiest day, the first one on a tie', () => {
    expect(parseContributions(body).busiest).toEqual({ date: '2025-10-26', count: 80 });
  });

  it('throws a shape error on anything else, an API error body included', () => {
    expect(() => parseContributions({ errors: [{ message: 'Bad credentials' }] })).toThrow(SourceError);
    expect(() => parseContributions({ data: { user: null } })).toThrow(SourceError);
  });
});

describe('fetchContributions', () => {
  it('posts the GraphQL query with the token and never logs it', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body)));
    const calendar = await fetchContributions({ fetch: fetchImpl as unknown as typeof fetch, token: 'ghp_x', login: 'nandomoreirame' });
    expect(calendar.total).toBe(9497);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.github.com/graphql');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer ghp_x');
    expect(JSON.parse(String(init.body)).variables).toEqual({ login: 'nandomoreirame' });
  });
});
