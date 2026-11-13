/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { InlineLink, Paragraph } from './_shared/blocks';
import { EmailLayout } from './_shared/layout';
import type { Locale } from '../lib/i18n/locale';
import { newsletterConfirmCopy } from '../lib/newsletter/copy';

interface Props {
  email: string;
  /** Plaintext one-time token. Only the hash is stored. */
  token: string;
  locale?: Locale;
}

const SITE = 'https://nandomoreira.dev';

/** Asks the subscriber to prove they own the address before anything else is sent. */
const NewsletterConfirm = ({ email, token, locale = 'pt-BR' }: Props) => {
  const copy = newsletterConfirmCopy(locale);
  const href = `${SITE}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
  return (
    <EmailLayout
      lang={locale}
      preview={copy.emailPreview}
      eyebrow={copy.emailEyebrow}
      title={copy.emailTitle}
      footer={copy.emailFooter(email)}
    >
      <Paragraph>
        {copy.emailBeforeLink(email)}
        <InlineLink href={href}>{copy.emailLinkLabel}</InlineLink>
        {copy.emailAfterLink}
      </Paragraph>
    </EmailLayout>
  );
};

NewsletterConfirm.PreviewProps = {
  email: 'fulano@exemplo.com',
  token: 'preview-token',
} satisfies Props;

export default NewsletterConfirm;
