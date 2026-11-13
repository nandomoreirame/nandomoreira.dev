/**
 * Interface copy in pt-BR, the source language (D5). en.ts must have the same
 * shape: a missing key fails `npm run check` and tests/i18n/messages.test.ts.
 */
export const ptBR = {
  layout: {
    skipToContent: 'Pular para o conteúdo',
    rssTitle: 'Blog de Fernando Moreira',
  },
  language: {
    /** Name of each language written in itself, for the switcher. */
    names: { 'pt-BR': 'Português', en: 'English' },
    switchTo: 'Ler em português',
    suggestion: 'Esta página também existe em português.',
    suggestionLink: 'Ler em português',
    dismiss: 'Dispensar',
  },
  nav: {
    blog: 'Blog',
    portfolio: 'Portfólio',
    lab: 'Lab',
    setup: 'Setup',
    now: 'Agora',
    about: 'Sobre',
    mcp: 'MCP',
    contact: 'Contato',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    mainNavigation: 'Navegação principal',
    menu: 'Menu',
    /** Fifth aria-label in SiteNav; the plan named four, this keeps the mobile landmark distinct. */
    mobileNavigation: 'Menu principal (mobile)',
  },
  posts: {
    readingTime: (minutes: number) => `${minutes} min de leitura`,
    draft: 'Rascunho',
    quickPreview: 'Preview rápido',
    readFull: 'Ler artigo completo',
    keyPoints: 'TL;DR // PONTOS-CHAVE',
    summarizeWithAi: 'Resumir com IA:',
    opensInNewTab: (label: string) => `${label}, abre em nova aba`,
    opensInNewTabHint: 'abre em nova aba',
  },
  home: {
    hero: {
      aboutCta: 'Saiba mais sobre mim',
    },
    services: {
      title: 'O que eu faço por você',
      description: 'Cada frente com um case que a comprova.',
      salesLead: 'Para o seu negócio: site, loja virtual ou sistema, explicados sem jargão.',
      salesLink: 'Ver os serviços',
      proofLink: 'Ver o case que comprova',
    },
    trajectory: {
      title: 'Trajetória e números',
    },
    latestPosts: {
      title: 'POSTS RECENTES',
      seeAll: 'Ver todos os posts no blog',
    },
    about: {
      title: 'Sobre',
      readMore: 'Ler mais sobre mim',
    },
    contact: {
      title: 'Contato',
      description: 'Escreva direto, ou use o formulário em /contato.',
      email: 'E-mail',
    },
    collection: {
      seeAll: 'Ver todos',
      portfolio: {
        title: 'Portfólio',
        description:
          'Produtos SaaS próprios com IA e trabalho entregue para empresas e organizações: plataformas de dados com IA, loja virtual e sites institucionais. Cada case mostra o problema, as decisões técnicas e o resultado.',
        empty: 'Nenhum case de portfólio publicado ainda.',
      },
      lab: {
        title: 'Laboratório',
        description:
          'Ferramentas open source que eu fiz para resolver problemas meus: apps e plugins para o meu desktop Linux, CLIs, automações e ferramental para agentes de IA, boa parte escrita junto com os próprios agentes.',
        empty: 'Nenhum experimento publicado ainda.',
      },
    },
    agentBrief: {
      heading: 'Me contrate pelo seu agent.',
      body: 'Cole este brief no ChatGPT, no Claude ou no seu próprio harness. Qualquer agent consegue ler e começar a conversa por você, pela API.',
      contractBefore: 'O contrato completo está em',
      copyLabel: 'Copiar o brief AGENTS.md',
    },
  },

  footer: {
    privacy: 'Privacidade',
    channels: 'Canais',
    links: 'Links',
    rss: 'RSS',
    agents: 'AGENTS.md',
    opensInNewTab: (label: string) => `${label}, abre em nova aba`,
    versionLabel: (version: string) => `Versão ${version}: os lançamentos desta versão`,
    pageView: 'Visão da página',
  },
  about: {
    title: 'Sobre',
    pagePath: '~/sobre',
    buildingSince: (year: number) => `Construindo software desde ${year}`,
    contactCta: 'Entrar em contato',
    resumeCta: 'Baixar currículo (PDF)',
    results: {
      title: 'Resultados',
      description:
        'O que mudou, medido nas operações em que trabalhei. O que é aproximado vem dito no contexto.',
    },
    help: {
      title: 'Como posso ajudar',
      description: 'Três frentes, cada uma com um case que a comprova.',
    },
    experience: {
      title: 'Experiência',
    },
    education: {
      title: 'Formação',
      line: (studyType: string, area: string, institution: string) =>
        `${studyType} em ${area}, ${institution}`,
    },
    stack: 'Stack',
    portraitAlt: (name: string) =>
      `Ilustração de ${name}: retrato de óculos e barba sobre fundo escuro com linhas âmbar`,
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'A página solicitada não existe.',
    heading: 'Página não encontrada',
    body: 'O endereço acessado não corresponde a nenhuma página deste site.',
    copyCurl: 'Copiar o comando curl',
    backHome: 'Voltar para a home',
    explorePortfolio: 'Explorar portfólio',
    viewLab: 'Ver laboratório',
  },
  contactPage: {
    title: 'Contato',
    description:
      'Fale comigo sobre um projeto, uma vaga ou uma proposta. Conte o que você precisa e eu respondo com o que dá para fazer e o que não dá.',
    heading: 'Vamos conversar',
    lead: 'Conte o que você precisa. Respondo com o que dá para fazer e o que não dá.',
    salesLead: 'Tem um negócio e precisa de um site ou sistema? Veja a página feita para você.',
    salesLink: 'Ver os serviços',
    formHeading: 'Formulário de contato',
    requiredHint: 'Os campos com * são obrigatórios.',
    sentTitle: 'Mensagem enviada',
    sentAriaLabel: 'Mensagem enviada',
    sendAnother: 'Enviar outra mensagem',
    name: 'Nome',
    email: 'E-mail',
    company: 'Empresa',
    budget: 'Orçamento',
    budgetPreferNot: 'Prefiro não dizer agora',
    interestLegend: 'Tenho interesse em',
    message: 'Mensagem',
    messagePlaceholder:
      'O que você está construindo, como é o sucesso para você e para quando precisa?',
    honeypot: 'Não preencha este campo',
    submit: 'Enviar mensagem',
    preferEmail: 'Prefiro e-mail',
    preferChat: 'Prefere conversar por mensagem?',
    whatsapp: 'Conversar no WhatsApp',
    aboutService: 'Sobre:',
    mcpHeading: 'MCP',
    mcpBody: 'Conecte seu cliente MCP ao servidor deste site.',
    mcpCopyLabel: 'Copiar a URL do servidor MCP',
    mcpHowTo: 'Como conectar',
  },
  chrome: {
    backToTop: 'Voltar ao topo',
    backToTopShort: 'Topo',
    /** Aria-label of a live-bar link that opens in a new tab. */
    opensInNewTab: (label: string) => `${label}. Abre em nova aba`,
  },
  resume: {
    title: 'Currículo',
    description: (name: string, role: string, years: number) =>
      `${name}, ${role}. ${years} anos de carreira, de dados a interface.`,
    summary: 'Resumo',
    stack: 'Stack técnica',
    experience: 'Experiência profissional',
    earlier: 'Experiência anterior',
    projects: 'Projetos e open source',
    education: 'Formação e idiomas',
    languages: 'Idiomas',
    downloadHint: 'Prefere levar o currículo? Baixe a versão em PDF.',
    downloadCta: 'Baixar currículo (PDF)',
    close: 'Fechar',
    sentTitle: 'Pronto, é só baixar',
    sentDescription: 'Obrigado. O que você deixou chegou até mim.',
    dialogTitle: 'Antes de baixar',
    dialogLead:
      'Se quiser, deixe seu nome, empresa e e-mail. É só para eu saber quem está baixando meu currículo e poder retornar o contato, caso faça sentido. Todos são opcionais: dá para pular e baixar direto.',
    alertInvalid:
      'Algo no que você digitou não passou: confira o e-mail (e o nome ou a empresa, se estiverem muito longos), ou pule e baixe direto.',
    alertLimit: 'Muitas tentativas seguidas. Espere alguns minutos, ou pule e baixe direto.',
    name: 'Nome',
    company: 'Empresa',
    email: 'E-mail',
    emailPlaceholder: 'voce@empresa.com',
    honeypot: 'Não preencha este campo',
    submit: 'Enviar e baixar',
    skip: 'Pular e baixar',
    privacyBefore: 'O que você deixar fica guardado por 12 meses e não vai para nenhuma lista. Os detalhes estão na ',
    privacyLink: 'política de privacidade',
    privacyAfter: '.',
  },
} as const;
