import type { Locale } from '../i18n/locale';

/**
 * Social proof carried over from the previous sales page
 * (svelte-nandomoreira.dev, /sites-profissionais-lojas-virtuais-blogs-aplicativos-web).
 * The testimonials are verbatim; the gallery is client work only, without years,
 * because the old dates were not reliable, and without links: it is a sample,
 * not a list of live sites (sales-landing, REQ-036 to REQ-038).
 */
export interface Testimonial {
  name: string;
  company: string;
  text: string;
}

export interface PastWork {
  slug: string;
  name: string;
  kind: string;
  alt: string;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    name: 'Yara Santiago',
    company: 'Ateliê éh Pique',
    text: 'Meu site para vendas de arquivos digitais ficou lindo! Fernando arrasou no designer! Moderno e funcional, facilitou a navegação dos clientes e maior conversão de vendas! A entrega foi muito rápida, um projeto bem estruturado e funcional!',
  },
  {
    name: 'Edson Luiz',
    company: 'Contador',
    text: 'Trabalho com o Fernando há pelo menos 15 anos. Nesse tempo, ele já desenvolveu vários projetos pra mim e para minhas empresas, e sempre entregou tudo com uma qualidade acima da expectativa.',
  },
];

export const MORE_WORK: readonly PastWork[] = [
  {
    slug: 'atelie-eh-pique',
    name: 'Ateliê éh Pique',
    kind: 'Loja virtual',
    alt: 'Página inicial da loja Ateliê éh Pique, de artes digitais para máquinas de corte',
  },
  {
    slug: 'coletivo-inclusao',
    name: 'Coletivo Inclusão',
    kind: 'Site institucional',
    alt: 'Página inicial do Coletivo Inclusão, organização social',
  },
  {
    slug: 'canto-das-emocoes',
    name: 'Canto das Emoções',
    kind: 'Site de produto educativo',
    alt: 'Página do Canto das Emoções, recurso lúdico para educação infantil',
  },
  {
    slug: 'puruna-investimentos',
    name: 'Puruna Investimentos',
    kind: 'Site institucional',
    alt: 'Página inicial da Puruna Investimentos',
  },
  {
    slug: 'agenda-rio-2030',
    name: 'Agenda Rio 2030',
    kind: 'Portal',
    alt: 'Portal da Agenda Rio 2030, da Casa Fluminense',
  },
  {
    slug: 'php-pr',
    name: 'PHP PR',
    kind: 'Portal de comunidade',
    alt: 'Portal da comunidade PHP do Paraná, com artigos e avisos',
  },
  { slug: 'ogg-digital', name: 'OGG Digital', kind: 'Site de agência', alt: 'Página inicial da agência OGG Digital' },
  {
    slug: 'onedev-studio',
    name: 'OneDev Studio',
    kind: 'Site de estúdio',
    alt: 'Página inicial do estúdio OneDev, com planos de hospedagem e serviços',
  },
  {
    slug: 'ferramentas-digital',
    name: 'Ferramentas Digital',
    kind: 'Catálogo online',
    alt: 'Catálogo de ferramentas de marketing digital, organizado por categoria',
  },
];

/**
 * A short, verbatim slice of a testimonial shown right below the services, so
 * the first claim on the page has proof beside it; the full quote stays in the
 * testimonials section.
 */
export const SERVICES_QUOTE = {
  excerpt: 'Moderno e funcional, facilitou a navegação dos clientes e maior conversão de vendas!',
  name: TESTIMONIALS[0]!.name,
  company: TESTIMONIALS[0]!.company,
} as const;

const TESTIMONIALS_EN: readonly Testimonial[] = [
  {
    name: 'Yara Santiago (translated from Portuguese)',
    company: 'Ateliê éh Pique',
    text: 'My digital file store turned out beautiful! Fernando nailed the design! Modern and functional, it made navigation easier for customers and increased sales conversions! Delivery was very fast, a well-structured and functional project!',
  },
  {
    name: 'Edson Luiz (translated from Portuguese)',
    company: 'Accountant',
    text: 'I have worked with Fernando for at least 15 years. In that time, he has developed several projects for me and my companies, always delivering quality above expectations.',
  },
];

export const testimonialsFor = (locale: Locale = 'pt-BR'): readonly Testimonial[] =>
  locale === 'en' ? TESTIMONIALS_EN : TESTIMONIALS;

const MORE_WORK_EN: readonly PastWork[] = MORE_WORK.map((work, index) => ({
  ...work,
  kind: [
    'Online store',
    'Website',
    'Educational product website',
    'Website',
    'Portal',
    'Community portal',
    'Agency website',
    'Studio website',
    'Online catalog',
  ][index]!,
  alt: [
    'Ateliê éh Pique online store home page, with digital art for cutting machines',
    'Home page of Coletivo Inclusão, a social organization',
    'Canto das Emoções page, an early childhood education resource',
    'Puruna Investimentos home page',
    'Agenda Rio 2030 portal, by Casa Fluminense',
    'PHP PR community portal, with articles and notices',
    'OGG Digital agency home page',
    'OneDev studio home page, with hosting plans and services',
    'Digital marketing tools catalog, organized by category',
  ][index]!,
}));
export const moreWorkFor = (locale: Locale = 'pt-BR'): readonly PastWork[] =>
  locale === 'en' ? MORE_WORK_EN : MORE_WORK;
export const servicesQuoteFor = (locale: Locale = 'pt-BR') =>
  locale === 'en'
    ? {
        excerpt: 'Modern and functional, it made navigation easier for customers and increased sales conversions!',
        name: TESTIMONIALS_EN[0]!.name,
        company: TESTIMONIALS_EN[0]!.company,
      }
    : SERVICES_QUOTE;
