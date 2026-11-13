import type { Locale } from '../i18n/locale';
import { caseGoPath } from '../analytics/outbound';
import { collectionOfBlock } from '../catalog/groups';
import { getAllProjects } from '../content';
import { salesCopy } from './copy';

export interface SalesProject {
  slug: string;
  title: string;
  kind: string;
  text: string;
  alt: string;
  domain: string;
  href: string;
  image: string;
}

/**
 * Name and live URL come from the collection (single source); the plain-words
 * line comes from the sales copy, because the case summaries speak to engineers.
 * A project missing from the collection or without a live URL fails the build.
 */
export const salesProjects = async (locale: Locale = 'pt-BR'): Promise<SalesProject[]> => {
  const projects = await getAllProjects(locale);

  return salesCopy(locale).projects.map(entry => {
    const project = projects.find(candidate => candidate.slug === entry.slug);
    if (!project?.liveUrl) throw new Error(`Sales project ${entry.slug} needs a live URL in the collection.`);

    return {
      ...entry,
      title: project.title,
      domain: new URL(project.liveUrl).hostname.replace(/^www\./, ''),
      href: caseGoPath(collectionOfBlock(project.block), project.slug, 'live'),
      image: `/servicos/projetos/${project.slug}.webp`,
    };
  });
};
