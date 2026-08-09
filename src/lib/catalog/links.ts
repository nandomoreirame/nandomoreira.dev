export interface ProjectLink {
  kind: 'repo' | 'live';
  href: string;
  label: string;
}

interface LinkSource {
  repoUrl?: string | null;
  liveUrl?: string | null;
}

/**
 * A private repository yields no entry at all. Rendering a disabled or empty
 * anchor is the broken-link failure the Flow 1 unhappy path warns about.
 */
export const visibleLinks = ({ repoUrl, liveUrl }: LinkSource): ProjectLink[] => {
  const links: ProjectLink[] = [];

  if (repoUrl) links.push({ kind: 'repo', href: repoUrl, label: 'Ver repositório' });
  if (liveUrl) links.push({ kind: 'live', href: liveUrl, label: 'Ver no ar' });

  return links;
};
