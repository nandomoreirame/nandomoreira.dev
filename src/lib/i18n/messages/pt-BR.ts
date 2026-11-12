/**
 * Interface copy in pt-BR, the source language (D5). en.ts must have the same
 * shape: a missing key fails `npm run check` and tests/i18n/messages.test.ts.
 */
export const ptBR = {
  layout: {
    skipToContent: 'Pular para o conteúdo',
    rssTitle: 'Blog de Fernando Moreira',
  },
  language: {
    /** Name of each language written in itself, for the switcher. */
    names: { 'pt-BR': 'Português', en: 'English' },
    switchTo: 'Ler em português',
    suggestion: 'Esta página também existe em português.',
    suggestionLink: 'Ler em português',
    dismiss: 'Dispensar',
  },
} as const;
