import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
import ThankYou from '../../emails/thank-you';
import type { HireConfig } from '../hire/config';
import type { OutgoingMail } from './outgoing';

export type ThankYouKind = 'briefing' | 'cv';

const SUBJECT: Record<ThankYouKind, string> = {
  briefing: 'Recebi sua mensagem',
  cv: 'Obrigado por baixar meu currículo',
};

/** Confirmation sent to the visitor after a form briefing or a CV download. */
export const thankYouMail = async ({
  name,
  kind,
}: {
  name: string | null;
  kind: ThankYouKind;
}): Promise<OutgoingMail> => {
  const html = await render(h(ThankYou, { name, kind }));
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
