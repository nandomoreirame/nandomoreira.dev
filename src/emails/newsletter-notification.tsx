/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Fields } from './_shared/blocks';
import { receivedAt } from './_shared/format';
import { EmailLayout } from './_shared/layout';

interface Props {
  email: string;
  /** The page whose card took the signup (`/`, `/posts`). */
  origin: string;
  /** ISO timestamp of the signup. */
  at: string;
}

/** Someone new joined the newsletter list. Sent only for an address not yet on it. */
const NewsletterNotification = ({ email, origin, at }: Props) => (
  <EmailLayout
    preview={`${email} assinou as novidades`}
    eyebrow="nova assinatura"
    title="Nova assinatura da newsletter"
    footer={`Recebido em ${receivedAt(at)} via /api/subscribe`}
  >
    <Fields
      rows={[
        ['E-mail', email],
        ['Página', origin],
      ]}
    />
  </EmailLayout>
);

NewsletterNotification.PreviewProps = {
  email: 'fulano@exemplo.com',
  origin: '/posts',
  at: '2026-10-19T12:00:00.000Z',
} satisfies Props;

export default NewsletterNotification;
