import { getCollection } from 'astro:content';
import { BLOCKS, type Block } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';
import { redactConfidential } from './confidential';
import { assertUniqueSlugs } from './validate';

export interface BlockGroup {
  block: Block;
  projects: Project[];
}

export const sortProjects = (projects: readonly Project[]): Project[] =>
  [...projects].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

export const featured = (projects: readonly Project[]): Project[] =>
  sortProjects(projects.filter((project) => project.featured));

/** Every block is present even when empty, so a missing block is visible. */
export const groupByBlock = (projects: readonly Project[]): BlockGroup[] =>
  BLOCKS.map((block) => ({
    block,
    projects: sortProjects(projects.filter((project) => project.block === block)),
  }));

const load = async (): Promise<Project[]> => {
  const entries = await getCollection('projects');
  const projects = entries.map((entry) => entry.data);

  assertUniqueSlugs(projects);

  return projects.map(redactConfidential);
};

export const getAllProjects = async (): Promise<Project[]> => sortProjects(await load());

export const getFeaturedProjects = async (): Promise<Project[]> => featured(await load());

export const getProjectsByBlock = async (): Promise<BlockGroup[]> =>
  groupByBlock(await load());

export const getProject = async (slug: string): Promise<Project | undefined> =>
  (await load()).find((project) => project.slug === slug);
