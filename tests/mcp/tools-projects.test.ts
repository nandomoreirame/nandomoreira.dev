import { describe, expect, it } from 'vitest';
import { getAllProjects } from '../../src/lib/content';
import type { ProjectDetailAnswer, ProjectSummaryAnswer } from '../../src/lib/mcp/tools/projects';
import { clientPattern, confidentialClientNames } from '../helpers/confidential-clients';
import { callTool, callToolRaw } from './client';

interface ProjectList {
  projects: ProjectSummaryAnswer[];
  total: number;
}

describe('list_projects', () => {
  it('lists every published case when no filter is given', async () => {
    const result = await callTool<ProjectList>('list_projects');

    expect(result.projects).toHaveLength((await getAllProjects()).length);
    expect(result.total).toBe(result.projects.length);
  });

  it('filters by collection', async () => {
    const lab = await callTool<ProjectList>('list_projects', { collection: 'lab' });

    expect(lab.projects.length).toBeGreaterThan(0);
    for (const project of lab.projects) expect(project.collection).toBe('lab');
  });

  it('rejects a collection the catalog does not have', async () => {
    // The declared schema validates before the handler runs, so a bad value
    // never reaches the access layer.
    await expect(callTool('list_projects', { collection: 'nope' })).rejects.toThrow();
  });

  it('returns an array, never an error, when a filter matches nothing', async () => {
    const result = await callTool<ProjectList>('list_projects', {
      collection: 'portfolio',
    });

    expect(Array.isArray(result.projects)).toBe(true);
  });

  it.each(confidentialClientNames())('never names %s, the client of a confidential case', async client => {
    const all = JSON.stringify(await callTool('list_projects'));

    // The archive redacts the client on read; the tool must not undo it.
    expect(all).not.toMatch(clientPattern(client));
  });

  it('omits a link it does not have instead of inventing one', async () => {
    const all = (await callTool<ProjectList>('list_projects')).projects;

    for (const project of all) {
      if ('liveUrl' in project) expect(project.liveUrl).toMatch(/^https?:\/\//);
      if ('repoUrl' in project) expect(project.repoUrl).toMatch(/^https?:\/\//);
    }
  });
});

describe('get_project', () => {
  it('returns the full case for a known slug', async () => {
    const [first] = await getAllProjects();
    const result = await callTool<ProjectDetailAnswer>('get_project', { slug: first.slug });

    expect(result.title).toBe(first.title);
    expect(result.problem).toBeTruthy();
    expect(result.outcome).toBeTruthy();
  });

  it('answers an unknown slug with a tool error, never an unhandled throw', async () => {
    const result = await callToolRaw('get_project', { slug: 'nao-existe' });

    expect(result.isError).toBe(true);
  });

  it('tells the caller how to recover from an unknown slug', async () => {
    const result = await callToolRaw('get_project', { slug: 'nao-existe' });

    expect(result.content?.[0]?.text).toContain('list_projects');
  });

  it('rejects an empty slug at the schema, before the access layer', async () => {
    await expect(callTool('get_project', { slug: '' })).rejects.toThrow();
  });

  it('survives a slug with characters outside the pattern', async () => {
    const result = await callToolRaw('get_project', { slug: '../../etc/passwd' });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/root:|\/etc\/passwd:/);
  });
});
