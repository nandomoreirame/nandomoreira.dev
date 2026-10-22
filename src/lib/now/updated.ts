import { saoPauloDay } from './day';

/**
 * The /now date: the latest of the text's own date and the last thing Spotify,
 * Xbox or a GitHub commit saw (asked on 2026-10-19). A game in the foreground counts as today.
 * Days are compared as YYYY-MM-DD in São Paulo time, never as clock times.
 */
export const nowUpdatedAt = ({
  base,
  trackPlayedAt = [],
  gameDays = [],
  playingNow = false,
  commitAt,
  today,
}: {
  base: string;
  trackPlayedAt?: readonly string[];
  gameDays?: readonly string[];
  playingNow?: boolean;
  /** The last commit on GitHub, since 2026-10-19. */
  commitAt?: string;
  today: Date;
}): string => {
  const trackDays = [...trackPlayedAt, ...(commitAt ? [commitAt] : [])].flatMap(iso => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? [] : [saoPauloDay(date)];
  });
  const days = [base, ...trackDays, ...gameDays, ...(playingNow ? [saoPauloDay(today)] : [])];
  return days.reduce((latest, day) => (day > latest ? day : latest));
};
