import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { Resend } from 'resend';
import HireNotification from '../../emails/hire-notification';
import type { JourneyData } from '../analytics/journey';
import type { OutgoingMail } from '../mail/outgoing';
import { isEmailContact } from '../sales/contact';
import type { HireConfig } from './config';
import type { StoredBriefing } from './store';

export type { OutgoingMail };

export interface Notifier {
  send: (briefing: StoredBriefing, id: string, journey?: JourneyData) => Promise<void>;
}

/**
 * Renders the hire notification from the React Email template (pt-BR). The IP
 * never goes in the mail: an inbox copy outlives the 30-day TTL the privacy
 * policy promises for network data.
 */
export const briefingMail = async (
  briefing: StoredBriefing,
  id: string,
  journey?: JourneyData,
): Promise<OutgoingMail> => {
  const html = await render(h(HireNotification, { briefing, id, journey }));
  const mail: OutgoingMail = {
    subject: `Novo briefing de ${briefing.from}`,
    html,
    text: toPlainText(html),
  };
  if (isEmailContact(briefing.contact)) mail.replyTo = briefing.contact.trim();
  return mail;
};

export const resendNotifier = (config: HireConfig): Notifier => {
  const client = new Resend(config.apiKey);

  return {
    send: async (briefing, id, journey) => {
      const mail = await briefingMail(briefing, id, journey);
      const { error } = await client.emails.send({
        from: config.notifyFrom,
        to: config.notifyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      });

      // The SDK reports failure in the payload rather than by throwing, so a
      // silent non-delivery would look identical to success.
      if (error) {
        throw new Error(`Mail provider rejected the message: ${error.name}`);
      }
    },
  };
};
