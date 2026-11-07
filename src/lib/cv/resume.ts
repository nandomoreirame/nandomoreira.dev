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
        'Reduzi de cerca de cinco dias para até 30 minutos o intervalo entre receber uma base e entregá-la pré-normalizada na pipeline, substituindo a execução manual caso a caso por extração e pré-normalização automatizadas por API e assistidas por IA.',
        'Concebi e construí o Play Manager, produto interno que se tornou a fonte da verdade da operação: fase, responsável, prazo e saúde de cada base passaram a ficar visíveis em um só lugar, para o time e para a liderança.',
        'Embuti o prazo de entrega como regra do produto, com orçamento de tempo por etapa e classificação automática entre no prazo, em risco e atrasado, o que antecipa o atraso em vez de constatá-lo depois do vencimento.',
        'Cobri de testes dois pipelines que rodavam em produção sem nenhum teste automatizado: 920 casos escritos, cobertura de 0% para 84% e 92%, com gate no CI a cada pull request.',
        'Sustentei a engine de pré-normalização com uma suíte de mais de 4.800 casos entre unitários, integração, regressão e paridade, contra quebra silenciosa de dados em produção.',
        'Construí o framework interno de desenvolvimento assistido por IA sobre Claude Code: 106 automações reutilizáveis, 34 comandos, 19 agentes especializados, hooks em sete pontos do ciclo de vida e memória persistente em quatro camadas.',
        'Tornei o TDD obrigatório por ferramenta, e não por disciplina: nenhuma tarefa avança sem teste falhando antes do código, e cada entrega atravessa portões de lint, tipos, testes e build adaptados à linguagem do repositório.',
      ],
    },
    {
      company: 'Norte Marketing',
      role: 'Gerente de Tecnologia',
      period: 'ago/2025 - out/2025',
      place: 'São Paulo',
      highlights: [
        'Liderei a área de tecnologia como principal referência técnica da equipe, respondendo por arquitetura de soluções, desenho técnico, documentação e gestão das entregas.',
        'Automatizei versionamento e deploys em pipelines integrados à AWS, com linters e testes como portão de qualidade, e implementei preview environments por Pull Request.',
        'Apliquei desenvolvimento assistido por IA para documentar e refatorar sistemas legados em Magento 2 e Venia PWA.',
      ],
    },
    {
      company: 'Skyone Solutions',
      role: 'Senior Frontend Developer',
      period: 'dez/2024 - abr/2025',
      place: 'São Paulo',
      highlights: [
        'Arquitetei e implementei aplicações React para produtos digitais de uso diário por milhares de usuários.',
        'Construí design system e biblioteca de componentes reutilizáveis, reduzindo retrabalho entre squads.',
        'Otimizei performance web com foco em Core Web Vitals, SEO técnico e acessibilidade; conduzi code review e mentorei pessoas desenvolvedoras júnior e pleno.',
      ],
    },
    {
      company: 'Itaú Unibanco',
      role: 'Engenheiro de Software Sênior',
      period: 'abr/2022 - jun/2024',
      place: 'São Paulo',
      highlights: [
        'Desenvolvi produtos em arquitetura de microfrontends para as páginas não logadas do banco, em Angular e TypeScript com Node.js.',
        'Implementei personalização e testes A/B com VWO e Salesforce Interaction Studio para o público não autenticado.',
        'Elevei acessibilidade, performance e clareza das jornadas públicas, em ambiente de altíssimo volume de acesso e forte exigência regulatória.',
      ],
    },
    {
      company: 'Risknow.ai',
      role: 'Senior Fullstack Developer',
      period: 'jun/2020 - nov/2021',
      place: 'Curitiba, PR',
      highlights: [
        'Desenvolvi dashboards interativos para inteligência de dados aplicada à jornada de crédito imobiliário.',
        'Integrei APIs e microserviços que transformavam dado bruto de múltiplas fontes em insight acionável para o cliente.',
        'Construí interfaces integradas a bots de WhatsApp, encurtando o ciclo de avaliação e financiamento de imóveis.',
      ],
    },
  ] satisfies ResumeJob[],
  earlier: [
    {
      role: 'Senior Frontend Developer',
      where: 'MedPrev (set/2019 - fev/2020) e Trackmob (mar/2019 - ago/2019), Curitiba',
      summary:
        'Interfaces reativas em Vue.js e Nuxt.js consumindo REST e GraphQL; dashboards sobre Ruby on Rails para ONGs acompanharem o impacto de suas campanhas em tempo real.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Nossa Causa (ago/2018 - mar/2019) e Workshop Agência & Escola (out/2017 - jul/2018), Curitiba',
      summary:
        'Sites responsivos e acessíveis em WordPress para ONGs e clientes institucionais, também como UX e analista.',
    },
    {
      role: 'Senior Frontend Developer e UX Designer',
      where: 'LojasKD Móveis (set/2016 - out/2017), Pinhais, PR',
      summary:
        'E-commerce em Symfony consumindo microserviços em Node.js, Python e PHP; performance com Gulp.js e Webpack; pesquisa com usuários e testes A/B.',
    },
    {
      role: 'Pleno Front-end Developer',
      where: 'Pipefy (jan/2016 - ago/2016) e MalaPronta.com (jan/2015 - set/2015), Curitiba',
      summary:
        'Iniciei a nova interface da plataforma de gestão de processos da Pipefy; na MalaPronta, modernizei um layout de cinco anos para responsivo.',
    },
    {
      role: 'Desenvolvedor web',
      where: 'Agência WX, IBPT, Salsa:Mobion, Totalize e Agência CGDW (nov/2010 - mai/2014), Curitiba',
      summary:
        'Início de carreira em PHP, MySQL, WordPress e Magento: sites institucionais, lojas virtuais, CMSs proprietários e um page builder drag-and-drop.',
    },
  ] satisfies ResumeEarlier[],
  projects: [
    {
      name: 'forja',
      text: 'cliente desktop em Electron e React para Claude Code, Gemini, Codex e Cursor, com renderização visual rica para CLIs de IA. Beta público.',
    },
    {
      name: 'bragstack.app',
      text: 'PWA em Next.js 16 para desenvolvedores registrarem conquistas no formato STAR com apoio de IA.',
    },
    {
      name: 'konfi e hypr-switcher',
      text: 'gerenciador TUI de dotfiles e alternador visual de janelas para Wayland, em Rust, publicados no crates.io.',
    },
    { name: 'GitHub', text: '122 repositórios públicos e 476 seguidores, contribuindo desde 2012.' },
  ],
  education: [
    { title: 'Tecnólogo em Sistemas para Internet', where: 'Universidade Positivo', period: '2015 - 2016' },
    { title: 'Técnico em Informática', where: 'Colégio Estadual do Paraná (CEP)', period: '2010 - 2011' },
  ],
  languages: 'Português (nativo), Inglês (profissional)',
} as const;
