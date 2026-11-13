import { getCollection } from 'astro:content';
import { BLOCKS, type Block } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';
import type { Locale } from '../i18n/locale';
import { redactConfidential } from './confidential';
import { assertUniqueSlugs } from './validate';

export interface BlockGroup {
  block: Block;
  projects: Project[];
}

export const sortProjects = (projects: readonly Project[]): Project[] =>
  [...projects].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

export const featured = (projects: readonly Project[]): Project[] =>
  sortProjects(projects.filter(project => project.featured));

/** Every block is present even when empty, so a missing block is visible. */
export const groupByBlock = (projects: readonly Project[]): BlockGroup[] =>
  BLOCKS.map(block => ({
    block,
    projects: sortProjects(projects.filter(project => project.block === block)),
  }));

const load = async (): Promise<Project[]> => {
  const entries = await getCollection('projects');
  const projects = entries.map(entry => entry.data);

  assertUniqueSlugs(projects);

  return projects.map(redactConfidential);
};

export const getAllProjects = async (locale: Locale = 'pt-BR'): Promise<Project[]> => {
  // i18n-content replaces these early returns with the overlay
  if (locale === 'en') return [];
  return sortProjects(await load());
};

export const getFeaturedProjects = async (locale: Locale = 'pt-BR'): Promise<Project[]> => {
  // i18n-content replaces these early returns with the overlay
  if (locale === 'en') return [];
  return featured(await load());
};

export const getProjectsByBlock = async (locale: Locale = 'pt-BR'): Promise<BlockGroup[]> => {
  // i18n-content replaces these early returns with the overlay
  if (locale === 'en') return groupByBlock([]);
  return groupByBlock(await load());
};

export const getProject = async (slug: string, locale: Locale = 'pt-BR'): Promise<Project | undefined> => {
  // i18n-content replaces these early returns with the overlay
  if (locale === 'en') return undefined;
  return (await load()).find(project => project.slug === slug);
};
