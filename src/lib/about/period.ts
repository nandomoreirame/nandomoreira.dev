const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/**
 * Split the ISO string instead of building a Date: `new Date('2025-11-01')` is
 * midnight UTC, which is still October in Brazil and would shift the month.
 */
const monthYear = (isoDate: string): string => {
  const [year, month] = isoDate.split('-');
  return `${MONTHS[Number(month) - 1]}/${year}`;
};

/** An absent end date means the position is current, and the page says so. */
export const formatPeriod = (startDate: string, endDate?: string): string =>
  `${monthYear(startDate)} – ${endDate ? monthYear(endDate) : 'atual'}`;

/** Earliest start year in the history, or undefined when there is none. */
export const careerStartYear = (
  work: ReadonlyArray<{ startDate: string }> | undefined,
): number | undefined => {
  if (!work || work.length === 0) return undefined;
  return Math.min(...work.map((entry) => Number(entry.startDate.slice(0, 4))));
};
