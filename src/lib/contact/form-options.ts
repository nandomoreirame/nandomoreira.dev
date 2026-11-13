import type { Locale } from '../i18n/locale';
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

/** English labels; values stay in reais because the budget is charged in BRL. */
const BUDGET_LABELS_EN: Record<Budget, string> = {
  undecided: 'To be defined',
  'up-to-10k': 'Up to R$ 10k',
  '10k-30k': 'R$ 10k–30k',
  '30k-60k': 'R$ 30k–60k',
  '60k-plus': 'Over R$ 60k',
};

const INTEREST_LABELS: Record<Interest, string> = {
  job: 'Vaga (CLT/PJ)',
  freelance: 'Projeto freela',
  'ai-product': 'Produto de IA',
  'agents-mcp': 'Agents e MCP',
  consulting: 'Consultoria',
};

const INTEREST_LABELS_EN: Record<Interest, string> = {
  job: 'Job (CLT/PJ)',
  freelance: 'Freelance project',
  'ai-product': 'AI product',
  'agents-mcp': 'Agents and MCP',
  consulting: 'Consulting',
};

const budgetLabelsFor = (locale: Locale): Record<Budget, string> =>
  locale === 'en' ? BUDGET_LABELS_EN : BUDGET_LABELS;

const interestLabelsFor = (locale: Locale): Record<Interest, string> =>
  locale === 'en' ? INTEREST_LABELS_EN : INTEREST_LABELS;

export const BUDGET_OPTIONS = BUDGETS.map(value => ({ value, label: BUDGET_LABELS[value] }));

export const INTEREST_OPTIONS = INTERESTS.map(value => ({ value, label: INTEREST_LABELS[value] }));

export const budgetOptions = (locale: Locale = 'pt-BR') =>
  BUDGETS.map(value => ({ value, label: budgetLabelsFor(locale)[value] }));

export const interestOptions = (locale: Locale = 'pt-BR') =>
  INTERESTS.map(value => ({ value, label: interestLabelsFor(locale)[value] }));

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
  captcha: {
    role: 'alert',
    text: 'Não consegui confirmar que o envio é humano. Recarregue a página e tente de novo.',
  },
};

const OUTCOMES_EN: Record<string, OutcomeMessage> = {
  ok: {
    role: 'status',
    text: 'It already reached me, and I reply on the contact you left.',
  },
  invalido: {
    role: 'alert',
    text: 'A required field is missing or one went over the limit. Check name, email and message and send again.',
  },
  limite: {
    role: 'alert',
    text: 'Too many attempts in a row. Wait a few minutes and try again, or use the email below.',
  },
  erro: {
    role: 'alert',
    text: 'I could not record the message right now. Write me directly at the email below.',
  },
  captcha: {
    role: 'alert',
    text: 'I could not confirm that the submission is human. Reload the page and try again.',
  },
};

/** Reads the `envio` query value; anything unknown shows nothing. */
export const outcomeMessage = (value: string | null, locale: Locale = 'pt-BR'): OutcomeMessage | undefined => {
  const outcomes = locale === 'en' ? OUTCOMES_EN : OUTCOMES;
  return value !== null && Object.hasOwn(outcomes, value) ? outcomes[value] : undefined;
};
