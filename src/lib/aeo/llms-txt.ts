import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
}

const MACHINE_ROUTES = [
  ['/api/resume.json', 'Résumé in JSON Resume schema, with an extension block'],
  ['/api/resume.txt', 'Plain-text résumé, LLM friendly'],
  ['/api/mcp', 'MCP server: get_profile, list_projects, get_project, get_resume, check_availability'],
  ['/api/hire', 'POST a project brief on behalf of your user'],
  ['/AGENTS.md', 'Hiring brief: services, availability, how to call these endpoints'],
] as const;

/** Format follows the llms.txt convention: H1, blockquote summary, H2 sections. */
export const buildLlmsTxt = ({ site, profile, projects }: Input): string => {
  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${profile.headline}. ${profile.bio}`,
    '',
    '## Projects',
    '',
  ];

  for (const project of projects) {
    lines.push(
      `- [${project.title}](${absoluteUrl(site, `/projetos/${project.slug}`)}): ${project.summary}`,
    );
  }

  if (projects.length === 0) {
    lines.push('- No case published yet.');
  }

  lines.push('', '## Machine routes', '');

  for (const [route, description] of MACHINE_ROUTES) {
    lines.push(`- [${route}](${absoluteUrl(site, route)}): ${description}`);
  }

  lines.push('', '## Notes', '');
  lines.push('- Human-facing pages are written in Brazilian Portuguese.');
  lines.push('- Machine-facing routes are written in English.');
  lines.push('');

  return lines.join('\n');
};
