import { absoluteUrl } from '../aeo/urls';
import { formatPolicyDate } from '../privacy/policy';
import type { NowSnapshot } from './load';
import { endSentence } from './sentence';
import { NOW_LEAD, NOW_PATH, NOW_UPDATED_AT } from './now';
import { leaksToMachine, machineText } from './safe';

const pushSection = (lines: string[], title: string, body: string[]): void => {
  lines.push(`## ${title}`, '');
  if (body.length === 0) {
    lines.push('Sem dados no momento.', '');
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

const mediaClause = (
  platforms: readonly string[],
  progress: { current: number; total: number; percent: number } | undefined,
): string => {
  const parts: string[] = [];
  const names = platforms.filter((platform) => !leaksToMachine(platform)).map((platform) => machineText(platform));
  if (names.length > 0) parts.push(names.join(', '));
  if (progress) parts.push(`${progress.current} / ${progress.total} G (${progress.percent}%)`);
  return parts.length > 0 ? `, ${parts.join(', ')}` : '';
};

/** Machine view of /now. Same sections as the page, no address, no secret (REQ-015). */
export const nowMarkdown = ({ site, data }: { site: URL; data: NowSnapshot }): string => {
  const lines = [
    '---',
    'title: Agora',
    `url: ${absoluteUrl(site, NOW_PATH)}`,
    `updated: ${NOW_UPDATED_AT}`,
    '---',
    '',
    '# O que estou fazendo agora',
    '',
    NOW_LEAD,
    '',
  ];

  const availability = leaksToMachine(data.focus.availability) ? '' : machineText(data.focus.availability);
  const focus = [
    ...data.focus.items.map((item) => `- ${item}`),
    '',
    '### Recusando agora',
    '',
    ...data.focus.declining.map((item) => `- ${item}`),
    ...(availability ? ['', `Disponibilidade: ${availability}`] : []),
  ];
  pushSection(lines, 'Foco', focus);

  const projects =
    data.projects.state === 'empty'
      ? []
      : data.projects.items.flatMap((repo) => {
          if (leaksToMachine(repo.name)) return [];
          const description =
            repo.description && !leaksToMachine(repo.description) ? `${machineText(endSentence(repo.description))} ` : '';
          const language = repo.language && !leaksToMachine(repo.language) ? `${machineText(repo.language)}. ` : '';
          const pushed = formatPolicyDate(repo.pushedAt.slice(0, 10));
          return [`- [${machineText(repo.name)}](${repo.url}): ${description}${language}Último push em ${pushed}.`];
        });
  pushSection(lines, 'Projetos em andamento', projects);

  const writing: string[] = [];
  if (data.writing.latest) {
    const post = data.writing.latest;
    writing.push(`- [${post.title}](${absoluteUrl(site, `/${post.slug}`)})`);
  }
  for (const title of data.writing.drafts) writing.push(`- ${title}`);
  pushSection(lines, 'Escrevendo', writing);

  const music: string[] = [];
  if (data.music.topArtists.state === 'ok') {
    const artists = data.music.topArtists.items.flatMap((artist) => {
      if (leaksToMachine(artist.name)) return [];
      return [`- [${machineText(artist.name)}](${artist.url})`];
    });
    if (artists.length > 0) music.push('### Artistas do mês', '', ...artists);
  }
  if (data.music.recent.state !== 'empty') {
    const tracks = data.music.recent.items.flatMap((track) => {
      if (leaksToMachine(track.title) || leaksToMachine(track.artists)) return [];
      const album = albumClause(track.album, track.year);
      const line = `- [${machineText(track.title)}](${track.url}), ${machineText(endSentence(track.artists))} ${album}${track.day}`;
      return [line];
    });
    if (music.length > 0 && tracks.length > 0) music.push('');
    music.push(...tracks);
  }
  pushSection(lines, 'Ouvindo', music);

  const games: string[] = [];
  if (data.games.state === 'ok') {
    const playingNow = data.games.items.playingNow;
    if (playingNow && !leaksToMachine(playingNow.title)) {
      games.push(`Jogando agora: ${machineText(playingNow.title)}${mediaClause(playingNow.platforms, playingNow.progress)}`);
    }
    for (const game of data.games.items.recent) {
      if (leaksToMachine(game.name)) continue;
      games.push(`- ${machineText(game.name)}, ${game.lastPlayed}${mediaClause(game.platforms, game.progress)}`);
    }
  } else if (data.games.state === 'fallback') {
    for (const game of data.games.items) {
      games.push(game.note ? `- ${game.name}: ${game.note}` : `- ${game.name}`);
    }
  }
  pushSection(lines, 'Jogando', games);

  return lines.join('\n');
};
