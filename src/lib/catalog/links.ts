export interface ProjectLink {
  kind: 'repo' | 'live';
  href: string;
  label: string;
  /** Maps onto the Button variants: filled for the product, outline for the source. */
  variant: 'primary' | 'secondary';
}

interface LinkSource {
  repoUrl?: string | null;
  liveUrl?: string | null;
}

/**
 * A private repository yields no entry at all. Rendering a disabled or empty
 * anchor is the broken-link failure the Flow 1 unhappy path warns about.
 *
 * Order and weight are fixed, not derived from which field happens to exist:
 * the running project leads as the single filled action, the source follows as
 * an outline. A repo-only case keeps the outline rather than being promoted,
 * so no page ever grows a second primary.
 */
export const visibleLinks = ({ repoUrl, liveUrl }: LinkSource): ProjectLink[] => {
  const links: ProjectLink[] = [];

  if (liveUrl) {
    links.push({ kind: 'live', href: liveUrl, label: 'Ver projeto', variant: 'primary' });
  }
  if (repoUrl) {
    links.push({ kind: 'repo', href: repoUrl, label: 'Código fonte', variant: 'secondary' });
  }

  return links;
};
