import { describe, expect, it } from 'vitest';
import { listTools } from './client';

const EXPECTED = [
  'check_availability',
  'get_profile',
  'get_project',
  'get_resume',
  'list_projects',
];

describe('the advertised tool list', () => {
  it('exposes exactly the five tools the PRD names', async () => {
    const names = (await listTools()).tools.map((tool) => tool.name).sort();

    expect(names).toEqual(EXPECTED);
  });

  it('describes each tool well enough to be used without external docs', async () => {
    for (const tool of (await listTools()).tools) {
      expect(tool.description ?? '', tool.name).not.toHaveLength(0);
      expect((tool.description ?? '').length, tool.name).toBeGreaterThan(40);
    }
  });

  it('declares an input schema for every tool that takes an argument', async () => {
    const byName = new Map((await listTools()).tools.map((tool) => [tool.name, tool]));

    expect(byName.get('get_project')?.inputSchema.properties).toHaveProperty('slug');
    expect(byName.get('list_projects')?.inputSchema.properties).toHaveProperty('collection');
  });

  it('offers no write tool: the only write surface is /api/hire', async () => {
    const names = (await listTools()).tools.map((tool) => tool.name);

    expect(names.every((name) => /^(get|list|check)_/.test(name))).toBe(true);
  });

  it('stays in English, like every other machine surface', async () => {
    for (const tool of (await listTools()).tools) {
      expect(tool.description ?? '', tool.name).not.toMatch(
        /disponibilidade|projetos|currículo/i,
      );
    }
  });
});
