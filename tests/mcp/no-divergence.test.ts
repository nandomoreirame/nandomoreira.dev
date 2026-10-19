import { describe, expect, it } from 'vitest';
import { buildResume } from '../../src/lib/aeo/resume';
import { getAllProjects, getProfile } from '../../src/lib/content';
import type { ProjectSummaryAnswer } from '../../src/lib/mcp/tools/projects';
import { callTool } from './client';

/**
 * REQ-003 is the requirement that makes MCP worth serving: a tool that answers
 * something the site does not say is worse than no tool at all, because the
 * agent repeats it with confidence.
 *
 * This runs against the REAL archive, not a fixture, so it fails when the
 * content drifts away from what the tools report — which a fixture-based test
 * by construction cannot notice.
 */
describe('no tool diverges from what the site publishes', () => {
  it('get_profile matches the access layer field by field', async () => {
    const profile = await getProfile();
    const answer = await callTool<Record<string, unknown>>('get_profile');

    expect(answer).toMatchObject({
      name: profile.name,
      headline: profile.headline,
      bio: profile.bio,
      positioning: profile.positioning,
      stack: profile.stack,
    });
  });

  it('check_availability matches the access layer', async () => {
    const { availability } = await getProfile();

    expect(await callTool('check_availability')).toEqual({
      status: availability.status,
      detail: availability.detail,
      updatedAt: availability.updatedAt,
    });
  });

  it('list_projects reports every case the catalog has, and no other', async () => {
    const projects = await getAllProjects();
    const answer = await callTool<{ projects: ProjectSummaryAnswer[] }>('list_projects');

    expect(answer.projects.map(project => project.slug).sort()).toEqual(projects.map(project => project.slug).sort());
  });

  it('list_projects repeats the catalog title and summary verbatim', async () => {
    const projects = await getAllProjects();
    const answer = await callTool<{ projects: ProjectSummaryAnswer[] }>('list_projects');
    const bySlug = new Map(answer.projects.map(project => [project.slug, project]));

    for (const project of projects) {
      expect(bySlug.get(project.slug)?.title, project.slug).toBe(project.title);
      expect(bySlug.get(project.slug)?.summary, project.slug).toBe(project.summary);
    }
  });

  it('get_project matches the catalog for every published slug', async () => {
    const projects = await getAllProjects();

    for (const project of projects) {
      const answer = await callTool<{ outcome: string }>('get_project', {
        slug: project.slug,
      });

      expect(answer.outcome, project.slug).toBe(project.outcome);
    }
  });

  it('get_resume matches what the resume route serves', async () => {
    const expected = buildResume({
      site: new URL('https://nandomoreira.dev'),
      profile: await getProfile(),
      projects: await getAllProjects(),
    });

    expect(await callTool('get_resume')).toEqual(expected);
  });
});
