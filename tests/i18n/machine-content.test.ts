import { describe, expect, it } from 'vitest';
import { getAllPosts, getAllProjects, getMachinePosts, getMachineProjects } from '../../src/lib/content';
import { casePath, postPath } from '../../src/lib/i18n/paths';

describe('machine content', () => {
  it('serves each case in English when translated, else pt-BR, never both', async () => {
    const [pt, en, machine] = await Promise.all([getAllProjects(), getAllProjects('en'), getMachineProjects()]);
    expect(machine.map((item) => item.slug).sort()).toEqual(pt.map((item) => item.slug).sort());
    for (const item of machine) {
      const translated = en.find((project) => project.slug === item.slug);
      expect(item.locale).toBe(translated ? 'en' : 'pt-BR');
      if (translated) expect(item.summary).toBe(translated.summary);
    }
  });

  it('serves translated current posts in English and keeps the archive in pt-BR', async () => {
    const [pt, machine] = await Promise.all([getAllPosts(), getMachinePosts()]);
    expect(machine).toHaveLength(pt.length);
    for (const post of machine) if (post.archived) expect(post.locale).toBe('pt-BR');
  });

  it('builds the path of each item in its language', () => {
    expect(postPath({ slug: 'the-false-green', locale: 'en' })).toBe('/en/the-false-green');
    expect(postPath({ slug: 'o-falso-verde', locale: 'pt-BR' })).toBe('/o-falso-verde');
    expect(casePath({ slug: 'forja', block: 'ai-tooling', locale: 'en' })).toBe('/en/lab/forja');
  });

  it('indexes a translated post in English and a missing pair in pt-BR', async () => {
    const { GET } = await import('../../src/pages/en/search.json');
    const response = await GET({} as never);
    const items = (await response.json()) as Array<{ path: string; title: string; kind: string }>;

    const translated = items.find((item) => item.path === '/en/the-false-green');
    expect(translated?.kind).toBe('post');
    expect(translated?.title).toBe('The false green: when the gate says PASS and nothing ran');

    const [pt] = await Promise.all([getAllPosts()]);
    const withoutPair = pt.find((post) => post.archived);
    expect(withoutPair).toBeDefined();
    const fallback = items.find((item) => item.path === `/${withoutPair!.slug}`);
    expect(fallback?.title).toBe(withoutPair!.title);
  });
});
