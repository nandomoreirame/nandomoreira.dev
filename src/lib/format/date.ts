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
