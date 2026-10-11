/**
 * Curated /now copy. One source for the page and for its AI view.
 * Bump NOW_UPDATED_AT when this text changes.
 */

export const NOW_PATH = '/now';

/** Bump when the curated text changes. */
export const NOW_UPDATED_AT = '2026-10-11';

export const NOW_LEAD =
  'O que eu contaria a um amigo que não vejo há um ano, no espírito do /now de Derek Sivers: https://nownownow.com/about.';

/** Present priorities, only facts already on the profile or the cases. */
export const NOW_FOCUS = [
  'Produto de ponta a ponta, da interface ao dado, com teste escrito antes do código.',
  'Agentes de IA e esteiras de dados em produção, com resultado medido e suíte de regressão.',
  'Padrão de engenharia assistida por IA: TDD obrigatório, portões de qualidade e guard-rails de segurança.',
];

/** What is off the table right now, still only facts from the profile. */
export const NOW_DECLINING = [
  'Trabalho de IA que fica em demonstração e não chega em produção.',
  'Projeto sem escopo fechado. O que eu aceito é escopo fechado, ou uma posição sênior, CLT ou PJ.',
];

/** The author fills this when a fallback list is wanted. Empty leaves Jogando empty. */
export const NOW_GAMES: Array<{ name: string; note?: string }> = [];

export const NOW_REPO_EXCLUDE = ['.dotfiles', 'dotfiles', 'nandomoreirame'];

/** Games hidden from Jogando and from "jogando agora" (author, 2026-10-11). */
export const NOW_GAME_EXCLUDE = ['Microsoft Jewel'];

export const NOW_TTL = {
  github: 30 * 60_000,
  spotify: 5 * 60_000,
  xbox: 5 * 60_000,
} as const;
