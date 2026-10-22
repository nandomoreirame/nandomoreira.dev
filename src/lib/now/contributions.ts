import { z } from 'zod';
import { SourceError, fetchJson } from './http';

const GRAPHQL_URL = 'https://api.github.com/graphql';

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const;

const responseSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number().int().nonnegative(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                  contributionCount: z.number().int().nonnegative(),
                  contributionLevel: z.enum([
                    'NONE',
                    'FIRST_QUARTILE',
                    'SECOND_QUARTILE',
                    'THIRD_QUARTILE',
                    'FOURTH_QUARTILE',
                  ]),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});

export interface ContributionDay {
  date: string;
  count: number;
  /** 0 (none) to 4 (busiest quartile), as GitHub buckets them. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionCalendar {
  total: number;
  /** One array per week, Sunday first, as GitHub returns them. */
  weeks: ContributionDay[][];
  busiest?: { date: string; count: number };
}

/** The year of contributions on the GitHub profile (docs: /now, 2026-10-19). */
export const parseContributions = (json: unknown): ContributionCalendar => {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');
  const calendar = parsed.data.data.user.contributionsCollection.contributionCalendar;
  const weeks = calendar.weeks.map(week =>
    week.contributionDays.map(day => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVELS[day.contributionLevel],
    })),
  );
  const busiest = weeks
    .flat()
    .reduce<ContributionDay | undefined>((top, day) => (day.count > (top?.count ?? 0) ? day : top), undefined);
  return {
    total: calendar.totalContributions,
    weeks,
    ...(busiest ? { busiest: { date: busiest.date, count: busiest.count } } : {}),
  };
};

/** GraphQL needs a token, even for public data; without one the section is left out. */
export const fetchContributions = async ({
  fetch: fetchImpl,
  token,
  login,
}: {
  fetch: typeof fetch;
  token: string;
  login: string;
}): Promise<ContributionCalendar> => {
  const json = await fetchJson(fetchImpl, GRAPHQL_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'nandomoreira.dev',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  return parseContributions(json);
};
