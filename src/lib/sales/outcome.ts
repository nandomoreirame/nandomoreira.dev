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
};

export const salesOutcomeMessage = (value: string | null): OutcomeMessage | undefined =>
  value !== null && Object.hasOwn(OUTCOMES, value) ? OUTCOMES[value] : undefined;
