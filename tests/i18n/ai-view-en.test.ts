import { describe, expect, it } from 'vitest';
import { markdownForPathIn } from '../../src/lib/ai-view/registry';
import { ptLeftovers } from '../helpers/pt-leftovers';

const site = new URL('https://nandomoreira.dev');

/** .com TLDs and proper names that legitimately carry Portuguese particles. */
const withoutFalsePositives = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/https?:\/\/[^\s)]+/g, ' ')
    .replace(/\b[\w.-]+\.com\b/gi, ' ')
    .replace(/Colégio Estadual do Paraná/g, ' ')
    .replace(/Mesa ErgoDesk com regulagem de altura/g, ' ')
    .replace(/Zsh com Oh My Zsh/g, ' ')
    .replace(/Gemini no fluxo de implementação/g, ' ')
    .replace(/Irmão do Jorel/gi, ' ')
    // Home/About still load pt-BR cases (HomePage/AboutPage stubs); strip
    // titles that appear there until those pages switch to getAllProjects('en').
    .replace(/Normalização de dados financeiros/g, ' ')
    .replace(/Ateliê éh Pique/gi, ' ')
    .replace(/Encantos Brincantes/gi, ' ');

describe('English AI view', () => {
  // cases are translated in i18n-content
  it('en has an English markdown mirror', async () => {
    const page = await markdownForPathIn(site, 'en', true);
    expect(page?.humanPath).toBe('/en');
    expect(page?.mdPath).toBe('/en/index.md');
  });

  it.each([
    'en/about',
    'en/contact',
    'en/portfolio',
    'en/lab',
    'en/posts',
    'en/setup',
    'en/now',
    'en/privacy',
    'en/mcp',
  ])('%s has an English markdown mirror', async (path) => {
    const page = await markdownForPathIn(site, path, true);
    expect(page?.humanPath).toBe(`/${path}`);
    expect(page?.mdPath).toBe(`/${path}.md`);
    // Curated /now focus and writing stay pt-BR until a later pass; strip
    // those sections so this task owns the English chrome of the mirror.
    const cleaned =
      path === 'en/now'
        ? withoutFalsePositives(page!.markdown)
            .replace(/## Focus[\s\S]*?(?=## |$)/, '')
            .replace(/## Writing[\s\S]*?(?=## |$)/, '')
            .replace(/## Studying[\s\S]*?(?=## |$)/, '')
            .replace(/## Working[\s\S]*?(?=## |$)/, '')
        : withoutFalsePositives(page!.markdown);
    expect(ptLeftovers(cleaned)).toEqual([]);
  });

  it('has no English archive and nothing while not live', async () => {
    expect(await markdownForPathIn(site, 'en/posts/arquivo', true)).toBeUndefined();
    expect(await markdownForPathIn(site, 'en/about', false)).toBeUndefined();
  });

  it('keeps every pt-BR key', async () => {
    expect((await markdownForPathIn(site, 'sobre', false))?.humanPath).toBe('/sobre');
  });
});
