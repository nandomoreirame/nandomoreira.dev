/**
 * The content of /curriculo, taken from the maintained AI Engineer variant of the CV
 * (the same one the PDF is built from). Human layer, so pt-BR. No e-mail here
 * on purpose: reaching for the PDF goes through the dialog on /curriculo, which asks who is
 * downloading.
 */

/** The career count starts in 2011 and is always computed, never typed. */
export const CAREER_START_YEAR = 2011;

export const careerYears = (now: Date): number => now.getUTCFullYear() - CAREER_START_YEAR;

export interface ResumeJob {
  company: string;
  role: string;
  period: string;
  place: string;
  /** One line under the title, for the jobs that need a frame. */
  intro?: string;
  highlights: string[];
}

export interface ResumeEarlier {
  role: string;
  where: string;
  summary: string;
}

export interface ResumeProject {
  /** Bold lead-in; absent for the closing GitHub line. */
  lead?: string;
  text: string;
}

/** The opening paragraph; the career count is the only part that moves. */
export const summaryOf = (years: number): string =>
  `Engenheiro de software com ${years} anos de carreira, atuando de dados a interface. Na Liquid AI, construí e operei a esteira de dados de financiamento imobiliário de mais de 20 incorporadoras, onde reduzi de cinco dias para até 30 minutos o tempo de preparar uma base e entregá-la na pipeline, automatizando com IA o que antes era manual. Sustentei essa operação com um framework próprio de desenvolvimento assistido por IA, com guard-rails de segurança e portões de qualidade obrigatórios. Antes disso, seis anos em produtos de alta escala: Itaú Unibanco, Pipefy e Skyone. Mantenedor open source desde 2012.`;

export const RESUME = {
  name: 'Fernando Moreira Costa',
  title: 'AI Engineer • Full Cycle Developer',
  place: 'São Paulo, SP, Brasil',
  links: [
    { label: 'nandomoreira.dev', href: 'https://nandomoreira.dev' },
    { label: 'linkedin.com/in/nandomoreirame', href: 'https://www.linkedin.com/in/nandomoreirame' },
    { label: 'github.com/nandomoreirame', href: 'https://github.com/nandomoreirame' },
  ],
  stack: [
    {
      area: 'IA aplicada',
      items:
        'Claude Code (skills, hooks, subagentes, MCP), orquestração multi-agente, harness de agentes, Gemini, Codex, Cursor',
    },
    {
      area: 'Backend',
      items:
        'Python 3.12 (FastAPI, Polars, pandas, Pydantic v2, pytest, boto3), TypeScript (Hono, Node.js, Bun), PHP (Symfony, Laravel)',
    },
    {
      area: 'Frontend',
      items:
        'React 19, Next.js 16 (App Router), Angular, Vue.js e Nuxt, TypeScript, Tailwind 4, shadcn/ui, Electron, microfrontends, design systems',
    },
    {
      area: 'Dados',
      items: 'ETL em produção, BigQuery, S3, DynamoDB, Firebase, normalização e validação de dados, encoding pt-BR',
    },
    {
      area: 'Cloud',
      items:
        'AWS (Lambda, Step Functions, Glue, Batch, S3, CloudWatch), GCP (Cloud Run, Cloud Functions, BigQuery, Secret Manager)',
    },
    { area: 'Sistemas', items: 'Rust (tokio, ratatui), Go (Fyne), Linux' },
    {
      area: 'Engenharia',
      items:
        'TDD, DDD, arquitetura hexagonal, Feature-Sliced Design, CI/CD, Docker, Git Flow, testes E2E com Playwright, Core Web Vitals, acessibilidade',
    },
  ],
  experience: [
    {
      company: 'Liquid AI',
      role: 'AI Engineer • Full Cycle Developer',
      period: 'nov/2025 - set/2026',
      place: 'São Paulo, híbrido',
      intro:
        'Respondi pela esteira de dados que transforma as bases das incorporadoras clientes em indicadores dentro dos produtos da Liquid, e pelo framework de desenvolvimento assistido por IA que sustentava a entrega de software.',
      highlights: [
        'Reduzi de cerca de cinco dias para até 30 minutos o intervalo entre receber uma base e entregá-la pré-normalizada na pipeline, substituindo a execução manual caso a caso por extração e pré-normalização automatizadas por API e assistidas por IA. Foi o maior ganho da operação desde que assumi a área.',
        'Concebi e construí o Play Manager, produto interno que se tornou a fonte da verdade da operação e substituiu o controle que vivia em ferramenta de terceiros: fase, responsável, prazo e saúde de cada base passaram a ficar visíveis em um só lugar, para o time e para a liderança.',
        'Levei a automação para dentro do produto: extração e pré-normalização passaram a ser disparadas pela própria interface, com fila, idempotência e enfileiramento automático da esteira, eliminando a execução manual a cada base.',
        'Embuti o prazo de entrega como regra do produto, com orçamento de tempo por etapa e classificação automática entre no prazo, em risco e atrasado, o que antecipa o atraso em vez de constatá-lo depois do vencimento.',
        'Conduzi a virada da operação para o novo produto sem exigir reaprendizado do time, replicando os padrões de interação que ele já dominava; a carteira inteira migrou sem divergência bloqueante.',
        'Cobri de testes dois pipelines de extração e integração que rodavam em produção sem nenhum teste automatizado: 920 casos escritos, levando a cobertura de 0% para 84% e 92%, com gate de cobertura no CI a cada pull request e bloqueio de deploy quando a suíte falha.',
        'Sustentei a engine de pré-normalização com uma suíte de mais de 4.800 casos de teste, entre unitários, integração, regressão e paridade, que protegia cada mudança de transformação de dados contra quebra silenciosa em produção.',
        'Construí o framework interno de desenvolvimento assistido por IA sobre Claude Code que padronizava a entrega: 106 automações reutilizáveis, 34 comandos que expõem os fluxos de pesquisa, plano, implementação, revisão e versionamento, 19 agentes especializados e hooks em sete pontos do ciclo de vida da sessão, com memória persistente em quatro camadas e um mecanismo que converte cada erro corrigido em regra, para não repeti-lo.',
        'Blindei esse fluxo com guard-rails executáveis em vez de recomendações: hooks que bloqueiam em tempo real a edição de arquivos de credencial, validação do padrão de commit antes da gravação e 21 regras invioláveis, cobrindo OWASP, os riscos específicos de LLM, proibição de versionamento autônomo por agente e consentimento humano explícito antes de ação destrutiva.',
        'Tornei o TDD obrigatório por ferramenta, e não por disciplina: nenhuma tarefa avança sem teste falhando antes do código, e cada entrega atravessa uma escada de portões que se adapta à linguagem do repositório, com ESLint, Prettier, tsc, Vitest e build em TypeScript, Ruff, mypy e pytest em Python, e clippy, fmt e cargo em Rust, além de cobertura mínima ao fechar a feature.',
        'Orquestrei três CLIs de IA com papéis separados, sob a regra de que quem escreve não julga: uma implementa cada tarefa, outra revisa como segundo olhar de um modelo diferente, e o orquestrador valida contra os portões e é o único que versiona, assumindo a etapa quando alguma delas fica indisponível.',
      ],
    },
    {
      company: 'Norte Marketing',
      role: 'Gerente de Tecnologia',
      period: 'ago/2025 - out/2025',
      place: 'São Paulo',
      highlights: [
        'Liderei a área de tecnologia como principal referência técnica da equipe, respondendo pela arquitetura de soluções, desenho técnico, documentação e gestão das entregas.',
        'Implantei cultura ágil com Scrum adaptado, integrando Jira, Bitbucket e Confluence para dar fluxo e previsibilidade às entregas do time.',
        'Automatizei versionamento e deploys em pipelines integrados à AWS, com linters e testes automatizados como portão de qualidade.',
        'Implementei preview environments com links temporários por Pull Request, encurtando o ciclo de validação do QA e elevando a qualidade das entregas.',
        'Apliquei desenvolvimento assistido por IA (Cursor) para documentar e refatorar sistemas legados em Magento 2 e Venia PWA.',
      ],
    },
    {
      company: 'Skyone Solutions',
      role: 'Senior Frontend Developer',
      period: 'dez/2024 - abr/2025',
      place: 'São Paulo',
      highlights: [
        'Arquitetei e implementei aplicações React para produtos digitais de uso diário por milhares de usuários.',
        'Construí design system e biblioteca de componentes reutilizáveis, padronizando a interface entre produtos e reduzindo retrabalho entre squads.',
        'Otimizei performance web com foco em Core Web Vitals, SEO técnico e acessibilidade.',
        'Conduzi code review, defini padrões de desenvolvimento e mentorei pessoas desenvolvedoras júnior e pleno.',
      ],
    },
    {
      company: 'Itaú Unibanco',
      role: 'Engenheiro de Software Sênior',
      period: 'abr/2022 - jun/2024',
      place: 'São Paulo',
      highlights: [
        'Desenvolvi produtos em arquitetura de microfrontends para as páginas não logadas do banco, em Angular e TypeScript com Node.js, atuando na interseção entre Marketing e Tecnologia.',
        'Implementei personalização e testes A/B com VWO e Salesforce Interaction Studio, entregando experiências segmentadas para o público não autenticado.',
        'Elevei acessibilidade, performance e clareza das jornadas públicas do banco, em ambiente de altíssimo volume de acesso e forte exigência regulatória.',
        'Atuei na concepção das soluções junto aos times de negócio, traduzindo demanda de marketing em arquitetura frontend sustentável.',
      ],
    },
    {
      company: 'Risknow.ai',
      role: 'Senior Fullstack Developer',
      period: 'jun/2020 - nov/2021',
      place: 'Curitiba, PR',
      highlights: [
        'Desenvolvi dashboards interativos para inteligência de dados aplicada à jornada de crédito imobiliário.',
        'Processei e mapeei dados de múltiplas fontes, integrando APIs e microserviços que transformavam dado bruto em insight acionável para o cliente.',
        'Construí interfaces integradas a bots de WhatsApp, encurtando o ciclo de avaliação e financiamento de imóveis.',
      ],
    },
  ] satisfies ResumeJob[],
  earlier: [
    {
      role: 'Senior Frontend Developer',
      where: 'MedPrev (set/2019 - fev/2020) e Trackmob (mar/2019 - ago/2019), Curitiba',
      summary:
        'Interfaces reativas em Vue.js e Nuxt.js consumindo REST e GraphQL; dashboards em Vue.js sobre Ruby on Rails para ONGs acompanharem o impacto de suas campanhas em tempo real.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Nossa Causa (ago/2018 - mar/2019) e Workshop Agência & Escola (out/2017 - jul/2018), Curitiba',
      summary:
        'Sites responsivos e acessíveis em WordPress para ONGs e clientes institucionais, atuando também como UX e analista no planejamento e desenho das soluções.',
    },
    {
      role: 'Senior Frontend Developer e UX Designer',
      where: 'LojasKD Móveis (set/2016 - out/2017), Pinhais, PR',
      summary:
        'E-commerce em Symfony consumindo microserviços em Node.js, Python e PHP. Otimização de performance com Gulp.js e Webpack, produtos internos em Vue.js, pesquisa com usuários e testes A/B após promoção para UX Designer.',
    },
    {
      role: 'Pleno Front-end Developer',
      where: 'Pipefy (jan/2016 - ago/2016) e MalaPronta.com (jan/2015 - set/2015), Curitiba',
      summary:
        'Iniciei a nova interface da plataforma de gestão de processos da Pipefy (Ruby on Rails, Bootstrap 4, SASS); na MalaPronta, modernizei um layout de cinco anos para responsivo e reduzi a carga do servidor com minificação e limpeza de CSS e JavaScript.',
    },
    {
      role: 'Desenvolvedor web',
      where: 'Agência WX, IBPT, Salsa:Mobion, Totalize e Agência CGDW (nov/2010 - mai/2014), Curitiba',
      summary:
        'Início de carreira em PHP, MySQL, WordPress e Magento: sites institucionais, lojas virtuais, CMSs proprietários e um page builder drag-and-drop para WordPress, no modelo do Elementor.',
    },
  ] satisfies ResumeEarlier[],
  projects: [
    {
      lead: 'forja (github.com/nandomoreirame)',
      text: 'cliente desktop em Electron e React para Claude Code, Gemini, Codex e Cursor, com renderização visual rica para CLIs de IA. Beta público, 11 estrelas.',
    },
    {
      lead: 'bragstack.app',
      text: 'PWA em Next.js 16 para desenvolvedores registrarem conquistas no formato STAR com apoio de IA.',
    },
    {
      lead: 'konfi e hypr-switcher (Rust)',
      text: 'gerenciador TUI de dotfiles e alternador visual de janelas para Wayland, publicados no crates.io.',
    },
    {
      text: '122 repositórios públicos e 476 seguidores no GitHub, contribuindo desde 2012.',
    },
  ] satisfies ResumeProject[],
  education: [
    { title: 'Tecnólogo em Sistemas para Internet', where: 'Universidade Positivo', period: '2015 - 2016' },
    { title: 'Técnico em Informática', where: 'Colégio Estadual do Paraná (CEP)', period: '2010 - 2011' },
  ],
  languages: 'Português (nativo), Inglês (profissional)',
} as const;
