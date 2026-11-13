import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CasePage from '../../src/components/pages/CasePage.astro';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects } from '../../src/lib/content';
import { clientPattern } from '../helpers/confidential-clients';

const BATCHES: string[] = [
  'bragstack',
  'croonos',
  'mousai',
  'portfoliosnap',
  'amnesia-claude-code',
  'forja',
  'forja-plugins',
  'terminal-noir',
  'abracce',
  'atelie-eh-pique',
  'camilla-saboia',
  'data-insights-platform',
  'encantos-brincantes',
  'financial-normalization',
  'seu-atelie-aqui',
  'sudadhara',
  'coachbot-cli',
  'flipclock-app',
  'flipclock-screensaver-ascii',
  'grab-sh',
  'hypr-switcher',
  'job-radar',
];

/** Professional-batch cases with confidential: true (REQ-017). */
const CONFIDENTIAL_BATCH = ['data-insights-platform', 'financial-normalization'] as const;

const clientNameFromDisk = (slug: string): string | undefined => {
  const source = readFileSync(join('src/content/projects', `${slug}.md`), 'utf8');
  const frontmatter = source.split(/^---$/m)[1] ?? '';
  expect(frontmatter).toMatch(/^confidential:\s*true\s*$/m);
  return frontmatter.match(/^clientName:\s*["']?(.+?)["']?\s*$/m)?.[1];
};

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

describe('confidential English case pages (REQ-017)', () => {
  it.each(CONFIDENTIAL_BATCH)(
    'English CasePage for %s never shows the source clientName',
    async (slug) => {
      const clientName = clientNameFromDisk(slug);
      const [ptProjects, enProjects] = await Promise.all([getAllProjects(), getAllProjects('en')]);
      const project = enProjects.find((entry) => entry.slug === slug);
      const pt = ptProjects.find((entry) => entry.slug === slug);
      expect(project).toBeDefined();
      expect(pt).toBeDefined();
      // Redaction replaces the name with a placeholder; English must match pt-BR.
      expect(project!.clientName).toBe(pt!.clientName);
      expect(project!.confidentialMetrics).toBeUndefined();

      const collection = collectionOfBlock(project!.block);
      const html = await (
        await AstroContainer.create()
      ).renderToString(CasePage, {
        props: { project, collection, locale: 'en' },
        request: new Request(`https://nandomoreira.dev/en/${collection}/${slug}`),
      });

      if (clientName) {
        expect(html).not.toMatch(clientPattern(clientName));
      }
    },
  );
});
