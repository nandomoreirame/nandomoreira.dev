import type { Project } from '../../../content/schemas/project';
import { type CatalogCollection, collectionOfBlock } from '../../catalog/groups';
import type { Localized } from '../../content/projects';
import { casePath } from '../../i18n/paths';

export interface ProjectSummaryAnswer {
  slug: string;
  title: string;
  summary: string;
  collection: CatalogCollection;
  block: Project['block'];
  tech: string[];
  /** Absent rather than invented: a case without a link has none to give. */
  repoUrl?: string;
  liveUrl?: string;
  /** Public path of the case in the language of its text (REQ-015). */
  url: string;
  discontinued: boolean;
  confidential: boolean;
  date: string;
}

export interface ProjectDetailAnswer extends ProjectSummaryAnswer {
  problem: string;
  decisions: string;
  outcome: string;
}

/**
 * Both answers are built from the already-redacted project the access layer
 * hands over. Nothing here reaches for `clientName` or `confidentialMetrics`,
 * so a confidential case cannot name its client through a tool (REQ-008).
 */
const toSummary = (project: Localized<Project>): ProjectSummaryAnswer => ({
  slug: project.slug,
  title: project.title,
  summary: project.summary,
  collection: collectionOfBlock(project.block),
  block: project.block,
  tech: [...project.tech],
  ...(project.repoUrl ? { repoUrl: project.repoUrl } : {}),
  ...(project.liveUrl ? { liveUrl: project.liveUrl } : {}),
  url: casePath({ slug: project.slug, block: project.block, locale: project.locale }),
  discontinued: project.discontinued,
  confidential: project.confidential,
  date: project.date,
});

export const toProjectSummaries = (
  projects: readonly Localized<Project>[],
  collection?: CatalogCollection,
): ProjectSummaryAnswer[] =>
  projects.filter(project => !collection || collectionOfBlock(project.block) === collection).map(toSummary);

export const toProjectDetail = (project: Localized<Project>): ProjectDetailAnswer => ({
  ...toSummary(project),
  problem: project.problem,
  decisions: project.decisions,
  outcome: project.outcome,
});
