import { describe, expect, it } from 'vitest';
import {
  getAllPosts,
  getAllProjects,
  getCurrentPosts,
  getPost,
  getProject,
  translationPairs,
} from '../../src/lib/content';

describe('access layer by locale', () => {
  it('keeps pt-BR as the default', async () => {
    expect((await getAllPosts()).length).toBeGreaterThan(0);
    expect((await getAllProjects()).length).toBe(28);
  });

  it('serves no English post or case before i18n-content', async () => {
    expect(await getAllPosts('en')).toEqual([]);
    expect(await getCurrentPosts('en')).toEqual([]);
    expect(await getAllProjects('en')).toEqual([]);
    expect(await getPost('o-falso-verde', 'en')).toBeUndefined();
    expect(await getProject('forja', 'en')).toBeUndefined();
  });

  it('has no translation pair yet', async () => {
    expect(await translationPairs()).toEqual([]);
  });
});
