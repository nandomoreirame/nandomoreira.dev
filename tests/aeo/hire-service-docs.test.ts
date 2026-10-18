import { describe, expect, it } from 'vitest';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';
import { buildHireBrief } from '../../src/lib/aeo/hire-brief';
import { SERVICES } from '../../src/lib/hire/schema';

const site = new URL('https://nandomoreira.dev');
const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling.',
  positioning: 'AI, agents and AI coding tooling',
  stack: ['TypeScript'],
  trajectory: [{ value: '964', label: 'stars', context: 'mostly Jekyll themes' }],
  services: [{ title: 'Agent tooling', description: 'd', caseSlug: 'forja' }],
  availability: { status: 'open', detail: 'Open.', updatedAt: '2026-10-18' },
  contacts: [{ kind: 'github', value: 'https://github.com/nandomoreirame' }],
} as never;

describe('service in the agent contract', () => {
  it('lists every service value in the hire brief', () => {
    const brief = buildHireBrief({ site, profile });
    for (const service of SERVICES) expect(brief, service).toContain(service);
  });

  it('documents service in AGENTS.md', () => {
    const markdown = buildAgentsMd({ site, profile });
    expect(markdown).toContain('`service`');
    for (const service of SERVICES) expect(markdown, service).toContain(`\`${service}\``);
  });
});
