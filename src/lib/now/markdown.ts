import { absoluteUrl } from '../aeo/urls';
import { formatPolicyDate } from '../privacy/policy';
import type { NowSnapshot } from './load';
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
            repo.description && !leaksToMachine(repo.description) ? `${machineText(repo.description)}. ` : '';
          const language = repo.language && !leaksToMachine(repo.language) ? `${machineText(repo.language)}. ` : '';
          const pushed = formatPolicyDate(repo.pushedAt.slice(0, 10));
          return [`- [${machineText(repo.name)}](${repo.url}): ${description}${language}Último push em ${pushed}.`];
        });
  pushSection(lines, 'Projetos em andamento', projects);

  const writing: string[] = [];
  if (data.writing.latest) {
    const post = data.writing.latest;
    writing.push(`- [${post.title}](${absoluteUrl(site, `/posts/${post.slug}`)})`);
  }
  for (const title of data.writing.drafts) writing.push(`- ${title}`);
  pushSection(lines, 'Escrevendo', writing);

  const music =
    data.music.state === 'empty'
      ? []
      : data.music.items.flatMap((track) => {
          if (leaksToMachine(track.title) || leaksToMachine(track.artists)) return [];
          return [`- [${machineText(track.title)}](${track.url}), ${machineText(track.artists)}. ${track.day}`];
        });
  pushSection(lines, 'Ouvindo', music);

  const games: string[] = [];
  if (data.games.state === 'ok') {
    const playingNow = data.games.items.playingNow;
    if (playingNow && !leaksToMachine(playingNow.title)) {
      games.push(`Jogando agora: ${machineText(playingNow.title)}`);
    }
    for (const game of data.games.items.recent) {
      if (leaksToMachine(game.name)) continue;
      games.push(`- ${machineText(game.name)}, ${game.lastPlayed}`);
    }
  } else if (data.games.state === 'fallback') {
    for (const game of data.games.items) {
      games.push(game.note ? `- ${game.name}: ${game.note}` : `- ${game.name}`);
    }
  }
  pushSection(lines, 'Jogando', games);

  return lines.join('\n');
};
