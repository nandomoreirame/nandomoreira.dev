import { absoluteUrl } from '../aeo/urls';
import { toLongDate } from '../format/date';
import { type Locale, withLocale } from '../i18n/locale';
import { messagesFor } from '../i18n/messages';
import { routeFor } from '../i18n/routes';
import { saoPauloDay } from './day';
import type { NowSnapshot } from './load';
import { endSentence } from './sentence';
import { NOW_PATH } from './now';
import { isAllowedUrl, leaksToMachine, machineText } from './safe';

const pushSection = (lines: string[], title: string, body: string[], empty: string): void => {
  lines.push(`## ${title}`, '');
  if (body.length === 0) {
    lines.push(empty, '');
    return;
  }
  lines.push(...body, '');
};

const albumClause = (album: string, year: string | undefined): string => {
  if (leaksToMachine(album) || (year !== undefined && leaksToMachine(year))) return '';
  const safeYear = year !== undefined && /^\d{4}$/.test(year) ? year : undefined;
  const label = safeYear ? `${machineText(album)} (${safeYear})` : machineText(album);
  return `${endSentence(label)} `;
};

const linkedName = (name: string, url: string | undefined): string => {
  if (!url || !isAllowedUrl(url, 'www.xbox.com')) return machineText(name);
  return `[${machineText(name)}](${url})`;
};

const mediaClause = (
  platforms: readonly string[],
  progress: { current: number; total: number; percent: number } | undefined,
): string => {
  const parts: string[] = [];
  const names = platforms.filter(platform => !leaksToMachine(platform)).map(platform => machineText(platform));
  if (names.length > 0) parts.push(names.join(', '));
  if (progress) parts.push(`${progress.current} / ${progress.total} G (${progress.percent}%)`);
  return parts.length > 0 ? `, ${parts.join(', ')}` : '';
};

/** Machine view of /now. Same sections as the page, no address, no secret (REQ-015). */
export const nowMarkdown = ({
  site,
  data,
  locale = 'pt-BR',
}: {
  site: URL;
  data: NowSnapshot;
  locale?: Locale;
}): string => {
  const t = messagesFor(locale).nowPage;
  const path = routeFor(NOW_PATH, locale);
  const lines = [
    '---',
    `title: ${t.title}`,
    `url: ${absoluteUrl(site, path)}`,
    `updated: ${data.updatedAt}`,
    '---',
    '',
    `# ${t.heading}`,
    '',
    t.description,
    '',
  ];

  const availability = leaksToMachine(data.focus.availability) ? '' : machineText(data.focus.availability);
  const focus = [
    ...data.focus.items.map(item => `- ${item}`),
    ...(availability ? ['', t.availability(availability)] : []),
  ];
  pushSection(lines, t.sections.focus, focus, t.empty);

  const projects =
    data.projects.state === 'empty'
      ? []
      : data.projects.items.flatMap(repo => {
          if (leaksToMachine(repo.name)) return [];
          const description =
            repo.description && !leaksToMachine(repo.description)
              ? `${machineText(endSentence(repo.description))} `
              : '';
          const language = repo.language && !leaksToMachine(repo.language) ? `${machineText(repo.language)}. ` : '';
          const pushed = toLongDate(repo.pushedAt.slice(0, 10), locale);
          return [`- [${machineText(repo.name)}](${repo.url}): ${description}${language}${t.lastPush(pushed)}`];
        });
  const work: string[] = [];
  if (data.contributions.state === 'ok') {
    work.push(t.contributionsYear(data.contributions.items.total.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')));
  }
  const commit = data.lastCommit;
  if (commit && !leaksToMachine(commit.message) && !leaksToMachine(commit.repo)) {
    const day = toLongDate(saoPauloDay(new Date(commit.committedAt)), locale);
    work.push(t.lastCommit(machineText(commit.message), commit.url, machineText(commit.repo), day));
  }
  if (work.length > 0 && projects.length > 0) work.push('');
  pushSection(lines, t.sections.working, [...work, ...projects], t.empty);

  const writing: string[] = [];
  if (data.writing.latest) {
    const post = data.writing.latest;
    writing.push(`- [${post.title}](${absoluteUrl(site, withLocale(`/${post.slug}`, locale))})`);
  }
  for (const title of data.writing.drafts) writing.push(`- ${title}`);
  pushSection(lines, t.sections.writing, writing, t.empty);

  const studying = data.studying.flatMap(study => {
    if (leaksToMachine(study.topic) || leaksToMachine(study.note) || leaksToMachine(study.url)) return [];
    return [`- [${machineText(study.topic)}](${study.url}): ${machineText(study.note)}`];
  });
  pushSection(lines, t.sections.studying, studying, t.empty);

  const music: string[] = [];
  if (data.music.topArtists.state === 'ok') {
    const artists = data.music.topArtists.items.flatMap(artist => {
      if (leaksToMachine(artist.name)) return [];
      return [`- [${machineText(artist.name)}](${artist.url})`];
    });
    if (artists.length > 0) music.push(`### ${t.artistsOfMonth}`, '', ...artists);
  }
  if (data.music.recent.state !== 'empty') {
    const tracks = data.music.recent.items.flatMap(track => {
      if (leaksToMachine(track.title) || leaksToMachine(track.artists)) return [];
      const album = albumClause(track.album, track.year);
      const line = `- [${machineText(track.title)}](${track.url}), ${machineText(endSentence(track.artists))} ${album}${track.day}`;
      return [line];
    });
    if (music.length > 0 && tracks.length > 0) music.push('');
    music.push(...tracks);
  }
  pushSection(lines, t.sections.listening, music, t.empty);

  const games: string[] = [];
  if (data.games.state === 'ok') {
    const playingNow = data.games.items.playingNow;
    if (playingNow && !leaksToMachine(playingNow.title)) {
      games.push(
        t.playingNowLine(
          linkedName(playingNow.title, playingNow.url),
          mediaClause(playingNow.platforms, playingNow.progress),
        ),
      );
    }
    for (const game of data.games.items.recent) {
      if (leaksToMachine(game.name)) continue;
      games.push(
        `- ${linkedName(game.name, game.url)}, ${game.lastPlayed}${mediaClause(game.platforms, game.progress)}`,
      );
    }
  } else if (data.games.state === 'fallback') {
    for (const game of data.games.items) {
      games.push(game.note ? `- ${game.name}: ${game.note}` : `- ${game.name}`);
    }
  }
  pushSection(lines, t.sections.playing, games, t.empty);

  return lines.join('\n');
};
