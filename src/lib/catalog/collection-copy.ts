import type { Locale } from '../i18n/locale';
import type { CatalogCollection } from './groups';

type CollectionCopy = { title: string; description: string; metaDescription: string };

/**
 * Header and meta copy of /portfolio and /lab, shared with their AI view so the
 * two never drift. Describe what each collection holds, never by language:
 * the lab mixes Rust, Python, TypeScript and QML.
 */
export const COLLECTION_COPY: Record<CatalogCollection, CollectionCopy> = {
  portfolio: {
    title: 'Produtos e trabalho de cliente, do problema à produção',
    description:
      'Produtos SaaS próprios com IA e trabalho entregue para empresas e organizações: plataformas de dados com IA, loja virtual e sites institucionais. Cada case mostra o problema, as decisões técnicas e o resultado.',
    metaDescription:
      'Produtos SaaS com IA e trabalho de cliente, do problema à produção: plataformas de dados, loja virtual e sites institucionais.',
  },
  lab: {
    title: 'Coçando as minhas próprias coceiras',
    description:
      'Ferramentas open source que eu fiz para resolver problemas meus: apps e plugins para o meu desktop Linux, CLIs, automações e ferramental para agentes de IA, boa parte escrita junto com os próprios agentes.',
    metaDescription:
      'Ferramentas open source que fiz para mim: ferramental para agentes de IA, CLIs, automações e apps e plugins para o desktop Linux.',
  },
};

const COLLECTION_COPY_EN: Record<CatalogCollection, CollectionCopy> = {
  portfolio: {
    title: 'Products and client work, from the problem to production',
    description:
      'Own SaaS products with AI and client work shipped for companies and organizations: AI data platforms, an online store and institutional sites. Each case shows the problem, the technical decisions and the outcome.',
    metaDescription:
      'SaaS products with AI and client work, from the problem to production: data platforms, an online store and institutional sites.',
  },
  lab: {
    title: 'Scratching my own itches',
    description:
      'Open source tools I built to scratch my own itches: apps and plugins for my Linux desktop, CLIs, automations and tooling for AI agents, much of it written alongside the agents themselves.',
    metaDescription:
      'Open source tools I built for myself: tooling for AI agents, CLIs, automations and apps and plugins for the Linux desktop.',
  },
};

/** Header and meta copy of a collection listing, by locale. */
export const collectionCopy = (collection: CatalogCollection, locale: Locale = 'pt-BR'): CollectionCopy =>
  (locale === 'en' ? COLLECTION_COPY_EN : COLLECTION_COPY)[collection];
