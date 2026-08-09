import { describe, expect, it } from 'vitest';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';
import { buildLlmsTxt } from '../../src/lib/aeo/llms-txt';
import { buildRobotsTxt } from '../../src/lib/aeo/robots';
import { buildSitemap } from '../../src/lib/aeo/sitemap';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling.',
  services: [{ title: 'Agent tooling', description: 'd', caseSlug: 'forja' }],
  availability: { status: 'open', detail: 'Open.', updatedAt: '2026-08-08' },
  contacts: [
    { kind: 'email', value: 'fernando@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
  ],
} as never;

const projects = [
  { slug: 'forja', title: 'Forja', summary: 'Multi-CLI GUI client', updatedAt: '2026-08-01' },
] as never[];

const outputs = () => [
  buildLlmsTxt({ site, profile, projects }),
  buildAgentsMd({ site, profile }),
  buildRobotsTxt({ site }),
  buildSitemap({ site, projects }),
];

const FORBIDDEN: Array<[string, RegExp]> = [
  ['email address', /[\w.+-]+@[\w-]+\.[\w.]+/],
  ['absolute filesystem path', /\/(home|Users|var|etc)\//],
  ['api key or token', /(api[_-]?key|secret|token|bearer)\s*[:=]/i],
  ['firebase project id', /nandomoreira-dev/],
  ['private ip', /\b(10|127|192\.168)\.\d+\.\d+\.\d+\b/],
];

describe('machine routes leak nothing', () => {
  it.each(FORBIDDEN)('never exposes an %s', (_label, pattern) => {
    for (const output of outputs()) {
      expect(output).not.toMatch(pattern);
    }
  });

  it('proves the gate can fail', () => {
    expect('fernando@nandomoreira.dev').toMatch(FORBIDDEN[0][1]);
  });
});
