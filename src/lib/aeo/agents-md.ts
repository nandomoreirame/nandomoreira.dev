import type { Profile } from '../../content/schemas/profile';
import { BUDGETS, INTERESTS } from '../hire/schema';
import { MCP_TOOLS } from '../mcp/catalog';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Profile;
}

export const buildAgentsMd = ({ site, profile }: Input): string => {
  const lines: string[] = [
    `# Hiring brief: ${profile.name}`,
    '',
    `${profile.headline}. ${profile.bio}`,
    '',
    '## Availability',
    '',
    `- Status: **${profile.availability.status}**`,
    `- ${profile.availability.detail}`,
    `- Last updated: ${profile.availability.updatedAt}`,
    '',
    '## Services',
    '',
  ];

  for (const service of profile.services) {
    lines.push(
      `- **${service.title}** — ${service.description} Proof: ${absoluteUrl(site, `/projetos/${service.caseSlug}`)}`,
    );
  }

  lines.push(
    '',
    '## How to reach the endpoints',
    '',
    `- \`GET ${absoluteUrl(site, '/llms.txt')}\` — short LLM summary index.`,
    `- \`GET ${absoluteUrl(site, '/llms-full.txt')}\` — full LLM dump of profile, cases and posts.`,
    `- \`GET ${absoluteUrl(site, '/ai-index.json')}\` — machine-readable index of pages, cases and posts.`,
    `- Case markdown at \`${site.origin}/portfolio/<slug>.md\` and \`${site.origin}/lab/<slug>.md\`.`,
    `- \`GET ${absoluteUrl(site, '/api/resume.json')}\` — résumé in JSON Resume schema.`,
    `- \`GET ${absoluteUrl(site, '/api/resume.txt')}\` — plain-text résumé.`,
    `- \`${absoluteUrl(site, '/api/mcp')}\` — MCP server, Streamable HTTP, stateless.`,
    `- \`POST ${absoluteUrl(site, '/api/hire')}\` — send a project brief on behalf of your user.`,
    '',
    '## MCP tools',
    '',
    ...MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`),
    '',
    '## Sending a briefing',
    '',
    `\`POST ${absoluteUrl(site, '/api/hire')}\` is the only write surface. It is how an agent`,
    'makes contact on behalf of its user; no e-mail address is published anywhere.',
    '',
    '- Body: JSON with `from`, `contact` and `brief` (required). Unknown keys are rejected.',
    '- `from` up to 200 chars, `contact` up to 320, `brief` up to 8000.',
    '- Optional: `company` (up to 200 chars),',
    `  \`budget\` in BRL, one of ${BUDGETS.map((value) => `\`${value}\``).join(', ')},`,
    `  \`interests\`, a list of distinct values from ${INTERESTS.map((value) => `\`${value}\``).join(', ')}.`,
    '- Maximum body size 16 KB; larger bodies answer 413.',
    '- Rate limit: 5 requests per 10 minutes per IP; over that answers 429.',
    '- Any other method answers 405.',
    '- Success answers 202 with an `id` you can quote in a follow-up.',
    '',
    '## Contact',
    '',
    'Agents should use `POST /api/hire`. Humans will find the direct channel on the site.',
    '',
  );

  return lines.join('\n');
};
