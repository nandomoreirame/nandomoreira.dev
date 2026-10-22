import { describe, expect, it } from 'vitest';
import {
  handleListingView,
  listingHref,
  listingViewSetCookie,
  parseListingView,
} from '../../src/lib/posts/listing-view';

describe('parseListingView', () => {
  it('reads the grid from the session cookie, including when it also marks the author', () => {
    expect(parseListingView('grid')).toBe('grid');
    expect(parseListingView('self.grid')).toBe('grid');
  });

  it('stays on the list for anything else, including the author mark alone and the old query value', () => {
    for (const raw of [null, undefined, '', 'list', 'self', 'grade', 'GRID', 'grid ', 'listing-view']) {
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
  it('stores the grid on __session, the only cookie name App Hosting forwards', () => {
    const header = listingViewSetCookie('grid', { secure: true, domain: 'nandomoreira.dev' });
    expect(header.split('; ')[0]).toBe('__session=grid');
    expect(header).not.toContain('listing-view');
    expect(header.split('; ')).toContain('Path=/');
    expect(header).not.toContain('Path=/posts');
    expect(header).toContain('Domain=nandomoreira.dev');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Max-Age=31536000');
    expect(header).toContain('Secure');
  });

  it('keeps the author mark in the same cookie when the grid is chosen', () => {
    const header = listingViewSetCookie('grid', { secure: true, current: 'self', domain: 'nandomoreira.dev' });
    expect(header.split('; ')[0]).toBe('__session=self.grid');
  });

  it('drops the grid and keeps the author mark when the list is chosen again', () => {
    const header = listingViewSetCookie('list', { secure: true, current: 'self.grid', domain: 'nandomoreira.dev' });
    expect(header.split('; ')[0]).toBe('__session=self');
    expect(header).toContain('Max-Age=31536000');
  });

  it('clears the cookie when a visitor returns to the list, without Secure or Domain off the public host', () => {
    const header = listingViewSetCookie('list', { secure: false });
    expect(header.split('; ')[0]).toBe('__session=');
    expect(header).toContain('Max-Age=0');
    expect(header).not.toContain('Secure');
    expect(header).not.toContain('Domain=');
  });
});

describe('handleListingView', () => {
  const post = (body: string, url = 'https://nandomoreira.dev/posts', cookie?: string) =>
    new Request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(cookie ? { cookie } : {}),
      },
      body,
    });

  it('sets the grid on __session and redirects to the same page without ?visao', async () => {
    const response = await handleListingView(post('visao=grade', 'https://nandomoreira.dev/posts?pagina=2'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/posts?pagina=2');
    expect(response.headers.get('set-cookie')?.split('; ')[0]).toBe('__session=grid');
    expect(response.headers.get('set-cookie')).toContain('Domain=nandomoreira.dev');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('location')).not.toContain('visao');
  });

  it('keeps the author excluded when he switches this browser to the grid', async () => {
    const response = await handleListingView(
      post('visao=grade', 'https://nandomoreira.dev/posts', '__session=self'),
    );
    expect(response.headers.get('set-cookie')?.split('; ')[0]).toBe('__session=self.grid');
    expect(response.headers.get('set-cookie')).toContain('Domain=nandomoreira.dev');
  });

  it('returns to /posts when the first page leaves the grid, and clears a visitor cookie on http', async () => {
    const response = await handleListingView(post('visao=lista', 'http://localhost:4321/posts?pagina=1'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/posts');
    expect(response.headers.get('set-cookie')?.split('; ')[0]).toBe('__session=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(response.headers.get('set-cookie')).not.toContain('Secure');
    expect(response.headers.get('set-cookie')).not.toContain('Domain=');
  });

  it('rejects a get and an unknown view without setting a cookie', async () => {
    const get = await handleListingView(new Request('https://nandomoreira.dev/posts'));
    expect(get.status).toBe(405);

    const bad = await handleListingView(post('visao=tabela'));
    expect(bad.status).toBe(400);
    expect(bad.headers.get('set-cookie')).toBeNull();
  });
});
