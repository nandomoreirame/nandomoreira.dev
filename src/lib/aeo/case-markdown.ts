import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  project: Project;
}

/** Markdown mirror of a case page for agents that prefer plain text. */
export const buildCaseMarkdown = ({ site, project }: Input): string => {
  const collection = collectionOfBlock(project.block);
  const url = absoluteUrl(site, `/${collection}/${project.slug}`);

  const lines: string[] = [
    '---',
    `title: ${project.title}`,
    `url: ${url}`,
    `collection: ${collection}`,
    'tech:',
    ...project.tech.map((item) => `  - ${item}`),
    `date: ${project.date}`,
    '---',
    '',
    `# ${project.title}`,
    '',
    project.summary,
    '',
    '## Problema',
    '',
    project.problem.trim(),
    '',
    '## Decisões técnicas',
    '',
    project.decisions.trim(),
    '',
    '## Resultado',
    '',
    project.outcome.trim(),
    '',
  ];

  if (project.repoUrl || project.liveUrl) {
    lines.push('## Links', '');
    if (project.repoUrl) lines.push(`- Repo: ${project.repoUrl}`);
    if (project.liveUrl) lines.push(`- Live: ${project.liveUrl}`);
    lines.push('');
  }

  return lines.join('\n');
};
