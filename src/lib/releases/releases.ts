import { absoluteUrl } from '../aeo/urls';
import { parseReleases, saoPauloToday, withLiveTag, type Release } from './data';

/**
 * The /releases/17 page: one release per day of work on the current version,
 * newest first, told by the macro features that shipped that day, never commit
 * by commit. One file per day in src/data/releases, drafted from the git log
 * by scripts/release-draft.mjs and written by hand (or by /release-day). The
 * commit count in each tag is the repository total at the end of that day.
 * Days whose commits changed nothing a visitor sees are listed in
 * src/data/releases/skipped.json.
 */
/** Releases of the current version, under the list of every version at /releases. */
export const RELEASES_PATH = '/releases/17';

export const RELEASES_LEAD =
  'Um lançamento por dia de trabalho desde o primeiro commit desta versão, em 8 de agosto de 2026. Cada dia conta as features grandes que entraram, não os commits.';

export type { Release } from './data';

/** Every file in src/data/releases, validated and newest first. */
export const RELEASES: Release[] = parseReleases(
  import.meta.glob<{ frontmatter: unknown }>('../../data/releases/*.md', { eager: true }),
);

/** The releases as the page shows them: today's one with the live tag. */
export const liveReleases = (tag: string, now: Date = new Date()): Release[] =>
  withLiveTag(RELEASES, { tag, today: saoPauloToday(now) });

/** Anchor of a day on the page: "dia-2026-10-19". */
export const releaseAnchor = (release: Pick<Release, 'date'>): string => `dia-${release.date}`;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Index entry of a day: "19 out · v17.753". */
export const releaseTocLabelOf = (release: Pick<Release, 'date' | 'version'>): string => {
  const [, month, day] = release.date.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} · ${release.version}`;
};

const DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "19 de outubro de 2026". */
export const releaseDateOf = (date: string): string => DATE.format(new Date(`${date}T00:00:00Z`));

export const releasesMarkdown = ({ site, releases = RELEASES }: { site: URL; releases?: Release[] }): string => {
  const lines: string[] = [
    '---',
    'title: Lançamentos',
    `url: ${absoluteUrl(site, RELEASES_PATH)}`,
    '---',
    '',
    '# Lançamentos',
    '',
    RELEASES_LEAD,
    '',
  ];

  for (const release of releases) {
    lines.push(
      `## ${releaseDateOf(release.date)}: ${release.title} (${release.version})`,
      '',
      release.summary,
      '',
      ...release.highlights.map(item => `- ${item}`),
      '',
    );
  }

  return lines.join('\n');
};
