import type { Locale } from '../i18n/locale';

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

export const AI_VIEW_LABELS_EN: Record<AiViewLabel, string> = {
  human: 'Human',
  ai: 'AI',
  ready: 'LLM ready',
  rendered: 'Rendered',
  source: 'Source',
  copy: 'Copy',
  copied: 'Copied',
  download: 'Download .md',
  close: 'Close',
  title: 'Title',
  url: 'URL',
};

export const aiViewLabels = (locale: Locale = 'pt-BR'): Record<AiViewLabel, string> =>
  locale === 'en' ? AI_VIEW_LABELS_EN : AI_VIEW_LABELS;
