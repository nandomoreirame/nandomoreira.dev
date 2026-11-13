import { getCollection } from 'astro:content';
import { BLOCKS, type Block } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';
import type { Locale } from '../i18n/locale';
import { redactConfidential } from './confidential';
import { assertProjectTranslations, mergeProject } from './translations';
import { assertUniqueSlugs } from './validate';

export interface BlockGroup {
  block: Block;
  projects: Project[];
}

export const sortProjects = (projects: readonly Project[], locale: Locale = 'pt-BR'): Project[] =>
  [...projects].sort((a, b) => a.title.localeCompare(b.title, locale));

export const featured = (projects: readonly Project[], locale: Locale = 'pt-BR'): Project[] =>
  sortProjects(
    projects.filter(project => project.featured),
    locale,
  );

/** Every block is present even when empty, so a missing block is visible. */
export const groupByBlock = (projects: readonly Project[], locale: Locale = 'pt-BR'): BlockGroup[] =>
  BLOCKS.map(block => ({
    block,
    projects: sortProjects(
      projects.filter(project => project.block === block),
      locale,
    ),
  }));

const load = async (): Promise<Project[]> => {
  const entries = await getCollection('projects');
  const projects = entries.map(entry => entry.data);

  assertUniqueSlugs(projects);

  return projects.map(redactConfidential);
};

const loadEn = async (): Promise<Project[]> => {
  const [sourceEntries, overlayEntries] = await Promise.all([
    getCollection('projects'),
    getCollection('projectsEn'),
  ]);
  const sources = sourceEntries.map(entry => entry.data);
  const overlays = overlayEntries.map(entry => entry.data);

  assertUniqueSlugs(sources);
  assertProjectTranslations(sources, overlays);

  const bySlug = new Map(sources.map(project => [project.slug, project]));

  return overlays.map(overlay =>
    redactConfidential(mergeProject(bySlug.get(overlay.translationOf)!, overlay)),
  );
};

const forLocale = async (locale: Locale): Promise<Project[]> =>
  locale === 'en' ? await loadEn() : await load();

export const getAllProjects = async (locale: Locale = 'pt-BR'): Promise<Project[]> =>
  sortProjects(await forLocale(locale), locale);

export const getFeaturedProjects = async (locale: Locale = 'pt-BR'): Promise<Project[]> =>
  featured(await forLocale(locale), locale);

export const getProjectsByBlock = async (locale: Locale = 'pt-BR'): Promise<BlockGroup[]> =>
  groupByBlock(await forLocale(locale), locale);

export const getProject = async (slug: string, locale: Locale = 'pt-BR'): Promise<Project | undefined> =>
  (await forLocale(locale)).find(project => project.slug === slug);
