import type { CatalogCollection } from './groups';

/** Pages that close with a call to /contato in the page's own context. */
export type ClosingCtaPage = CatalogCollection | 'sobre' | 'mcp' | 'now';

/** Closing call to action (REQ-007 for the listings); copy approved in the spec, the rest per page. */
export const CLOSING_CTA: Record<ClosingCtaPage, { eyebrow: string; title: string; text: string; button: string }> = {
  portfolio: {
    eyebrow: 'Próximo passo',
    title: 'Precisa de algo assim no seu produto?',
    text: 'Conte o problema e o prazo. Respondo com o que dá para fazer e o que não dá.',
    button: 'Vamos conversar',
  },
  lab: {
    eyebrow: 'Próximo passo',
    title: 'Tem um problema parecido no seu fluxo?',
    text: 'Boa parte destas ferramentas nasceu de uma dor minha. Se a sua é parecida, me conta.',
    button: 'Vamos conversar',
  },
  sobre: {
    eyebrow: 'Próximo passo',
    title: 'Quer trabalhar comigo?',
    text: 'Projeto, vaga ou uma ideia ainda solta: me conta o contexto e eu respondo.',
    button: 'Vamos conversar',
  },
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
