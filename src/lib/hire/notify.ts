import { Resend } from 'resend';
import type { HireConfig } from './config';
import type { StoredBriefing } from './store';

export interface Notifier {
  send: (briefing: StoredBriefing, id: string) => Promise<void>;
}

/**
 * The mail carries the briefing in full so the inbox is enough on its own
 * (REQ-012): having to open the database to read what someone wrote defeats
 * the point of being notified.
 */
export const renderNotification = (briefing: StoredBriefing, id: string): string =>
  [
    `New briefing via /api/hire`,
    '',
    `From:      ${briefing.from}`,
    `Contact:   ${briefing.contact}`,
    `Company:   ${briefing.company ?? 'not given'}`,
    `Budget:    ${briefing.budget ?? 'not given'}`,
    `Interests: ${briefing.interests.length > 0 ? briefing.interests.join(', ') : 'not given'}`,
    `Received:  ${briefing.receivedAt}`,
    // The IP stays out of the mail: an inbox copy outlives the 30-day TTL
    // the privacy policy promises for network data.
    `Agent:     ${briefing.userAgent ?? 'not declared'}`,
    `Record:    ${id}`,
    '',
    'Briefing',
    '--------',
    briefing.brief,
    '',
  ].join('\n');

export const resendNotifier = (config: HireConfig): Notifier => {
  const client = new Resend(config.apiKey);

  return {
    send: async (briefing, id) => {
      const { error } = await client.emails.send({
        from: config.notifyFrom,
        to: config.notifyTo,
        subject: `Briefing from ${briefing.from}`,
        text: renderNotification(briefing, id),
      });

      // The SDK reports failure in the payload rather than by throwing, so a
      // silent non-delivery would look identical to success.
      if (error) {
        throw new Error(`Mail provider rejected the message: ${error.name}`);
      }
    },
  };
};
