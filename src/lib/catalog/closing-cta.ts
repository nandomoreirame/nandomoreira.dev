import type { CatalogCollection } from './groups';

/** Pages that close with a call to action in the page's own context. */
export type ClosingCtaPage = CatalogCollection | 'sobre' | 'mcp' | 'now';

interface ClosingCtaCopy {
  eyebrow: string;
  title: string;
  text: string;
  button: string;
  /** Sends to the sales landing instead of /contato. */
  toServices?: boolean;
}

/** The card /portfolio and /sobre share, with the sales landing's own promise. */
const SERVICES_CTA: ClosingCtaCopy = {
  eyebrow: 'Próximo passo',
  title: 'Precisa de um site, loja ou sistema?',
  text: 'Cada serviço diz o que é, para quem serve e o que você recebe. Escolha pelo que você quer resolver e peça seu orçamento.',
  button: 'Ver os serviços',
  toServices: true,
};

/** Closing call to action (REQ-007 for the listings); copy approved in the spec, the rest per page. */
export const CLOSING_CTA: Record<ClosingCtaPage, ClosingCtaCopy> = {
  portfolio: SERVICES_CTA,
  lab: {
    eyebrow: 'Próximo passo',
    title: 'Tem um problema parecido no seu fluxo?',
    text: 'Boa parte destas ferramentas nasceu de uma dor minha. Se a sua é parecida, me conta.',
    button: 'Vamos conversar',
  },
  sobre: SERVICES_CTA,
  mcp: {
    eyebrow: 'Próximo passo',
    title: 'Quer o seu produto conversando com agentes de IA?',
    text: 'Montei este servidor MCP para o meu site. Se você quer algo assim no seu produto, me conta o que ele precisa expor.',
    button: 'Vamos conversar',
  },
  now: {
    eyebrow: 'Próximo passo',
    title: 'Algo daqui tem a ver com você?',
    text: 'Se o que estou fazendo agora conversa com um projeto seu, me chama.',
    button: 'Vamos conversar',
  },
};
