import type { CatalogCollection } from './groups';

/** Closing call to action on the listing pages (REQ-007); copy approved in the spec. */
export const CLOSING_CTA: Record<CatalogCollection, { eyebrow: string; title: string; text: string; button: string }> = {
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
};
