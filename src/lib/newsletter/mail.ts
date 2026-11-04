import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
import NewsletterConfirm from '../../emails/newsletter-confirm';
import NewsletterNotification from '../../emails/newsletter-notification';
import type { HireConfig } from '../hire/config';
import type { OutgoingMail } from '../mail/outgoing';

/** The mail that tells me someone new joined the list. */
export const subscriberMail = async ({
  email,
  origin,
  at,
}: {
  email: string;
  origin: string;
  at: string;
}): Promise<OutgoingMail> => {
  const html = await render(h(NewsletterNotification, { email, origin, at }));
  return { subject: `Nova assinatura: ${email}`, html, text: toPlainText(html) };
};

export type SubscriberNotifier = (mail: OutgoingMail) => Promise<void>;

/** The mail that carries the one-time confirmation link. */
export const confirmationMail = async ({ email, token }: { email: string; token: string }): Promise<OutgoingMail> => {
  const html = await render(h(NewsletterConfirm, { email, token }));
  return { subject: 'Confirme sua assinatura', html, text: toPlainText(html) };
};

export type ConfirmationSender = (email: string, token: string) => Promise<void>;

/** Same Resend account as the other newsletter mail. The subscriber is the recipient. */
export const resendConfirmationSender = (config: HireConfig): ConfirmationSender => {
  const client = new Resend(config.apiKey);

  return async (email, token) => {
    const mail = await confirmationMail({ email, token });
    const { error } = await client.emails.send({
      from: config.notifyFrom,
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error) throw new Error(`Mail provider rejected the message: ${error.name}`);
  };
};

/** Same Resend account and addresses as the lead notifications (HireConfig). */
export const resendSubscriberNotifier = (config: HireConfig): SubscriberNotifier => {
  const client = new Resend(config.apiKey);

  return async mail => {
    const { error } = await client.emails.send({
      from: config.notifyFrom,
      to: config.notifyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    // The SDK reports failure in the payload rather than by throwing.
    if (error) throw new Error(`Mail provider rejected the message: ${error.name}`);
  };
};
