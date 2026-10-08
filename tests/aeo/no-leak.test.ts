import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildCaseMarkdown } from '../../src/lib/aeo/case-markdown';
import { buildLlmsFullTxt } from '../../src/lib/aeo/llms-full-txt';
import { buildLlmsTxt } from '../../src/lib/aeo/llms-txt';
import { buildResume } from '../../src/lib/aeo/resume';
import { renderResumeText } from '../../src/lib/aeo/resume-txt';
import { buildRobotsTxt } from '../../src/lib/aeo/robots';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { clientPattern, confidentialClientNames } from '../helpers/confidential-clients';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling.',
  positioning: 'AI, agents and AI coding tooling',
  stack: ['TypeScript', 'Rust'],
  trajectory: [{ value: '964', label: 'stars', context: 'mostly Jekyll themes' }],
  services: [{ title: 'Agent tooling', description: 'd', caseSlug: 'forja' }],
  availability: { status: 'open', detail: 'Open.', updatedAt: '2026-08-08' },
  contacts: [
    { kind: 'email', value: 'oi@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
  ],
} as never;

const projects = [
  {
    slug: 'forja',
    title: 'Forja',
    summary: 'Multi-CLI GUI client',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    block: 'ai-tooling',
    tech: ['Rust'],
    date: '2026-05-01',
    repoUrl: 'https://github.com/nandomoreirame/forja',
    featured: false,
    confidential: false,
    discontinued: false,
    updatedAt: '2026-08-01',
  },
] satisfies Project[];

const resume = () => buildResume({ site, profile, projects });

const outputs = () => [
  buildLlmsTxt({ site, profile, projects }),
  buildLlmsFullTxt({ site, profile, projects }),
  JSON.stringify(buildAiIndex({ site, profile, projects })),
  buildCaseMarkdown({ site, project: projects[0] }),
  buildAgentsMd({ site, profile }),
  buildRobotsTxt({ site }),
  buildSitemap({ site, projects }),
  JSON.stringify(resume()),
  renderResumeText(resume()),
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
    expect('oi@nandomoreira.dev').toMatch(FORBIDDEN[0][1]);
  });
});

/**
 * The MCP route answers JSON-RPC, not running text, so scanning the route
 * source proves nothing. The gate has to call each tool for real and scan the
 * body that comes back (REQ-004, REQ-009 of the mcp-server spec).
 */
describe('the MCP tools leak nothing', () => {
  const TOOLS = [
    ['get_profile', {}],
    ['check_availability', {}],
    ['list_projects', {}],
    ['get_resume', {}],
    ['get_project', { slug: 'nao-existe' }],
  ] as const;

  const bodies = async (): Promise<string[]> => {
    const { callToolRaw } = await import('../mcp/client');

    return Promise.all(
      TOOLS.map(async ([name, args]) =>
        JSON.stringify(await callToolRaw(name, args as Record<string, unknown>)),
      ),
    );
  };

  it.each(FORBIDDEN)('never exposes an %s', async (_label, pattern) => {
    for (const body of await bodies()) {
      expect(body).not.toMatch(pattern);
    }
  });

  // The employer is public; the clients behind a confidential case are not.
  // Names come from the source, so the gate follows the content.
  it.each(confidentialClientNames())('never names the confidential client %s', async (client) => {
    for (const body of await bodies()) {
      expect(body).not.toMatch(clientPattern(client));
    }
  });
});
