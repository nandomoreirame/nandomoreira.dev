import { BUDGETS, INTERESTS } from '../hire/schema';

type Budget = (typeof BUDGETS)[number];
type Interest = (typeof INTERESTS)[number];

/** pt-BR labels for the API slugs; a missing key fails the type check. */
const BUDGET_LABELS: Record<Budget, string> = {
  undecided: 'A definir',
  'up-to-10k': 'Até R$ 10 mil',
  '10k-30k': 'R$ 10–30 mil',
  '30k-60k': 'R$ 30–60 mil',
  '60k-plus': 'Acima de R$ 60 mil',
};

const INTEREST_LABELS: Record<Interest, string> = {
  job: 'Vaga (CLT/PJ)',
  freelance: 'Projeto freela',
  'ai-product': 'Produto de IA',
  'agents-mcp': 'Agents e MCP',
  consulting: 'Consultoria',
};

export const BUDGET_OPTIONS = BUDGETS.map((value) => ({ value, label: BUDGET_LABELS[value] }));

export const INTEREST_OPTIONS = INTERESTS.map((value) => ({ value, label: INTEREST_LABELS[value] }));

/** Form label for a budget slug; unknown values pass through unchanged. */
export const budgetLabelOf = (value: string): string =>
  Object.hasOwn(BUDGET_LABELS, value) ? BUDGET_LABELS[value as Budget] : value;

/** Form label for an interest slug; unknown values pass through unchanged. */
export const interestLabelOf = (value: string): string =>
  Object.hasOwn(INTEREST_LABELS, value) ? INTEREST_LABELS[value as Interest] : value;

interface OutcomeMessage {
  role: 'status' | 'alert';
  text: string;
}

const OUTCOMES: Record<string, OutcomeMessage> = {
  ok: {
    role: 'status',
    text: 'Ela já chegou para mim, e eu respondo no contato que você deixou.',
  },
  invalido: {
    role: 'alert',
    text: 'Faltou um campo obrigatório ou algum passou do limite. Confira nome, e-mail e mensagem e envie de novo.',
  },
  limite: {
    role: 'alert',
    text: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo, ou use o e-mail abaixo.',
  },
  erro: {
    role: 'alert',
    text: 'Não consegui registrar a mensagem agora. Escreva direto para o e-mail abaixo.',
  },
};

/** Reads the `envio` query value; anything unknown shows nothing. */
export const outcomeMessage = (value: string | null): OutcomeMessage | undefined =>
  value !== null && Object.hasOwn(OUTCOMES, value) ? OUTCOMES[value] : undefined;
