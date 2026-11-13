import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import type { Locale } from '../i18n/locale';
import { casePath } from '../i18n/paths';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  project: Project & { locale?: Locale };
  locale?: Locale;
}

const LABELS = {
  'pt-BR': {
    problem: 'Problema',
    decisions: 'Decisões técnicas',
    outcome: 'Resultado',
    shortcuts: 'Atalhos',
    links: 'Links',
  },
  en: {
    problem: 'Problem',
    decisions: 'Decisions',
    outcome: 'Outcome',
    shortcuts: 'Shortcuts',
    links: 'Links',
  },
} as const;

/** Markdown mirror of a case page for agents that prefer plain text. */
export const buildCaseMarkdown = ({ site, project, locale }: Input): string => {
  const resolvedLocale = locale ?? project.locale ?? 'pt-BR';
  const labels = LABELS[resolvedLocale];
  const collection = collectionOfBlock(project.block);
  const url = absoluteUrl(
    site,
    casePath({ slug: project.slug, block: project.block, locale: resolvedLocale }),
  );

  const lines: string[] = [
    '---',
    `title: ${project.title}`,
    `url: ${url}`,
    `collection: ${collection}`,
    'tech:',
    ...project.tech.map(item => `  - ${item}`),
    `date: ${project.date}`,
    '---',
    '',
    `# ${project.title}`,
    '',
    project.summary,
    '',
    `## ${labels.problem}`,
    '',
    project.problem.trim(),
    '',
    `## ${labels.decisions}`,
    '',
    project.decisions.trim(),
    '',
    `## ${labels.outcome}`,
    '',
    project.outcome.trim(),
    '',
  ];

  if (project.shortcuts && project.shortcuts.length > 0) {
    lines.push(`## ${labels.shortcuts}`, '');
    for (const { keys, action } of project.shortcuts) lines.push(`- \`${keys}\`: ${action}`);
    lines.push('');
  }

  if (project.repoUrl || project.liveUrl) {
    lines.push(`## ${labels.links}`, '');
    if (project.repoUrl) lines.push(`- Repo: ${project.repoUrl}`);
    if (project.liveUrl) lines.push(`- Live: ${project.liveUrl}`);
    lines.push('');
  }

  return lines.join('\n');
};
