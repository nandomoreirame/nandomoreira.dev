import { describe, expect, it } from 'vitest';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildLlmsTxt } from '../../src/lib/aeo/llms-txt';
import { absoluteUrl } from '../../src/lib/aeo/urls';
import { getMachinePosts, getMachineProjects, getProfile } from '../../src/lib/content';
import { casePath, postPath } from '../../src/lib/i18n/paths';

const site = new URL('https://nandomoreira.dev');

describe('machine routes in English', async () => {
  const [profile, projects, posts] = await Promise.all([getProfile('en'), getMachineProjects(), getMachinePosts()]);

  const enProjects = projects.filter(item => item.locale === 'en');
  const enPosts = posts.filter(item => item.locale === 'en');
  expect(enProjects.length).toBeGreaterThan(0);
  expect(enPosts.length).toBeGreaterThan(0);

  // Synthetic pt-BR-only case so the per-item fallback stays covered even when
  // every real case has an English overlay (REQ-014).
  const ptFallback = {
    ...projects[0]!,
    slug: 'pt-only-fallback-case',
    title: 'Caso só em português',
    summary: 'Resumo de fallback em português para rotas de máquina.',
    block: 'ai-tooling' as const,
    locale: 'pt-BR' as const,
  };
  const projectsWithFallback = [...projects, ptFallback];
  const ptFallbackUrl = absoluteUrl(
    site,
    casePath({ slug: ptFallback.slug, block: ptFallback.block, locale: 'pt-BR' }),
  );

  it('llms.txt links each translated case and post at its full /en URL', () => {
    const text = buildLlmsTxt({ site, profile, projects: projectsWithFallback, posts });

    for (const project of enProjects) {
      const url = absoluteUrl(site, casePath({ slug: project.slug, block: project.block, locale: 'en' }));
      expect(text, project.slug).toContain(url);
      expect(text, project.slug).toContain(project.summary);
    }
    for (const post of enPosts) {
      const url = absoluteUrl(site, postPath({ slug: post.slug, locale: 'en' }));
      expect(text, post.slug).toContain(url);
      expect(text, post.slug).toContain(post.summary);
    }
    expect(text).toContain(ptFallbackUrl);
    expect(text).toContain(ptFallback.summary);
    expect(text).toContain(profile.headline);
  });

  it('ai-index lists English URLs and summaries for translated cases and posts', () => {
    const index = buildAiIndex({ site, profile, projects: projectsWithFallback, posts });
    const cases = new Map(index.entries.filter(entry => entry.type === 'case').map(entry => [entry.url, entry]));
    const postEntries = new Map(index.entries.filter(entry => entry.type === 'post').map(entry => [entry.url, entry]));

    for (const project of enProjects) {
      const url = absoluteUrl(site, casePath({ slug: project.slug, block: project.block, locale: 'en' }));
      expect(cases.get(url)?.summary, project.slug).toBe(project.summary);
    }
    for (const post of enPosts) {
      const url = absoluteUrl(site, postPath({ slug: post.slug, locale: 'en' }));
      expect(postEntries.get(url)?.summary, post.slug).toBe(post.summary);
    }
    expect(cases.get(ptFallbackUrl)?.summary).toBe(ptFallback.summary);
  });

  it('ai-index points English cases at the English markdown view, with pt-BR fallback', () => {
    const index = buildAiIndex({ site, profile, projects: projectsWithFallback, posts });
    const cases = new Map(index.entries.filter(entry => entry.type === 'case').map(entry => [entry.url, entry]));

    for (const project of enProjects) {
      const url = absoluteUrl(site, casePath({ slug: project.slug, block: project.block, locale: 'en' }));
      const markdown = absoluteUrl(site, `${casePath({ slug: project.slug, block: project.block, locale: 'en' })}.md`);
      expect(cases.get(url)?.markdown, project.slug).toBe(markdown);
      expect(markdown, project.slug).toContain('/en/');
    }

    const ptMarkdown = absoluteUrl(
      site,
      `${casePath({ slug: ptFallback.slug, block: ptFallback.block, locale: 'pt-BR' })}.md`,
    );
    expect(cases.get(ptFallbackUrl)?.markdown).toBe(ptMarkdown);
    expect(ptMarkdown).not.toContain('/en/');
  });
});
