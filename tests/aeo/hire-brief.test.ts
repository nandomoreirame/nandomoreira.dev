import { describe, expect, it } from 'vitest';
import { buildHireBrief } from '../../src/lib/aeo/hire-brief';

const site = new URL('https://nandomoreira.dev');
const profile = {
  name: 'Fernando Moreira Costa',
  stack: ['TypeScript', 'Python'],
  availability: { status: 'open', detail: 'Aberto a projetos.', updatedAt: '2026-10-07' },
  contacts: [{ kind: 'email', value: 'oi@nandomoreira.dev' }],
} as never;

const brief = () => buildHireBrief({ site, profile });

describe('buildHireBrief', () => {
  it('opens as an AGENTS.md brief naming the person', () => {
    expect(brief()).toMatch(/^# AGENTS\.md: hire Fernando Moreira Costa/);
  });

  it('gives the exact request to send, with a JSON body that parses', () => {
    const text = brief();
    expect(text).toContain('POST https://nandomoreira.dev/api/hire');
    expect(text).toContain('Content-Type: application/json');
    const body = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    expect(Object.keys(JSON.parse(body))).toEqual([
      'from',
      'contact',
      'brief',
      'company',
      'budget',
      'interests',
      'service',
    ]);
  });

  it('points at the full AGENTS.md and the MCP server', () => {
    expect(brief()).toContain('https://nandomoreira.dev/AGENTS.md');
    expect(brief()).toContain('https://nandomoreira.dev/api/mcp');
  });

  it('states availability and stack from the profile', () => {
    expect(brief()).toContain('open');
    expect(brief()).toContain('TypeScript, Python');
  });

  it('never prints the e-mail and stays in English', () => {
    expect(brief()).not.toContain('@nandomoreira.dev');
    expect(brief()).not.toMatch(/Aberto|Disponível/);
  });
});
