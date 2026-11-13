import type { Locale } from '../i18n/locale';

interface OutcomeMessage {
  role: 'status' | 'alert';
  text: string;
}

/** The sales pages have no e-mail on show, so a failure points to WhatsApp. */
const OUTCOMES: Record<string, OutcomeMessage> = {
  ok: { role: 'status', text: 'Recebi sua mensagem. Respondo pessoalmente, pelo canal que você deixou.' },
  invalido: {
    role: 'alert',
    text: 'Faltou o nome ou o contato não parece um e-mail ou WhatsApp válido. Confira e envie de novo.',
  },
  limite: { role: 'alert', text: 'Muitas tentativas seguidas. Espere alguns minutos ou me chame no WhatsApp.' },
  erro: { role: 'alert', text: 'Não consegui registrar a mensagem agora. Me chame no WhatsApp.' },
  captcha: {
    role: 'alert',
    text: 'Não consegui confirmar que o envio é humano. Recarregue a página e tente de novo, ou me chame no WhatsApp.',
  },
};

const OUTCOMES_EN: Record<string, OutcomeMessage> = {
  ok: { role: 'status', text: 'I received your message. I will reply personally through the channel you left.' },
  invalido: {
    role: 'alert',
    text: 'Your name is missing or the contact is not a valid email or WhatsApp number. Check it and send again.',
  },
  limite: { role: 'alert', text: 'Too many attempts. Wait a few minutes or contact me on WhatsApp.' },
  erro: { role: 'alert', text: 'I could not save your message right now. Contact me on WhatsApp.' },
  captcha: {
    role: 'alert',
    text: 'I could not confirm this was a human submission. Reload and try again, or contact me on WhatsApp.',
  },
};
export const salesOutcomeMessage = (value: string | null, locale: Locale = 'pt-BR'): OutcomeMessage | undefined => {
  const outcomes = locale === 'en' ? OUTCOMES_EN : OUTCOMES;
  return value !== null && Object.hasOwn(outcomes, value) ? outcomes[value] : undefined;
};
