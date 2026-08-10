import { describe, expect, it } from 'vitest';
import { buildResume } from '../../src/lib/aeo/resume';
import { getAllProjects, getProfile } from '../../src/lib/content';
import { callTool } from './client';

describe('get_resume', () => {
  it('returns exactly what /api/resume.json serves', async () => {
    const viaTool = await callTool('get_resume');
    const viaRoute = buildResume({
      site: new URL('https://nandomoreira.dev'),
      profile: await getProfile(),
      projects: await getAllProjects(),
    });

    // Two implementations of the resume would diverge on the first change.
    expect(viaTool).toEqual(viaRoute);
  });

  it('carries the extension block, so an agent gets availability in one call', async () => {
    const resume = await callTool<{ x_agent: { availability: { updatedAt: string } } }>(
      'get_resume',
    );

    expect(resume.x_agent.availability.updatedAt).toBeTruthy();
  });

  it('never carries an e-mail', async () => {
    expect(JSON.stringify(await callTool('get_resume'))).not.toMatch(
      /[\w.+-]+@[\w-]+\.[\w.]+/,
    );
  });
});
