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
  { slug: 'atelie-eh-pique', name: 'Ateliê éh Pique', kind: 'Loja virtual', alt: 'Página inicial da loja Ateliê éh Pique, de artes digitais para máquinas de corte' },
  { slug: 'coletivo-inclusao', name: 'Coletivo Inclusão', kind: 'Site institucional', alt: 'Página inicial do Coletivo Inclusão, organização social' },
  { slug: 'canto-das-emocoes', name: 'Canto das Emoções', kind: 'Site de produto educativo', alt: 'Página do Canto das Emoções, recurso lúdico para educação infantil' },
  { slug: 'puruna-investimentos', name: 'Puruna Investimentos', kind: 'Site institucional', alt: 'Página inicial da Puruna Investimentos' },
  { slug: 'gatman-corp', name: 'Gatman Corp', kind: 'Site corporativo', alt: 'Página inicial do site corporativo da Gatman Corp' },
  { slug: 'agenda-rio-2030', name: 'Agenda Rio 2030', kind: 'Portal', alt: 'Portal da Agenda Rio 2030, da Casa Fluminense' },
  { slug: 'php-pr', name: 'PHP PR', kind: 'Portal de comunidade', alt: 'Portal da comunidade PHP do Paraná, com artigos e avisos' },
  { slug: 'ogg-digital', name: 'OGG Digital', kind: 'Site de agência', alt: 'Página inicial da agência OGG Digital' },
  { slug: 'onedev-studio', name: 'OneDev Studio', kind: 'Site de estúdio', alt: 'Página inicial do estúdio OneDev, com planos de hospedagem e serviços' },
  { slug: 'ferramentas-digital', name: 'Ferramentas Digital', kind: 'Catálogo online', alt: 'Catálogo de ferramentas de marketing digital, organizado por categoria' },
];
