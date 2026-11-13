import type { Project } from '../../content/schemas/project';
import { serialiseJsonLd as sharedSerialise } from '../aeo/json-ld';
import type { Locale } from '../i18n/locale';
import { withLocale } from '../i18n/locale';
import { collectionOfBlock } from './groups';

export interface ProjectJsonLd {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication' | 'CreativeWork';
  name: string;
  description: string;
  url: string;
  keywords: string;
  inLanguage: string;
  codeRepository?: string;
  applicationCategory?: string;
}

/**
 * The type follows the artefact: something with a deployed version is an
 * application, everything else is a creative work. Deterministic, derived from
 * data that already exists, no extra schema field.
 */
export const jsonLdForProject = (
  project: Project,
  site: string,
  locale: Locale = 'pt-BR',
): ProjectJsonLd => {
  const isApplication = Boolean(project.liveUrl);
  const collection = collectionOfBlock(project.block);
  const path =
    locale === 'en'
      ? withLocale(`/${collection}/${project.slug}`, locale)
      : `/projetos/${project.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': isApplication ? 'SoftwareApplication' : 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: `${site}${path}`,
    keywords: project.tech.join(', '),
    inLanguage: locale === 'en' ? 'en' : 'pt-BR',
    ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
    ...(isApplication ? { applicationCategory: 'DeveloperApplication' } : {}),
  };
};

/** Shared escape; re-exported so catalogue callers keep a single import path. */
export const serialiseJsonLd = sharedSerialise;
