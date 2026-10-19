/** Visible strings of the command palette (docs/specs/command-palette, D9), in pt-BR. */
export const PALETTE_COPY = {
  placeholder: 'Digite um comando ou busque…',
  label: 'Buscar no site',
  trigger: 'Abrir a busca',
  hint: { before: 'Pressione', after: 'para começar' },
  empty: 'Nada encontrado.',
  unavailable: 'A busca está indisponível agora; os atalhos continuam funcionando.',
  copied: 'Link copiado',
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
    contact: 'Ir para o contato',
  },
} as const;

export interface GoTarget {
  key: string;
  path: string;
  label: string;
}

/** G + letter (D6): global, only in sequence, never a lone key. */
export const GO_TARGETS: readonly GoTarget[] = [
  { key: 'h', path: '/', label: 'Home' },
  { key: 'b', path: '/posts', label: 'Blog' },
  { key: 'p', path: '/portfolio', label: 'Portfólio' },
  { key: 'l', path: '/lab', label: 'Lab' },
  { key: 's', path: '/sobre', label: 'Sobre' },
  { key: 'u', path: '/setup', label: 'Setup' },
  { key: 'n', path: '/now', label: 'Agora' },
  { key: 'c', path: '/contato', label: 'Contato' },
  { key: 'm', path: '/mcp', label: 'MCP' },
];

/** Site pages that enter the search index (REQ-005). */
export const PALETTE_PAGES: ReadonlyArray<{ path: string; title: string }> = [
  ...GO_TARGETS.map(({ path, label }) => ({ path, title: label })),
  { path: '/curriculo', title: 'Currículo' },
];
