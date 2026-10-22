import { describe, expect, it } from 'vitest';
import {
  LISTING_VIEW_COOKIE,
  handleListingView,
  listingHref,
  listingViewSetCookie,
  parseListingView,
} from '../../src/lib/posts/listing-view';

describe('parseListingView', () => {
  it('reads the grid from the listing-view cookie', () => {
    expect(parseListingView('grid')).toBe('grid');
  });

  it('stays on the list for anything else, including the old query value', () => {
    for (const raw of [null, undefined, '', 'list', 'grade', 'GRID', 'grid ']) {
      expect(parseListingView(raw)).toBe('list');
    }
  });
});

describe('listingHref', () => {
  it('pages the list and never puts the view in the url', () => {
    expect(listingHref(1)).toBe('/posts');
    expect(listingHref(2)).toBe('/posts?pagina=2');
    expect(listingHref(2)).not.toContain('visao');
  });
});

describe('listingViewSetCookie', () => {
  it('stores the view for a year, httpOnly, scoped to /posts', () => {
    const header = listingViewSetCookie('grid', true);
    expect(header).toContain(`${LISTING_VIEW_COOKIE}=grid`);
    expect(header).toContain('Path=/posts');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Max-Age=31536000');
    expect(header).toContain('Secure');
  });

  it('omits Secure on http so the local dev server can store it', () => {
    expect(listingViewSetCookie('list', false)).not.toContain('Secure');
  });
});

describe('handleListingView', () => {
  const post = (body: string, url = 'https://nandomoreira.dev/posts') =>
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

  it('sets the grid cookie and redirects to the same page without ?visao', async () => {
    const response = await handleListingView(post('visao=grade', 'https://nandomoreira.dev/posts?pagina=2'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/posts?pagina=2');
    expect(response.headers.get('set-cookie')).toContain(`${LISTING_VIEW_COOKIE}=grid`);
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('location')).not.toContain('visao');
  });

  it('returns to /posts when the first page leaves the grid, without Secure on http', async () => {
    const response = await handleListingView(post('visao=lista', 'http://localhost:4321/posts?pagina=1'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/posts');
    expect(response.headers.get('set-cookie')).toContain(`${LISTING_VIEW_COOKIE}=list`);
    expect(response.headers.get('set-cookie')).not.toContain('Secure');
  });

  it('rejects a get and an unknown view without setting a cookie', async () => {
    const get = await handleListingView(new Request('https://nandomoreira.dev/posts'));
    expect(get.status).toBe(405);

    const bad = await handleListingView(post('visao=tabela'));
    expect(bad.status).toBe(400);
    expect(bad.headers.get('set-cookie')).toBeNull();
  });
});
