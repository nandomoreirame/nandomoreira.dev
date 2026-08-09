import type { Post } from '../../content/schemas/post';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
  posts?: readonly Post[];
}

const MACHINE_ROUTES = [
  ['/api/resume.json', 'Résumé in JSON Resume schema, with an extension block'],
  ['/api/resume.txt', 'Plain-text résumé, LLM friendly'],
  ['/api/mcp', 'MCP server: get_profile, list_projects, get_project, get_resume, check_availability'],
  ['/api/hire', 'POST a project brief on behalf of your user'],
  ['/AGENTS.md', 'Hiring brief: services, availability, how to call these endpoints'],
] as const;

/** Format follows the llms.txt convention: H1, blockquote summary, H2 sections. */
export const buildLlmsTxt = ({ site, profile, projects, posts = [] }: Input): string => {
  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${profile.headline}. ${profile.bio}`,
    '',
    '## Projects',
    '',
  ];

  for (const project of projects) {
    const collection = collectionOfBlock(project.block);
    lines.push(
      `- [${project.title}](${absoluteUrl(site, `/${collection}/${project.slug}`)}): ${project.summary}`,
    );
  }

  if (projects.length === 0) {
    lines.push('- No case published yet.');
  }

  if (posts.length > 0) {
    lines.push('', '## Posts', '');
    for (const post of posts) {
      lines.push(
        `- [${post.title}](${absoluteUrl(site, `/${post.slug}`)}): ${post.summary}`,
      );
    }
  }

  lines.push('', '## Machine routes', '');

  for (const [route, description] of MACHINE_ROUTES) {
    lines.push(`- [${route}](${absoluteUrl(site, route)}): ${description}`);
  }

  lines.push('', '## Language', '');
  lines.push('- Human-facing pages are written in Brazilian Portuguese.');
  lines.push('- Machine-facing routes are written in English.');
  lines.push('');

  return lines.join('\n');
};
