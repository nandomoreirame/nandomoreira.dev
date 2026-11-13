import type { Locale } from '../i18n/locale';
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

const SERVICES_CTA_EN: ClosingCtaCopy = {
  eyebrow: 'Next step',
  title: 'Need a site, store or system?',
  text: 'Each service says what it is, who it is for and what you get. Pick by what you want to solve and ask for your quote.',
  button: 'See the services',
  toServices: true,
};

const CLOSING_CTA_EN: Record<ClosingCtaPage, ClosingCtaCopy> = {
  portfolio: SERVICES_CTA_EN,
  lab: {
    eyebrow: 'Next step',
    title: 'Got a similar problem in your flow?',
    text: 'Most of these tools came from a pain of my own. If yours is similar, tell me.',
    button: "Let's talk",
  },
  sobre: SERVICES_CTA_EN,
  mcp: {
    eyebrow: 'Next step',
    title: 'Want your product talking to AI agents?',
    text: 'I built this MCP server for my site. If you want something like it in your product, tell me what it needs to expose.',
    button: "Let's talk",
  },
  now: {
    eyebrow: 'Next step',
    title: 'Does something here relate to you?',
    text: 'If what I am doing now speaks to a project of yours, reach out.',
    button: "Let's talk",
  },
};

/** Closing CTA copy for a page, by locale. */
export const closingCta = (page: ClosingCtaPage, locale: Locale = 'pt-BR'): ClosingCtaCopy =>
  (locale === 'en' ? CLOSING_CTA_EN : CLOSING_CTA)[page];
