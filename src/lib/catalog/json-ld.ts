import type { Project } from '../../content/schemas/project';

export interface ProjectJsonLd {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication' | 'CreativeWork';
  name: string;
  description: string;
  url: string;
  keywords: string;
  codeRepository?: string;
  applicationCategory?: string;
}

/**
 * The type follows the artefact: something with a deployed version is an
 * application, everything else is a creative work. Deterministic, derived from
 * data that already exists, no extra schema field.
 */
export const jsonLdForProject = (project: Project, site: string): ProjectJsonLd => {
  const isApplication = Boolean(project.liveUrl);

  return {
    '@context': 'https://schema.org',
    '@type': isApplication ? 'SoftwareApplication' : 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: `${site}/projetos/${project.slug}`,
    keywords: project.tech.join(', '),
    ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
    ...(isApplication ? { applicationCategory: 'DeveloperApplication' } : {}),
  };
};

/** Escapes `<` so user content can never break out of the script tag. */
export const serialiseJsonLd = (ld: ProjectJsonLd): string =>
  JSON.stringify(ld).replaceAll('<', '\\u003c');
