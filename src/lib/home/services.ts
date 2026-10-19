import type { Block } from '../../content/blocks';
import { collectionOfBlock } from '../catalog/groups';

interface Service {
  title: string;
  description: string;
  caseSlug: string;
}

export type ServiceCaseRef = {
  slug: string;
  block: Block;
};

/**
 * F1.4: every advertised service must reference a case that proves it.
 * The profile schema guarantees caseSlug is non-empty, but only here do the
 * two collections meet, so only here can the reference be resolved.
 */
export const assertServicesHaveCases = (services: readonly Service[], knownSlugs: readonly string[]): void => {
  const known = new Set(knownSlugs);
  const orphans = services.filter(service => !known.has(service.caseSlug));

  if (orphans.length > 0) {
    const detail = orphans.map(service => `"${service.title}" -> ${service.caseSlug}`).join('; ');

    throw new Error(`Every advertised service needs a case that proves it. Missing: ${detail}`);
  }
};

/** Real case route (/portfolio|lab/<slug>), never the legacy /projetos path. */
export const serviceCaseHref = (caseSlug: string, projects: readonly ServiceCaseRef[]): string | undefined => {
  const project = projects.find(candidate => candidate.slug === caseSlug);
  return project ? `/${collectionOfBlock(project.block)}/${caseSlug}` : undefined;
};
