import type { Post } from '../../content/schemas/post';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { casePath, postPath } from '../i18n/paths';
import type { Locale } from '../i18n/locale';
import { absoluteUrl } from './urls';

type LocalizedProject = Project & { locale?: Locale };
type LocalizedPost = Post & { locale?: Locale };
interface Input {
  site: URL;
  profile: Profile;
  projects: readonly LocalizedProject[];
  posts?: readonly LocalizedPost[];
}

export const MACHINE_ROUTES = [
  ['/llms-full.txt', 'Full LLM-oriented dump of profile, cases and posts'],
  ['/ai-index.json', 'Machine-readable index of pages, cases and posts'],
  ['/portfolio/<slug>.md', 'Markdown mirror of a portfolio case'],
  ['/lab/<slug>.md', 'Markdown mirror of a lab case'],
  ['/api/resume.json', 'Résumé in JSON Resume schema, with an extension block'],
  ['/api/resume.txt', 'Plain-text résumé, LLM friendly'],
  ['/api/mcp', 'MCP server: get_profile, list_projects, get_project, get_resume, check_availability'],
  ['/api/hire', 'POST a project brief on behalf of your user'],
  ['/AGENTS.md', 'Hiring brief: services, availability, how to call these endpoints'],
] as const;

/** Pattern routes keep `<slug>` literal; encoding them would hide the template. */
export const formatMachineRoute = (site: URL, route: string, description: string): string => {
  if (route.includes('<')) {
    return `- \`${route}\`: ${description}`;
  }

  return `- [${route}](${absoluteUrl(site, route)}): ${description}`;
};

const projectUrl = (site: URL, project: LocalizedProject): string =>
  absoluteUrl(site, casePath({ slug: project.slug, block: project.block, locale: project.locale ?? 'pt-BR' }));

const itemPostUrl = (site: URL, post: LocalizedPost): string =>
  absoluteUrl(site, postPath({ slug: post.slug, locale: post.locale ?? 'pt-BR' }));

/** Format follows the llms.txt convention: H1, blockquote summary, H2 sections. */
export const buildLlmsTxt = ({ site, profile, projects, posts = [] }: Input): string => {
  const lines: string[] = [`# ${profile.name}`, '', `> ${profile.headline}. ${profile.bio}`, '', '## Projects', ''];

  for (const project of projects) {
    lines.push(`- [${project.title}](${projectUrl(site, project)}): ${project.summary}`);
  }

  if (projects.length === 0) {
    lines.push('- No case published yet.');
  }

  if (posts.length > 0) {
    lines.push('', '## Posts', '');
    for (const post of posts) {
      lines.push(`- [${post.title}](${itemPostUrl(site, post)}): ${post.summary}`);
    }
  }

  lines.push('', '## Machine routes', '');

  for (const [route, description] of MACHINE_ROUTES) {
    lines.push(formatMachineRoute(site, route, description));
  }

  lines.push('', '## Language', '');
  lines.push('- Human-facing pages are written in Brazilian Portuguese.');
  lines.push('- Machine-facing routes are written in English.');
  lines.push('');

  return lines.join('\n');
};
