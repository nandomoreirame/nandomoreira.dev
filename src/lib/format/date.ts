const ISO_DATE = /^(\d{4})-(\d{2})-\d{2}$/;

/**
 * Reads the ISO string directly instead of constructing a Date: parsing
 * '2026-01-01' as UTC and formatting in a negative offset yields 12/2025.
 */
export const toCompactStamp = (iso: string): string => {
  const match = ISO_DATE.exec(iso);

  if (!match) {
    throw new Error(`Expected an ISO-8601 date (YYYY-MM-DD), received "${iso}"`);
  }

  const [, year, month] = match;

  return `${month}/${year}`;
};

const FULL_ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "11 de outubro de 2026". Built from the parts in UTC and formatted in UTC,
 * so no local offset can move the day.
 */
export const toLongDate = (iso: string): string => {
  const match = FULL_ISO_DATE.exec(iso);

  if (!match) {
    throw new Error(`Expected an ISO-8601 date (YYYY-MM-DD), received "${iso}"`);
  }

  const [, year, month, day] = match.map(Number);

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
};

const SHORT_MONTHS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

/**
 * "16 out. 2026", the post listings' stamp (2026-10-16). The day is padded so
 * every stamp has the same width in mono. A fixed table, not Intl, whose
 * pt-BR short month has no stable punctuation.
 */
export const toShortDate = (iso: string): string => {
  const match = FULL_ISO_DATE.exec(iso);

  if (!match) {
    throw new Error(`Expected an ISO-8601 date (YYYY-MM-DD), received "${iso}"`);
  }

  const [, year, month, day] = match;

  return `${day} ${SHORT_MONTHS[Number(month) - 1]} ${year}`;
};
