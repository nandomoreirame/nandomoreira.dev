/**
 * Curated /now copy. One source for the page and for its AI view.
 * Bump NOW_UPDATED_AT when this text changes.
 */

export const NOW_PATH = '/now';

/** Bump when the curated text changes. */
export const NOW_UPDATED_AT = '2026-10-17';

export const NOW_LEAD =
  'No que estou focado neste momento, os projetos e posts em andamento, o que estou estudando e até o que ando ouvindo e jogando.';

/** Present priorities, only facts already on the profile or the cases. */
export const NOW_FOCUS = [
  'Produto de ponta a ponta, da interface ao dado, com teste escrito antes do código.',
  'Agentes de IA e esteiras de dados em produção, com resultado medido e suíte de regressão.',
  'Padrão de engenharia assistida por IA: TDD obrigatório, portões de qualidade e guard-rails de segurança.',
];

/**
 * What is being studied, in order (2026-10-16). Each links to a public reading:
 * the study pages themselves live on the homelab and open for no one else.
 */
export const NOW_STUDYING: ReadonlyArray<{ topic: string; note: string; url: string }> = [
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
