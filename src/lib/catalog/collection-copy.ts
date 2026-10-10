import type { CatalogCollection } from './groups';

/**
 * Header and meta copy of /portfolio and /lab, shared with their AI view so the
 * two never drift. Describe what each collection holds, never by language:
 * the lab mixes Rust, Python, TypeScript and QML.
 */
export const COLLECTION_COPY: Record<
  CatalogCollection,
  { title: string; description: string; metaDescription: string }
> = {
  portfolio: {
    title: 'Trabalho de cliente, do problema à produção',
    description:
      'Plataformas de dados com IA, loja virtual e sites institucionais, entregues para empresas e organizações. Cada case mostra o problema, as decisões técnicas e o resultado.',
    metaDescription: 'Trabalho entregue: produtos com IA e cases profissionais.',
  },
  lab: {
    title: 'O que construo por conta própria',
    description:
      'Ferramental para agentes de IA, produtos SaaS, CLIs, automações e apps de desktop Linux. Cada case mostra o problema que me levou a construir, as decisões e onde o projeto está hoje.',
    metaDescription: 'Ferramental de IA, produtos SaaS, CLIs, automações e apps de desktop Linux.',
  },
};
