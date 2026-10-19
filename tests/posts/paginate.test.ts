import { describe, expect, it } from 'vitest';
import { POSTS_PER_PAGE, paginate, parsePage } from '../../src/lib/posts/paginate';

const items = Array.from({ length: 11 }, (_, index) => index + 1);

describe('parsePage', () => {
  it('reads a positive integer from ?pagina', () => {
    expect(parsePage('2')).toBe(2);
  });

  it('falls back to the first page on anything else', () => {
    for (const raw of [null, '', '0', '-1', '1.5', 'abc', '2x']) {
      expect(parsePage(raw)).toBe(1);
    }
  });
});

describe('paginate', () => {
  it('shows six posts per page', () => {
    expect(POSTS_PER_PAGE).toBe(6);
  });

  it('slices the requested page and counts what it shows', () => {
    expect(paginate(items, 1)).toEqual({
      items: [1, 2, 3, 4, 5, 6],
      page: 1,
      totalPages: 2,
      first: 1,
      last: 6,
      total: 11,
    });
    expect(paginate(items, 2)).toEqual({
      items: [7, 8, 9, 10, 11],
      page: 2,
      totalPages: 2,
      first: 7,
      last: 11,
      total: 11,
    });
  });

  it('clamps a page past the end to the last one', () => {
    expect(paginate(items, 9).page).toBe(2);
  });

  it('keeps one empty page when there is nothing to show', () => {
    expect(paginate([], 3)).toEqual({ items: [], page: 1, totalPages: 1, first: 0, last: 0, total: 0 });
  });
});
