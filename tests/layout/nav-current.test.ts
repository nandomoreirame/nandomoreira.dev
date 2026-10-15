import { describe, expect, it } from 'vitest';
import { navCurrent } from '../../src/lib/layout/nav-current';

describe('navCurrent', () => {
  it('marks the item of the page itself as the page', () => {
    expect(navCurrent('/lab', { current: '/lab' })).toBe('page');
  });

  it('marks a section item while inside it, as a location, not the page', () => {
    expect(navCurrent('/lab', { current: '/lab/job-radar' })).toBe('true');
    expect(navCurrent('/portfolio', { current: '/portfolio/play-manager' })).toBe('true');
    expect(navCurrent('/posts', { current: '/posts/arquivo' })).toBe('true');
  });

  it('marks the section a page declares, for posts that live at the root', () => {
    expect(navCurrent('/posts', { current: '/o-falso-verde', section: '/posts' })).toBe('true');
  });

  it('never marks an item whose path is only a prefix of another word', () => {
    expect(navCurrent('/lab', { current: '/laboratorio' })).toBeUndefined();
  });

  it('marks nothing elsewhere', () => {
    expect(navCurrent('/lab', { current: '/sobre' })).toBeUndefined();
    expect(navCurrent('/lab', {})).toBeUndefined();
  });
});
