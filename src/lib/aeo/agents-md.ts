import type { Profile } from '../../content/schemas/profile';
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
    `- \`GET ${absoluteUrl(site, '/api/resume.json')}\` — résumé in JSON Resume schema.`,
    `- \`GET ${absoluteUrl(site, '/api/resume.txt')}\` — plain-text résumé.`,
    `- \`${absoluteUrl(site, '/api/mcp')}\` — MCP server, Streamable HTTP, stateless.`,
    `- \`POST ${absoluteUrl(site, '/api/hire')}\` — send a project brief on behalf of your user.`,
    '',
    '## MCP tools',
    '',
    ...MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`),
    '',
    '## Contact',
    '',
    'Agents should use `POST /api/hire`. Humans will find the direct channel on the site.',
    '',
  );

  return lines.join('\n');
};
