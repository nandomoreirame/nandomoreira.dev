import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
import NewsletterConfirm from '../../emails/newsletter-confirm';
import NewsletterNotification from '../../emails/newsletter-notification';
import type { HireConfig } from '../hire/config';
import type { Locale } from '../i18n/locale';
import type { OutgoingMail } from '../mail/outgoing';
import { newsletterConfirmCopy } from './copy';

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
export const confirmationMail = async ({
  email,
  token,
  locale = 'pt-BR',
}: {
  email: string;
  token: string;
  locale?: Locale;
}): Promise<OutgoingMail> => {
  const html = await render(h(NewsletterConfirm, { email, token, locale }));
  return { subject: newsletterConfirmCopy(locale).emailSubject, html, text: toPlainText(html) };
};

export type ConfirmationSender = (email: string, token: string, locale?: Locale) => Promise<void>;

/** Same Resend account as the other newsletter mail. The subscriber is the recipient. */
export const resendConfirmationSender = (config: HireConfig): ConfirmationSender => {
  const client = new Resend(config.apiKey);

  return async (email, token, locale = 'pt-BR') => {
    const mail = await confirmationMail({ email, token, locale });
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
