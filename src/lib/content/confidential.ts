import type { Project } from '../../content/schemas/project';

const REDACTED_CLIENT = 'cliente sob confidencialidade';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive replacement: client names rarely keep one capitalisation. */
const strip = (text: string, needles: readonly string[]): string =>
  needles.reduce((result, needle) => {
    if (!needle) return result;
    return result.replace(new RegExp(escapeRegExp(needle), 'gi'), '[omitido]');
  }, text);

/**
 * Redaction happens on read, never on write: the source file keeps the full
 * text so the author never maintains two versions of the same case (EC-011).
 *
 * slug / liveUrl / repoUrl are NOT rewritten here: redacting a route or URL
 * makes the case unusable. Confidential cases must not put the client name in
 * those fields; that is enforced at schema parse time.
 */
export const redactConfidential = (project: Project): Project => {
  if (!project.confidential) return project;

  const needles = [project.clientName ?? '', ...(project.confidentialMetrics ?? [])].filter(Boolean);

  return {
    ...project,
    clientName: REDACTED_CLIENT,
    confidentialMetrics: undefined,
    title: strip(project.title, needles),
    summary: strip(project.summary, needles),
    problem: strip(project.problem, needles),
    decisions: strip(project.decisions, needles),
    outcome: strip(project.outcome, needles),
    images: project.images?.map(image => ({
      ...image,
      alt: strip(image.alt, needles),
    })),
  };
};
