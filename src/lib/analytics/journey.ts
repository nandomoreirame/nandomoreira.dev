import type { AnalyticsEvent } from './event';

const clock = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

/**
 * The pages one visitor saw today, for the lead notification (REQ-012). The
 * entry is the first arrival from outside; later internal clicks do not
 * overwrite where the person came from.
 */
export const renderJourney = (events: readonly AnalyticsEvent[]): string => {
  // A stored document without a usable time (a manual fix, a future writer)
  // is skipped: the lead mail must never fail over the journey (REQ-006).
  const views = events
    .filter((event) => event.kind === 'pageview' && typeof event.at === 'string' && !Number.isNaN(Date.parse(event.at)))
    .sort((a, b) => a.at.localeCompare(b.at));

  if (views.length === 0) return ['Journey today', '-------------', 'No journey recorded today.'].join('\n');

  const entry = views.find((event) => event.channel !== 'internal') ?? views[0]!;
  const utm = entry.utm
    ? [entry.utm.source, entry.utm.medium, entry.utm.campaign].filter(Boolean).join(' / ')
    : 'none';

  return [
    'Journey today (São Paulo time)',
    '------------------------------',
    `Entry:   ${entry.channel}`,
    `UTM:     ${utm}`,
    `Country: ${entry.country ?? 'unknown'}`,
    `Visits:  ${views.length}`,
    '',
    ...views.map((event) => `  ${clock(event.at)}  ${event.path}`),
  ].join('\n');
};
