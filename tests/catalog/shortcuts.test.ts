import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';
import type { Project } from '../../src/content/schemas/project';
import { projectSchema } from '../../src/content/schemas/project';
import { buildCaseMarkdown } from '../../src/lib/aeo/case-markdown';

const project = {
  slug: 'noctalia-gistbar',
  title: 'Gistbar',
  block: 'systems-cli',
  summary: 'Gists na barra',
  problem: 'O PROBLEMA',
  decisions: 'AS DECISOES',
  outcome: 'O RESULTADO',
  tech: ['QML'],
  repoUrl: 'https://github.com/nandomoreirame/noctalia-gistbar',
  liveUrl: null,
  featured: false,
  confidential: false,
  discontinued: false,
  date: '2026-10-10',
} satisfies Project;

const shortcuts = [
  { keys: 'Mod+G', action: 'abre a busca' },
  { keys: 'Shift+Enter', action: 'copia o link' },
];

const render = async (overrides: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, { props: { project: { ...project, ...overrides } } });
};

describe('case shortcuts', () => {
  it('accepts a list of key combos with their action, and rejects an empty combo', () => {
    expect(projectSchema.safeParse({ ...project, shortcuts }).success).toBe(true);
    expect(projectSchema.safeParse({ ...project, shortcuts: [{ keys: '', action: 'x' }] }).success).toBe(false);
    expect(projectSchema.safeParse({ ...project, shortcuts: [{ keys: 'Mod+G', action: '' }] }).success).toBe(false);
  });

  it('renders a shortcuts section after the outcome, one kbd per key', async () => {
    const html = await render({ shortcuts });

    expect(html).toContain('>Atalhos</h2>');
    expect(html.indexOf('O RESULTADO')).toBeLessThan(html.indexOf('>Atalhos</h2>'));
    expect(html).toMatch(/<kbd[^>]*>Mod<\/kbd>\s*\+\s*<kbd[^>]*>G<\/kbd>/);
    expect(html).toMatch(/<kbd[^>]*>Shift<\/kbd>\s*\+\s*<kbd[^>]*>Enter<\/kbd>/);
    expect(html).toContain('copia o link');
  });

  it('omits the section when the case declares no shortcut', async () => {
    expect(await render()).not.toContain('Atalhos');
  });

  it('lists the shortcuts in the case markdown', () => {
    const text = buildCaseMarkdown({ site: new URL('https://nandomoreira.dev'), project: { ...project, shortcuts } });

    expect(text).toContain('## Atalhos\n\n- `Mod+G`: abre a busca\n- `Shift+Enter`: copia o link\n');
    expect(text.indexOf('## Resultado')).toBeLessThan(text.indexOf('## Atalhos'));
  });

  it.each(['noctalia-daybar', 'noctalia-desktop-sticky-notes', 'noctalia-gistbar'])(
    '%s declares its keyboard shortcuts',
    slug => {
      expect(readFileSync(`src/content/projects/${slug}.md`, 'utf8')).toMatch(/^shortcuts:\n {2}- keys: /m);
    },
  );
});
