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
    title: 'Produtos e trabalho de cliente, do problema à produção',
    description:
      'Produtos SaaS próprios com IA e trabalho entregue para empresas e organizações: plataformas de dados com IA, loja virtual e sites institucionais. Cada case mostra o problema, as decisões técnicas e o resultado.',
    metaDescription: 'Produtos SaaS com IA e trabalho de cliente, do problema à produção.',
  },
  lab: {
    title: 'Coçando as minhas próprias coceiras',
    description:
      'Ferramentas open source que eu fiz para resolver problemas meus: apps e plugins para o meu desktop Linux, CLIs, automações e ferramental para agentes de IA, boa parte escrita junto com os próprios agentes.',
    metaDescription: 'Ferramental de IA, CLIs, automações e apps de desktop Linux.',
  },
};
