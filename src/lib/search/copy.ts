import type { Locale } from '../i18n/locale';
import { salesUrl } from '../sales/host';
import { themeCopy } from '../theme/copy';

/** Visible strings of the command palette (docs/specs/command-palette, D9). */
const PALETTE_COPY_PT = {
  placeholder: 'Digite um comando ou busque…',
  label: 'Buscar no site',
  trigger: 'Abrir a busca',
  hint: { before: 'Pressione', after: 'para navegar' },
  empty: 'Nada encontrado.',
  unavailable: 'A busca está indisponível agora; os atalhos continuam funcionando.',
  copied: 'Link copiado',
  copiedDetail: 'Agora é só compartilhar.',
  closeToast: 'Fechar aviso',
  results: (count: number) => (count === 1 ? '1 resultado' : `${count} resultados`),
  groups: {
    general: 'Geral',
    go: 'Ir para',
    post: 'Posts',
    case: 'Cases',
    page: 'Páginas',
    service: 'Serviços',
    archive: 'Arquivo',
  },
  actions: {
    copyLink: 'Copiar link',
    email: 'Enviar e-mail',
    source: 'Código-fonte',
    contact: 'Ir para o contato',
    markdown: 'Versão .md',
    ai: 'Versão para IA',
    human: 'Versão para humanos',
    themePaper: themeCopy('pt-BR').toPaper,
    themeNoir: themeCopy('pt-BR').toNoir,
  },
} as const;

const PALETTE_COPY_EN = {
  placeholder: 'Type a command or search…',
  label: 'Search the site',
  trigger: 'Open search',
  hint: { before: 'Press', after: 'to navigate' },
  empty: 'Nothing found.',
  unavailable: 'Search is unavailable right now; shortcuts still work.',
  copied: 'Link copied',
  copiedDetail: 'Ready to share.',
  closeToast: 'Dismiss notice',
  results: (count: number) => (count === 1 ? '1 result' : `${count} results`),
  groups: {
    general: 'General',
    go: 'Go to',
    post: 'Posts',
    case: 'Cases',
    page: 'Pages',
    service: 'Services',
    archive: 'Archive',
  },
  actions: {
    copyLink: 'Copy link',
    email: 'Send email',
    source: 'Source code',
    contact: 'Go to contact',
    markdown: '.md version',
    ai: 'AI version',
    human: 'Human version',
    themePaper: themeCopy('en').toPaper,
    themeNoir: themeCopy('en').toNoir,
  },
} as const;

export type PaletteCopy = {
  placeholder: string;
  label: string;
  trigger: string;
  hint: { before: string; after: string };
  empty: string;
  unavailable: string;
  copied: string;
  copiedDetail: string;
  closeToast: string;
  results: (count: number) => string;
  groups: { [K in keyof typeof PALETTE_COPY_PT.groups]: string };
  actions: { [K in keyof typeof PALETTE_COPY_PT.actions]: string };
};

export const paletteCopy = (locale: Locale = 'pt-BR'): PaletteCopy =>
  locale === 'en' ? PALETTE_COPY_EN : PALETTE_COPY_PT;

/** pt-BR object kept so the existing search suite stays green. */
export const PALETTE_COPY = paletteCopy('pt-BR');

export interface GoTarget {
  key: string;
  path: string;
  label: string;
}

/** The repository of this site, public since 2026-10-19. */
export const SOURCE_URL = 'https://github.com/nandomoreirame/nandomoreira.dev';

const GO_TARGETS_PT: readonly GoTarget[] = [
  { key: 'h', path: '/', label: 'Home' },
  { key: 'b', path: '/posts', label: 'Blog' },
  { key: 'p', path: '/portfolio', label: 'Portfólio' },
  { key: 'l', path: '/lab', label: 'Lab' },
  { key: 's', path: '/sobre', label: 'Sobre' },
  { key: 'u', path: '/setup', label: 'Setup' },
  { key: 'n', path: '/now', label: 'Agora' },
  { key: 'c', path: '/contato', label: 'Contato' },
  { key: 'm', path: '/mcp', label: 'MCP' },
  // S is taken by Sobre: V, from serViços. The landing lives on the sales host.
  { key: 'v', path: salesUrl(), label: 'Serviços' },
];

const GO_TARGETS_EN: readonly GoTarget[] = [
  { key: 'h', path: '/', label: 'Home' },
  { key: 'b', path: '/posts', label: 'Blog' },
  { key: 'p', path: '/portfolio', label: 'Portfolio' },
  { key: 'l', path: '/lab', label: 'Lab' },
  { key: 's', path: '/sobre', label: 'About' },
  { key: 'u', path: '/setup', label: 'Setup' },
  { key: 'n', path: '/now', label: 'Now' },
  { key: 'c', path: '/contato', label: 'Contact' },
  { key: 'm', path: '/mcp', label: 'MCP' },
  { key: 'v', path: salesUrl(), label: 'Services' },
];

/** G + letter (D6): global, only in sequence, never a lone key. */
export const goTargets = (locale: Locale = 'pt-BR'): readonly GoTarget[] =>
  locale === 'en' ? GO_TARGETS_EN : GO_TARGETS_PT;

export const GO_TARGETS: readonly GoTarget[] = goTargets('pt-BR');

/** Site pages that enter the search index (REQ-005). */
export const palettePages = (locale: Locale = 'pt-BR'): ReadonlyArray<{ path: string; title: string }> => [
  // Only this site's pages: the sales landing enters as a service (build-index).
  ...goTargets(locale)
    .filter(({ path }) => path.startsWith('/'))
    .map(({ path, label }) => ({ path, title: label })),
  { path: '/curriculo', title: locale === 'en' ? 'Resume' : 'Currículo' },
];

export const PALETTE_PAGES: ReadonlyArray<{ path: string; title: string }> = palettePages('pt-BR');
