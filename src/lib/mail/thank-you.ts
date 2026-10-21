import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
import ThankYou from '../../emails/thank-you';
import type { HireConfig } from '../hire/config';
import type { OutgoingMail } from './outgoing';

export type ThankYouKind = 'briefing' | 'cv' | 'newsletter' | 'quote';

const SUBJECT: Record<ThankYouKind, string> = {
  briefing: 'Recebi sua mensagem',
  quote: 'Recebi seu pedido de orçamento',
  cv: 'Obrigado por baixar meu currículo',
  newsletter: 'Assinatura confirmada',
};

/** Confirmation sent to the visitor after a form briefing, a quote request or a CV download. */
export const thankYouMail = async ({
  name,
  kind,
  service,
}: {
  name: string | null;
  kind: ThankYouKind;
  service?: string | null;
}): Promise<OutgoingMail> => {
  const html = await render(h(ThankYou, { name, kind, service }));
  return { subject: SUBJECT[kind], html, text: toPlainText(html) };
};

export type ThankYouSender = (to: string, mail: OutgoingMail) => Promise<void>;

/** Thin Resend wrapper: visitor is the recipient, no replyTo. */
export const resendThankYou = (config: HireConfig): ThankYouSender => {
  const client = new Resend(config.apiKey);

  return async (to, mail) => {
    const { error } = await client.emails.send({
      from: config.notifyFrom,
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error) throw new Error(`Mail provider rejected the message: ${error.name}`);
  };
};
