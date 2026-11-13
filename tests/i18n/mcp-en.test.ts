import { describe, expect, it } from 'vitest';
import { getMachineProjects, getProfile } from '../../src/lib/content';
import { casePath } from '../../src/lib/i18n/paths';
import type { ProfileAnswer } from '../../src/lib/mcp/tools/profile';
import type { ProjectDetailAnswer, ProjectSummaryAnswer } from '../../src/lib/mcp/tools/projects';
import { callTool } from '../mcp/client';

interface ProjectList {
  projects: ProjectSummaryAnswer[];
  total: number;
}

describe('MCP tools in English', () => {
  it('get_profile returns the English headline', async () => {
    const [answer, profile] = await Promise.all([
      callTool<ProfileAnswer>('get_profile'),
      getProfile('en'),
    ]);

    expect(answer.headline).toBe(profile.headline);
  });

  it('list_projects returns English summary and /en URL for each translated case', async () => {
    const [list, machine] = await Promise.all([
      callTool<ProjectList>('list_projects'),
      getMachineProjects(),
    ]);
    const bySlug = new Map(list.projects.map(project => [project.slug, project]));

    for (const project of machine.filter(item => item.locale === 'en')) {
      const answer = bySlug.get(project.slug);
      expect(answer?.summary, project.slug).toBe(project.summary);
      expect(answer?.url, project.slug).toContain('/en/');
      expect(answer?.url, project.slug).toBe(
        casePath({ slug: project.slug, block: project.block, locale: project.locale }),
      );
    }
  });

  it('get_project returns English summary and /en URL for a translated case', async () => {
    const machine = await getMachineProjects();
    const translated = machine.find(item => item.locale === 'en');
    expect(translated).toBeDefined();

    const answer = await callTool<ProjectDetailAnswer>('get_project', { slug: translated!.slug });

    expect(answer.summary).toBe(translated!.summary);
    expect(answer.url).toContain('/en/');
    expect(answer.url).toBe(
      casePath({ slug: translated!.slug, block: translated!.block, locale: translated!.locale }),
    );
  });

  it('never returns clientName for a confidential case', async () => {
    const machine = await getMachineProjects();
    const confidential = machine.find(item => item.confidential);
    expect(confidential).toBeDefined();

    const answer = await callTool<ProjectDetailAnswer>('get_project', {
      slug: confidential!.slug,
    });

    expect(answer).not.toHaveProperty('clientName');
    expect(JSON.stringify(answer)).not.toMatch(/clientName/);
  });
});
