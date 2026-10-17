/**
 * Pages of the /posts listing (2026-10-17): six current posts a page, the page
 * read from ?pagina. Anything that is not a positive integer reads as the
 * first page, and a page past the end shows the last one, so a stale or typed
 * link never lands on an empty list.
 */
export const POSTS_PER_PAGE = 6;

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  /** 1-based position of the first and last item shown; 0 when there is none. */
  first: number;
  last: number;
  total: number;
}

export const parsePage = (raw: string | null): number => (raw && /^[1-9]\d*$/.test(raw) ? Number(raw) : 1);

export const paginate = <T>(items: readonly T[], requested: number, size = POSTS_PER_PAGE): Page<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, requested), totalPages);
  const start = (page - 1) * size;
  const shown = items.slice(start, start + size);

  return {
    items: shown,
    page,
    totalPages,
    first: shown.length > 0 ? start + 1 : 0,
    last: start + shown.length,
    total: items.length,
  };
};
