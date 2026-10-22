import { describe, expect, it } from 'vitest';
import { GRID_PAGE_SIZE, LIST_PAGE_SIZE, pageSizeFor, paginate, parsePage } from '../../src/lib/posts/paginate';

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
  it('shows eight posts on the list and twelve on the grid', () => {
    expect(LIST_PAGE_SIZE).toBe(8);
    expect(GRID_PAGE_SIZE).toBe(12);
    expect(pageSizeFor('list')).toBe(8);
    expect(pageSizeFor('grid')).toBe(12);
  });

  it('slices the requested page and counts what it shows', () => {
    expect(paginate(items, 1)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8],
      page: 1,
      totalPages: 2,
      first: 1,
      last: 8,
      total: 11,
    });
    expect(paginate(items, 2)).toEqual({
      items: [9, 10, 11],
      page: 2,
      totalPages: 2,
      first: 9,
      last: 11,
      total: 11,
    });
  });

  it('fits twelve posts on a grid page', () => {
    const many = Array.from({ length: 40 }, (_, index) => index + 1);
    expect(paginate(many, 1, pageSizeFor('grid')).items).toHaveLength(12);
    expect(paginate(many, 2, pageSizeFor('grid'))).toMatchObject({
      items: many.slice(12, 24),
      page: 2,
      totalPages: 4,
      first: 13,
      last: 24,
    });
  });

  it('clamps a page past the end to the last one', () => {
    expect(paginate(items, 9).page).toBe(2);
  });

  it('keeps one empty page when there is nothing to show', () => {
    expect(paginate([], 3)).toEqual({ items: [], page: 1, totalPages: 1, first: 0, last: 0, total: 0 });
  });
});
