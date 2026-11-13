import { describe, expect, it } from 'vitest';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildLlmsTxt } from '../../src/lib/aeo/llms-txt';
import { getMachinePosts, getMachineProjects, getProfile } from '../../src/lib/content';

const site = new URL('https://nandomoreira.dev');

describe('machine routes in English', async () => {
  const [profile, projects, posts] = await Promise.all([getProfile('en'), getMachineProjects(), getMachinePosts()]);

  it('llms.txt links each translated item at its /en URL', () => {
    const text = buildLlmsTxt({ site, profile, projects, posts });
    for (const project of projects.filter(item => item.locale === 'en')) {
      expect(text).toContain(`https://nandomoreira.dev/en/`);
      expect(text).toContain(project.summary.slice(0, 40));
    }
    expect(text).toContain(profile.headline);
  });

  it('ai-index lists English URLs for translated items', () => {
    const index = JSON.stringify(buildAiIndex({ site, profile, projects, posts }));
    for (const post of posts.filter(item => item.locale === 'en')) {
      expect(index).toContain(`https://nandomoreira.dev/en/${post.slug}`);
    }
  });
});
