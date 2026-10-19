/** Rendered mail ready for the provider. */
export interface OutgoingMail {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}
