import type { SubscribeOutcome } from './handler';

/** Card copy from the Stitch screen (REQ-008); the author revises it later. */
export const NEWSLETTER_COPY = {
  eyebrow: 'Novidades no terminal',
  title: 'Assine o feed de artigos técnicos',
  text: 'Zero marketing. Apenas novos artigos quando saem no ar.',
  button: 'Assinar',
  placeholder: 'seu-email@dominio.com',
} as const;

export const NEWSLETTER_OUTCOMES: Record<SubscribeOutcome, { role: 'status' | 'alert'; text: string }> = {
  ok: { role: 'status', text: 'Pronto. Os próximos artigos chegam neste e-mail.' },
  invalido: { role: 'alert', text: 'Esse e-mail não parece válido. Confira e tente de novo.' },
  limite: { role: 'alert', text: 'Muitas tentativas seguidas. Tente de novo em alguns minutos.' },
  erro: { role: 'alert', text: 'Não consegui registrar agora. Tente de novo mais tarde.' },
};

export const outcomeOf = (value: string | null): SubscribeOutcome | undefined =>
  value && Object.hasOwn(NEWSLETTER_OUTCOMES, value) ? (value as SubscribeOutcome) : undefined;
