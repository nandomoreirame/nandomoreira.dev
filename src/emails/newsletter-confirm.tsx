/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { InlineLink, Paragraph } from './_shared/blocks';
import { EmailLayout } from './_shared/layout';

interface Props {
  email: string;
  /** Plaintext one-time token. Only the hash is stored. */
  token: string;
}

const SITE = 'https://nandomoreira.dev';

/** Asks the subscriber to prove they own the address before anything else is sent. */
const NewsletterConfirm = ({ email, token }: Props) => {
  const href = `${SITE}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
  return (
    <EmailLayout
      preview="Confirme seu e-mail para receber as novidades"
      eyebrow="confirme seu e-mail"
      title="Falta um clique para assinar"
      footer={`Pedido de ${email} via /api/subscribe`}
    >
      <Paragraph>
        Para receber os próximos artigos em {email}, abra o <InlineLink href={href}>link de confirmação</InlineLink>.
        Ele vale por 7 dias e só funciona uma vez.
      </Paragraph>
    </EmailLayout>
  );
};

NewsletterConfirm.PreviewProps = {
  email: 'fulano@exemplo.com',
  token: 'preview-token',
} satisfies Props;

export default NewsletterConfirm;
