export const AI_VIEW_LABELS = {
  human: 'Humano',
  ai: 'IA',
  ready: 'Pronto para LLM',
  rendered: 'Renderizado',
  source: 'Fonte',
  copy: 'Copiar',
  copied: 'Copiado',
  download: 'Baixar .md',
  close: 'Fechar',
  title: 'Título',
  url: 'URL',
} as const;

export type AiViewLabel = keyof typeof AI_VIEW_LABELS;
