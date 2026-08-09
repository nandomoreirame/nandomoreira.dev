import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { jsonLdForProject } from '../../src/lib/catalog/json-ld';

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Cliente GUI multi-CLI para agentes de código',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust', 'Tauri'],
    repoUrl: 'https://github.com/x/forja',
    liveUrl: null,
    featured: true,
    confidential: false,
    ...overrides,
  }) as Project;

const SITE = 'https://nandomoreira.dev';

describe('jsonLdForProject', () => {
  it('uses SoftwareApplication when the project has a deployed version', () => {
    const ld = jsonLdForProject(project({ liveUrl: 'https://bragstack.app' }), SITE);
    expect(ld['@type']).toBe('SoftwareApplication');
  });

  it('uses CreativeWork when there is no deployed version', () => {
    expect(jsonLdForProject(project(), SITE)['@type']).toBe('CreativeWork');
  });

  it('always declares the schema.org context', () => {
    expect(jsonLdForProject(project(), SITE)['@context']).toBe('https://schema.org');
  });

  it('points the canonical url at the case page, not at the repository', () => {
    expect(jsonLdForProject(project(), SITE).url).toBe(`${SITE}/projetos/forja`);
  });

  it('omits codeRepository when the repository is private', () => {
    const ld = jsonLdForProject(project({ repoUrl: null, liveUrl: 'https://y.app' }), SITE);
    expect(ld).not.toHaveProperty('codeRepository');
  });

  it('serialises to valid JSON, since it is embedded in a script tag', () => {
    const serialised = JSON.stringify(jsonLdForProject(project(), SITE));
    expect(() => JSON.parse(serialised)).not.toThrow();
  });

  it('escapes a closing script tag in the content, which would break out of the tag', () => {
    const ld = jsonLdForProject(project({ summary: 'quebra </script> aqui' }), SITE);
    const serialised = JSON.stringify(ld).replaceAll('<', '\\u003c');

    expect(serialised).not.toContain('</script>');
  });
});
