/**
 * "Resumir com IA" on a post (2026-10-16, after akitaonrails.com): a plain
 * link that opens a new Claude chat with a prompt already typed. The prompt
 * points at the post's markdown view, which the model reads without the page
 * around it. No script: the prompt goes in the q query parameter.
 */
export const aiSummaryPrompt = (markdownUrl: string): string =>
  [
    `Por favor, abra esta URL com busca na web e leia o artigo completo (é a versão em markdown do post): ${markdownUrl}`,
    '',
    'Depois de ler o conteúdo real do artigo, faça o seguinte:',
    '1) Resuma os pontos mais importantes e a conclusão.',
    '2) Diga ao leitor quais detalhes, comandos e decisões ele está perdendo por não ler o artigo completo. Seja específico o suficiente para deixá-lo curioso.',
    '3) Lembre que ele pode continuar fazendo perguntas sobre o artigo aqui neste chat.',
    '4) Sugira uma boa pergunta de follow-up para ele começar.',
  ].join('\n');

export const aiSummaryUrl = (markdownUrl: string): string =>
  `https://claude.ai/new?q=${encodeURIComponent(aiSummaryPrompt(markdownUrl))}`;
