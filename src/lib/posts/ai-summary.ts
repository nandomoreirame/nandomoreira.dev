import type { Locale } from '../i18n/locale';

/**
 * "Resumir com IA" on a post (2026-10-16, after akitaonrails.com): plain
 * links that open a new chat with a prompt already typed. The prompt
 * points at the post's markdown view, which the model reads without the page
 * around it. No script: the prompt goes in the q query parameter.
 */
const PROMPT_EN = (markdownUrl: string): string[] => [
  `Please open this URL with web search and read the full article (it is the markdown version of the post): ${markdownUrl}`,
  '',
  'After reading the actual content of the article, do the following:',
  '1) Summarize the most important points and the conclusion.',
  '2) Tell the reader which details, commands and decisions they are missing by not reading the full article. Be specific enough to make them curious.',
  '3) Remind them they can keep asking questions about the article here in this chat.',
  '4) Suggest a good follow-up question for them to start with.',
];

/** The prompt goes in the language of the page: an English post asks in English. */
export const aiSummaryPrompt = (markdownUrl: string, locale: Locale = 'pt-BR'): string =>
  (locale === 'en'
    ? PROMPT_EN(markdownUrl)
    : [
        `Por favor, abra esta URL com busca na web e leia o artigo completo (é a versão em markdown do post): ${markdownUrl}`,
        '',
        'Depois de ler o conteúdo real do artigo, faça o seguinte:',
        '1) Resuma os pontos mais importantes e a conclusão.',
        '2) Diga ao leitor quais detalhes, comandos e decisões ele está perdendo por não ler o artigo completo. Seja específico o suficiente para deixá-lo curioso.',
        '3) Lembre que ele pode continuar fazendo perguntas sobre o artigo aqui neste chat.',
        '4) Sugira uma boa pergunta de follow-up para ele começar.',
      ]
  ).join('\n');

export interface AiSummaryTarget {
  id: 'claude' | 'gemini' | 'chatgpt';
  name: string;
  /** Tooltip and accessible name; Gemini's names where it really lands. */
  label: string;
  /** Visible text on the post page toolbar (post-detail-redesign REQ-003). */
  short: string;
  icon: string;
  url: (prompt: string) => string;
}

export const AI_SUMMARY_TARGETS: AiSummaryTarget[] = [
  {
    id: 'claude',
    name: 'Claude',
    label: 'Resumir com Claude',
    short: 'Resumir com Claude',
    icon: 'simple-icons:claude',
    url: prompt => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    // gemini.google.com ignores q without a browser extension (2026-10-16);
    // the Google AI Mode runs on Gemini and takes it.
    id: 'gemini',
    name: 'Gemini',
    label: 'Resumir com a IA do Google',
    short: 'Google AI',
    icon: 'simple-icons:googlegemini',
    url: prompt => `https://www.google.com/search?udm=50&q=${encodeURIComponent(prompt)}`,
  },
  {
    // hints=search turns web search on, so the model fetches the post.
    id: 'chatgpt',
    name: 'ChatGPT',
    label: 'Resumir com ChatGPT',
    short: 'ChatGPT',
    icon: 'simple-icons:openai',
    url: prompt => `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`,
  },
];

export const aiSummaryUrl = (target: AiSummaryTarget, markdownUrl: string, locale: Locale = 'pt-BR'): string =>
  target.url(aiSummaryPrompt(markdownUrl, locale));
