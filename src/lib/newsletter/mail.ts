import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
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
