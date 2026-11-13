import type { Post } from '../../content/schemas/post';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { casePath, postPath } from '../i18n/paths';
import type { Locale } from '../i18n/locale';
import { formatMachineRoute, MACHINE_ROUTES } from './llms-txt';
import { absoluteUrl } from './urls';

type LocalizedProject = Project & { locale?: Locale };
type LocalizedPost = Post & { locale?: Locale };
interface Input {
  site: URL;
  profile: Profile;
  projects: readonly LocalizedProject[];
  posts?: readonly LocalizedPost[];
}

const singleLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

const period = (startDate: string, endDate?: string): string => `${startDate} – ${endDate ?? 'present'}`;

const projectBySlug = (projects: readonly LocalizedProject[], slug: string): LocalizedProject | undefined =>
  projects.find(project => project.slug === slug);

const projectUrl = (site: URL, project: LocalizedProject): string =>
  absoluteUrl(site, casePath({ slug: project.slug, block: project.block, locale: project.locale ?? 'pt-BR' }));

const itemPostUrl = (site: URL, post: LocalizedPost): string =>
  absoluteUrl(site, postPath({ slug: post.slug, locale: post.locale ?? 'pt-BR' }));

const appendMachineRoutesAndLanguage = (lines: string[], site: URL): void => {
  lines.push('', '## Machine routes', '');

  for (const [route, description] of MACHINE_ROUTES) {
    lines.push(formatMachineRoute(site, route, description));
  }

  lines.push('', '## Language', '');
  lines.push('- Human-facing pages are written in Brazilian Portuguese.');
  lines.push('- Machine-facing routes are written in English.');
  lines.push('');
};

/** Full-content sibling of llms.txt: same convention, deeper sections. */
export const buildLlmsFullTxt = ({ site, profile, projects, posts = [] }: Input): string => {
  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${profile.headline}. ${profile.bio}`,
    '',
    '## About',
    '',
    profile.positioning,
    '',
    `- Availability: ${profile.availability.status}`,
    `- ${profile.availability.detail}`,
    `- Updated: ${profile.availability.updatedAt}`,
    `- Stack: ${profile.stack.join(', ')}`,
    '',
    '## Results',
    '',
  ];

  for (const item of profile.trajectory) {
    lines.push(`- ${item.value} ${item.label}: ${singleLine(item.context)}`);
  }

  lines.push('', '## Services', '');

  for (const service of profile.services) {
    const proof = projectBySlug(projects, service.caseSlug);
    const caseUrl = proof ? projectUrl(site, proof) : absoluteUrl(site, `/portfolio/${service.caseSlug}`);
    lines.push(`- **${service.title}**: ${singleLine(service.description)}`);
    lines.push(`  Proof: ${caseUrl}`);
  }

  lines.push('', '## Work history', '');

  for (const job of profile.work ?? []) {
    lines.push(`- **${job.position}** at ${job.name} (${period(job.startDate, job.endDate)})`);
    if (job.summary) lines.push(`  ${singleLine(job.summary)}`);
    for (const highlight of job.highlights ?? []) {
      lines.push(`  - ${singleLine(highlight)}`);
    }
  }

  lines.push('', '## Education', '');

  for (const entry of profile.education ?? []) {
    lines.push(
      `- ${entry.studyType}, ${entry.area} at ${entry.institution} (${period(entry.startDate, entry.endDate)})`,
    );
  }

  lines.push('', '## Projects', '');

  for (const project of projects) {
    const collection = collectionOfBlock(project.block);
    const statusBits: string[] = [];
    if (project.confidential) statusBits.push('confidential');
    if (project.discontinued) statusBits.push('discontinued');

    lines.push(`### ${project.title}`, '');
    lines.push(`- URL: ${projectUrl(site, project)}`);
    lines.push(`- collection: ${collection}`);
    lines.push(`- tech: ${project.tech.join(', ')}`);
    if (statusBits.length > 0) {
      lines.push(`- status: ${statusBits.join(', ')}`);
    }
    lines.push(`- ${project.summary}`);
    lines.push('');
    lines.push(`Problem: ${singleLine(project.problem)}`);
    lines.push(`Decisions: ${singleLine(project.decisions)}`);
    lines.push(`Outcome: ${singleLine(project.outcome)}`);

    if (project.repoUrl) lines.push(`- Repo: ${project.repoUrl}`);
    if (project.liveUrl) lines.push(`- Live: ${project.liveUrl}`);
    lines.push('');
  }

  if (posts.length > 0) {
    lines.push('## Posts', '');
    for (const post of posts) {
      lines.push(`- [${post.title}](${itemPostUrl(site, post)}): ${post.summary}`);
    }
  }

  appendMachineRoutesAndLanguage(lines, site);

  return lines.join('\n');
};
