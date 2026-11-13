import type { Locale } from '../i18n/locale';
import type { SubscribeOutcome } from './handler';

type NewsletterCopy = {
  eyebrow: string;
  title: string;
  text: string;
  button: string;
  placeholder: string;
  consent: string;
  privacyLink: string;
  emailLabel: string;
};

type NewsletterOutcome = { role: 'status' | 'alert'; text: string };

/** Card copy from the Stitch screen (REQ-008); the author revises it later. */
const NEWSLETTER_COPY_PT: NewsletterCopy = {
  eyebrow: 'Novidades no terminal',
  title: 'Assine o feed de artigos técnicos',
  text: 'Zero marketing. Apenas novos artigos quando saem no ar.',
  button: 'Assinar',
  placeholder: 'seu-email@dominio.com',
  consent: 'Ao assinar, você concorda com a',
  privacyLink: 'política de privacidade',
  emailLabel: 'E-mail',
};

const NEWSLETTER_COPY_EN: NewsletterCopy = {
  eyebrow: 'Updates in the terminal',
  title: 'Subscribe to the technical article feed',
  text: 'Zero marketing. Just new articles when they go live.',
  button: 'Subscribe',
  placeholder: 'you@example.com',
  consent: 'By subscribing, you agree to the',
  privacyLink: 'privacy policy',
  emailLabel: 'E-mail',
};

const NEWSLETTER_OUTCOMES_PT: Record<SubscribeOutcome, NewsletterOutcome> = {
  ok: {
    role: 'status',
    text: 'Se o endereço for novo, enviei um link de confirmação. Os artigos só começam depois desse clique.',
  },
  invalido: { role: 'alert', text: 'Esse e-mail não parece válido. Confira e tente de novo.' },
  limite: { role: 'alert', text: 'Muitas tentativas seguidas. Tente de novo em alguns minutos.' },
  erro: { role: 'alert', text: 'Não consegui registrar agora. Tente de novo mais tarde.' },
  captcha: {
    role: 'alert',
    text: 'Não consegui confirmar que o envio é humano. Recarregue a página e tente de novo.',
  },
};

const NEWSLETTER_OUTCOMES_EN: Record<SubscribeOutcome, NewsletterOutcome> = {
  ok: {
    role: 'status',
    text: 'If the address is new, I sent a confirmation link. Articles start only after that click.',
  },
  invalido: { role: 'alert', text: 'That e-mail does not look valid. Check it and try again.' },
  limite: { role: 'alert', text: 'Too many attempts in a row. Try again in a few minutes.' },
  erro: { role: 'alert', text: 'I could not register that now. Try again later.' },
  captcha: {
    role: 'alert',
    text: 'I could not confirm this submission is human. Reload the page and try again.',
  },
};

export const newsletterCopy = (locale: Locale = 'pt-BR'): NewsletterCopy =>
  locale === 'en' ? NEWSLETTER_COPY_EN : NEWSLETTER_COPY_PT;

export const newsletterOutcomes = (
  locale: Locale = 'pt-BR',
): Record<SubscribeOutcome, NewsletterOutcome> =>
  locale === 'en' ? NEWSLETTER_OUTCOMES_EN : NEWSLETTER_OUTCOMES_PT;

/** pt-BR card copy kept for callers that do not pass a locale yet. */
export const NEWSLETTER_COPY = {
  eyebrow: NEWSLETTER_COPY_PT.eyebrow,
  title: NEWSLETTER_COPY_PT.title,
  text: NEWSLETTER_COPY_PT.text,
  button: NEWSLETTER_COPY_PT.button,
  placeholder: NEWSLETTER_COPY_PT.placeholder,
} as const;

export const NEWSLETTER_OUTCOMES: Record<SubscribeOutcome, NewsletterOutcome> = NEWSLETTER_OUTCOMES_PT;

export const outcomeOf = (value: string | null): SubscribeOutcome | undefined =>
  value && Object.hasOwn(NEWSLETTER_OUTCOMES, value) ? (value as SubscribeOutcome) : undefined;
