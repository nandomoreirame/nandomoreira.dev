import type { AnalyticsEvent } from './event';

export interface JourneyView {
  time: string;
  path: string;
}

export interface JourneyData {
  entry: string;
  utm: string;
  country: string;
  views: JourneyView[];
}

const clock = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

const channelLabel = (channel: string): string => {
  if (channel === 'direct') return 'direto';
  if (channel === 'internal') return 'interno';
  return channel;
};

/**
 * The pages one visitor saw today, for the lead notification (REQ-012). The
 * entry is the first arrival from outside; later internal clicks do not
 * overwrite where the person came from. Labels are pt-BR for the mail.
 */
export const journeyOf = (events: readonly AnalyticsEvent[]): JourneyData => {
  // A stored document without a usable time (a manual fix, a future writer)
  // is skipped: the lead mail must never fail over the journey (REQ-006).
  const views = events
    .filter(event => event.kind === 'pageview' && typeof event.at === 'string' && !Number.isNaN(Date.parse(event.at)))
    .sort((a, b) => a.at.localeCompare(b.at));

  if (views.length === 0) {
    return { entry: 'direto', utm: 'nenhuma', country: 'desconhecido', views: [] };
  }

  const entry = views.find(event => event.channel !== 'internal') ?? views[0]!;
  const utm = entry.utm
    ? [entry.utm.source, entry.utm.medium, entry.utm.campaign].filter(Boolean).join(' / ')
    : 'nenhuma';

  return {
    entry: channelLabel(entry.channel),
    utm,
    country: entry.country ?? 'desconhecido',
    views: views.map(event => ({ time: clock(event.at), path: event.path })),
  };
};
