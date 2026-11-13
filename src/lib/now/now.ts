/**
 * Curated /now copy. One source for the page and for its AI view.
 * Bump NOW_UPDATED_AT when this text changes.
 */

import type { Locale } from '../i18n/locale';

export const NOW_PATH = '/now';

/** Bump when the curated text changes. */
export const NOW_UPDATED_AT = '2026-10-17';

export const NOW_LEAD =
  'No que estou focado neste momento, os projetos e posts em andamento, o que estou estudando e até o que ando ouvindo e jogando.';

export type NowStudy = { topic: string; note: string; url: string };

/** Present priorities, only facts already on the profile or the cases. */
export const NOW_FOCUS = [
  'Produto de ponta a ponta, da interface ao dado, com teste escrito antes do código.',
  'Agentes de IA e esteiras de dados em produção, com resultado medido e suíte de regressão.',
  'Padrão de engenharia assistida por IA: TDD obrigatório, portões de qualidade e guard-rails de segurança.',
] as const;

/** English mirror of NOW_FOCUS (i18n-content translation guide). */
export const NOW_FOCUS_EN = [
  'End-to-end product, from the interface to the data, with the test written before the code.',
  'AI agents and data pipelines in production, with measured results and a regression suite.',
  'AI-assisted engineering standard: mandatory TDD, quality gates and security guardrails.',
] as const;

export const focusFor = (locale: Locale = 'pt-BR'): readonly string[] => (locale === 'en' ? NOW_FOCUS_EN : NOW_FOCUS);

/**
 * What is being studied, in order (2026-10-16). Each links to a public reading:
 * the study pages themselves live on the homelab and open for no one else.
 */
export const NOW_STUDYING: ReadonlyArray<NowStudy> = [
  {
    topic: 'RAG e busca vetorial',
    note: 'embeddings, busca híbrida e pgvector, começando por uma busca semântica nos posts deste blog.',
    url: 'https://www.anthropic.com/news/contextual-retrieval',
  },
  {
    topic: 'Evals de LLM',
    note: 'o teste automatizado de sistemas com modelo, com casos do domínio, nota por código e juiz calibrado.',
    url: 'https://hamel.dev/blog/posts/evals/',
  },
  {
    topic: 'Observabilidade com OpenTelemetry',
    note: 'traces, métricas e os quatro sinais de ouro, aplicados ao servidor MCP deste site.',
    url: 'https://opentelemetry.io/docs/concepts/observability-primer/',
  },
  {
    topic: 'Kubernetes e Terraform',
    note: 'o homelab descrito em arquivo, do contêiner ao cluster.',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
  },
  {
    topic: 'C# e .NET no Linux',
    note: 'o caminho de quem vem de TypeScript, até um servidor MCP em C#.',
    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tips-for-javascript-developers',
  },
];

/** English mirror of NOW_STUDYING. URLs stay identical. */
export const NOW_STUDYING_EN: ReadonlyArray<NowStudy> = [
  {
    topic: 'RAG and vector search',
    note: 'embeddings, hybrid search and pgvector, starting with a semantic search over the posts on this blog.',
    url: 'https://www.anthropic.com/news/contextual-retrieval',
  },
  {
    topic: 'LLM evals',
    note: 'automated testing of systems with a model, with domain cases, a score by code and a calibrated judge.',
    url: 'https://hamel.dev/blog/posts/evals/',
  },
  {
    topic: 'Observability with OpenTelemetry',
    note: "traces, metrics and the four golden signals, applied to this site's MCP server.",
    url: 'https://opentelemetry.io/docs/concepts/observability-primer/',
  },
  {
    topic: 'Kubernetes and Terraform',
    note: 'the homelab described in files, from the container to the cluster.',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
  },
  {
    topic: 'C# and .NET on Linux',
    note: 'the path for someone coming from TypeScript, up to an MCP server in C#.',
    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tips-for-javascript-developers',
  },
];

export const studyingFor = (locale: Locale = 'pt-BR'): ReadonlyArray<NowStudy> =>
  locale === 'en' ? NOW_STUDYING_EN : NOW_STUDYING;

/** The author fills this when a fallback list is wanted. Empty leaves Jogando empty. */
export const NOW_GAMES: Array<{ name: string; note?: string }> = [];

export const NOW_REPO_EXCLUDE = ['.dotfiles', 'dotfiles', 'nandomoreirame'];

/** Games hidden from Jogando and from "jogando agora" (author, 2026-10-11). */
export const NOW_GAME_EXCLUDE = ['Microsoft Jewel'];

export const NOW_TTL = {
  github: 30 * 60_000,
  /** The calendar moves once a day at most. */
  contributions: 3 * 60 * 60_000,
  spotify: 5 * 60_000,
  spotifyTop: 60 * 60_000,
  xbox: 5 * 60_000,
} as const;

/** How long a failed source stays failed before the next attempt. */
export const NOW_FAILURE_TTL_MS = 60_000;
