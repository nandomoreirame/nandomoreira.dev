import type { Project } from '../../../content/schemas/project';
import { type CatalogCollection, collectionOfBlock } from '../../catalog/groups';

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
const toSummary = (project: Project): ProjectSummaryAnswer => ({
  slug: project.slug,
  title: project.title,
  summary: project.summary,
  collection: collectionOfBlock(project.block),
  block: project.block,
  tech: [...project.tech],
  ...(project.repoUrl ? { repoUrl: project.repoUrl } : {}),
  ...(project.liveUrl ? { liveUrl: project.liveUrl } : {}),
  discontinued: project.discontinued,
  confidential: project.confidential,
  date: project.date,
});

export const toProjectSummaries = (
  projects: readonly Project[],
  collection?: CatalogCollection,
): ProjectSummaryAnswer[] =>
  projects
    .filter((project) => !collection || collectionOfBlock(project.block) === collection)
    .map(toSummary);

export const toProjectDetail = (project: Project): ProjectDetailAnswer => ({
  ...toSummary(project),
  problem: project.problem,
  decisions: project.decisions,
  outcome: project.outcome,
});
