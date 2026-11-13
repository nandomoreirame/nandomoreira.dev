import type { Locale } from '../i18n/locale';
import { messagesFor } from '../i18n/messages';

/** Calendar day in America/Sao_Paulo, as YYYY-MM-DD. Never a clock time. */
export const saoPauloDay = (instant: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);

export const shiftDay = (isoDay: string, days: number): string => {
  const [year, month, day] = isoDay.split('-').map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
};

/** Calendar day in America/Sao_Paulo. Never a clock time (REQ-008). */
export const dayLabel = (playedAt: string, now: Date, locale: Locale = 'pt-BR'): string => {
  const playedDay = saoPauloDay(new Date(playedAt));
  const today = saoPauloDay(now);
  const t = messagesFor(locale).nowPage;
  if (playedDay === today) return t.today;
  if (playedDay === shiftDay(today, -1)) return t.yesterday;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(playedAt));
};
