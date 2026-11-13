import { describe, expect, it } from 'vitest';
import { getAllProjects } from '../../src/lib/content';

const BATCHES: string[] = [
  'bragstack',
  'croonos',
  'mousai',
  'portfoliosnap',
  'amnesia-claude-code',
  'forja',
  'forja-plugins',
  'terminal-noir',
];

describe('translated cases', () => {
  it.each(BATCHES)('%s is served in English with its pt-BR structure', async (slug) => {
    const [pt, en] = await Promise.all([getAllProjects(), getAllProjects('en')]);
    const source = pt.find((project) => project.slug === slug)!;
    const translated = en.find((project) => project.slug === slug);
    expect(translated).toBeDefined();
    expect(translated!.summary).not.toBe(source.summary);
    expect(translated!.problem).not.toBe(source.problem);
    expect(translated!.tech).toEqual(source.tech);
  });
});
