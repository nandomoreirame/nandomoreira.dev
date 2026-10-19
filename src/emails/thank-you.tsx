/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { Text } from 'react-email';
import { InlineLink, Paragraph } from './_shared/blocks';
import { EmailLayout } from './_shared/layout';
import { EMAIL_COLORS as c, EMAIL_FONTS as f, EMAIL_SPACE as s } from './_shared/tokens';

type Kind = 'briefing' | 'cv' | 'newsletter';

interface Props {
  /** What the visitor typed as name; only a safe first name is used. */
  name: string | null;
  /** A message sent through a form, a CV download with details left, or a newsletter signup. */
  kind: Kind;
}

/**
 * The first name, or null. This mail goes to an address nobody verified, so
 * anything echoed from the form could turn it into a relay for someone else's
 * text: only a short run of letters gets through, never a link or a number.
 */
export const greetingName = (name: string | null): string | null => {
  const first = name?.trim().split(/\s+/)[0] ?? '';
  if (!/^\p{L}[\p{L}'-]{0,29}$/u.test(first)) return null;
  return first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1);
};

const SITE = 'https://nandomoreira.dev';

const AUTOMATIC = 'Esta é uma mensagem automática, não precisa responder.';

const COPY: Record<Kind, { eyebrow: string; title: string; preview: string; footer: string }> = {
  briefing: {
    eyebrow: 'mensagem recebida',
    title: 'Obrigado pelo contato',
    preview: 'Sua mensagem chegou, e eu retorno em breve.',
    footer: `${AUTOMATIC} Você recebeu este e-mail porque deixou seu contato em nandomoreira.dev. Ele não entra em nenhuma lista, e não vou mandar newsletter sem você pedir.`,
  },
  cv: {
    eyebrow: 'currículo baixado',
    title: 'Obrigado por baixar meu currículo',
    preview: 'Recebi seus dados, e eu retorno em breve se fizer sentido.',
    footer: `${AUTOMATIC} Você recebeu este e-mail porque deixou seu contato em nandomoreira.dev. Ele não entra em nenhuma lista, e não vou mandar newsletter sem você pedir.`,
  },
  newsletter: {
    eyebrow: 'assinatura confirmada',
    title: 'Obrigado por assinar',
    preview: 'Os próximos artigos chegam neste e-mail.',
    // The signup does put the address on a list: the newsletter, and only it.
    footer: `${AUTOMATIC} Você recebeu este e-mail porque assinou as novidades em nandomoreira.dev. Seu e-mail fica só na lista de artigos e não é usado para mais nada.`,
  },
};

/**
 * Sent to the visitor after a form, so they know the message arrived. It
 * repeats nothing they wrote and offers no button: the reply comes from me,
 * in person, through the contact they left.
 */
const ThankYou = ({ name, kind }: Props) => {
  const first = greetingName(name);
  const copy = COPY[kind];

  return (
    <EmailLayout
      preview={copy.preview}
      eyebrow={copy.eyebrow}
      title={first ? `${copy.title}, ${first}` : copy.title}
      footer={copy.footer}
    >
      {kind === 'newsletter' ? (
        <>
          <Paragraph>
            Sua assinatura está confirmada. Os próximos artigos chegam neste e-mail quando saírem no ar, sem marketing e
            sem nada além dos textos.
          </Paragraph>
          <Paragraph>
            Enquanto isso, o que já publiquei está no <InlineLink href={`${SITE}/posts`}>blog</InlineLink>. Se mudar de
            ideia, é só pedir para sair pela página de <InlineLink href={`${SITE}/contato`}>contato</InlineLink>.
          </Paragraph>
        </>
      ) : kind === 'briefing' ? (
        <>
          <Paragraph>Sua mensagem chegou e já está comigo. Vou ler com calma e retorno em breve.</Paragraph>
          <Paragraph>
            Enquanto isso, se quiser conhecer mais do meu trabalho, os cases estão no{' '}
            <InlineLink href={`${SITE}/portfolio`}>portfólio</InlineLink>, e o que ando escrevendo, no{' '}
            <InlineLink href={`${SITE}/posts`}>blog</InlineLink>.
          </Paragraph>
        </>
      ) : (
        <>
          <Paragraph>
            Recebi seus dados junto com o download. Se fizer sentido para o que você procura, retorno em breve para
            conversarmos.
          </Paragraph>
          <Paragraph>
            Se quiser adiantar a conversa, me conte o contexto da vaga ou do projeto pela página de{' '}
            <InlineLink href={`${SITE}/contato`}>contato</InlineLink>.
          </Paragraph>
        </>
      )}
      <Text style={{ margin: `${s.sm}px 0 0`, fontSize: 16, lineHeight: 1.625, color: c.foreground }}>Um abraço,</Text>
      <Text style={{ margin: 0, fontFamily: f.serif, fontSize: 20, color: c.foreground }}>Fernando Moreira</Text>
    </EmailLayout>
  );
};

ThankYou.PreviewProps = { name: 'Ana Souza', kind: 'briefing' } satisfies Props;

export default ThankYou;
