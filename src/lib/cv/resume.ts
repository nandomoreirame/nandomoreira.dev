/**
 * The content of /curriculo and /en/resume, word for word the full-stack variant
 * of the CV (~/dev/career, the markdown each PDF is built from; since
 * 2026-11-14). Human layer: pt-BR at the root, English under /en. No e-mail here
 * on purpose: reaching for the PDF goes through the dialog, which asks who is
 * downloading.
 */

import type { Locale } from '../i18n/locale';
import { RESUME_EN, summaryOfEn } from './resume-en';

/** The career count starts in 2011 and is always computed, never typed. */
export const CAREER_START_YEAR = 2011;

export const careerYears = (now: Date): number => now.getUTCFullYear() - CAREER_START_YEAR;

export interface ResumeJob {
  company: string;
  role: string;
  period: string;
  place: string;
  highlights: string[];
  /** The "Tecnologias-chave" line under the bullets, as in the PDF. */
  keyTech?: string;
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
export const summaryOf = (years: number, locale: Locale = 'pt-BR'): string =>
  locale === 'en'
    ? summaryOfEn(years)
    : `Senior Fullstack Software Engineer com mais de ${years} anos de experiência, do banco de dados à interface: APIs, integrações, cloud e front-end em TypeScript, React, Node.js, NestJS e Python, com plataformas SaaS no histórico. Na Liquid AI, construí de ponta a ponta o produto interno que virou a fonte da verdade da operação e reduzi de cerca de 5 dias para até 30 minutos o preparo das bases de dados de mais de 20 clientes. Escrevo teste unitário antes do código, com Clean Architecture e DDD. Antes, Itaú Unibanco, Skyone, Risknow.ai e Pipefy.`;

/** Sheet content for the given locale; each language has its own PDF. */
export const resumeFor = (locale: Locale = 'pt-BR') => (locale === 'en' ? RESUME_EN : RESUME);

export const RESUME = {
  name: 'Fernando Moreira Costa',
  title: 'Senior Fullstack Software Engineer | React, Node.js, NestJS, TypeScript',
  place: 'São Paulo, SP, Brasil',
  links: [
    { label: 'nandomoreira.dev', href: 'https://nandomoreira.dev' },
    { label: 'linkedin.com/in/nandomoreirame', href: 'https://www.linkedin.com/in/nandomoreirame' },
    { label: 'github.com/nandomoreirame', href: 'https://github.com/nandomoreirame' },
  ],
  stack: [
    {
      area: 'Proficiente',
      items:
        'TypeScript, JavaScript, React, Next.js, Node.js, Hono, APIs REST, GraphQL, SQL, MySQL, Firebase, testes unitários, Git, Clean Architecture, DDD, Angular, Vue.js e Nuxt, HTML, CSS, Tailwind CSS, PHP (Symfony, Laravel), WordPress, Docker, CI/CD, AWS (Lambda, Step Functions, S3, Glue), GCP (Cloud Run, BigQuery), TDD, Vitest, Playwright, microfrontends, design systems, ETL, Claude Code, IA generativa',
    },
    {
      area: 'Intermediário',
      items:
        'NestJS, PostgreSQL, Python (FastAPI, Polars, pandas, Pydantic, pytest), DynamoDB, AWS CloudWatch, Rust (ratatui, tokio), Electron, LLM (Gemini), servidores MCP',
    },
    { area: 'Básico', items: 'Java (Spring Boot)' },
  ],
  experience: [
    {
      company: 'Liquid AI',
      role: 'AI Engineer • Full Cycle Developer',
      period: '11/2025 - 09/2026',
      place: 'São Paulo, híbrido',
      highlights: [
        'Desenvolvi de ponta a ponta o Play Manager (React 19, Hono, Firebase), produto interno que virou a fonte da verdade da operação, com controle de acesso por papel, fila de processamento, prazo por etapa e insights gerados por LLM (Gemini).',
        'Reduzi de cerca de 5 dias para até 30 minutos o preparo de cada base de cliente, automatizando por API a extração e a pré-normalização dos dados.',
        'Construí a API de pré-normalização em Python (FastAPI, Polars, Cloud Run) com DDD e Clean Architecture (hexagonal), atendendo mais de 20 clientes e protegida por mais de 4.800 casos de teste.',
        'Integrei os ERPs Sienge e UAU com AWS Lambda, Step Functions, Cloud Run e BigQuery.',
        'Levei dois pipelines de integração em produção de 0% para 84% e 92% de cobertura, com 920 testes e gate de cobertura no CI bloqueando deploy.',
        'Construí um framework de desenvolvimento assistido por IA sobre Claude Code, com TDD obrigatório e portões de lint, tipos, testes e build em repositórios TypeScript, Python e Rust.',
      ],
      keyTech:
        'TypeScript, React 19, Hono, Firebase, Python, FastAPI, Polars, SQL, AWS (Lambda, Step Functions, S3, Glue), GCP (Cloud Run, BigQuery), Gemini, Claude Code',
    },
    {
      company: 'Norte Marketing',
      role: 'Gerente de Tecnologia',
      period: '08/2025 - 10/2025',
      place: 'São Paulo',
      highlights: [
        'Respondi pela arquitetura das soluções e pelo desenho técnico das entregas de uma agência digital, com Scrum adaptado em Jira, Bitbucket e Confluence.',
        'Automatizei versionamento e deploy em Bitbucket Pipelines integrados à AWS, com linters e testes como portão de qualidade, e preview environments por pull request.',
        'Refatorei e documentei sistemas legados de e-commerce em Magento 2 e Venia PWA com desenvolvimento assistido por IA (Cursor).',
      ],
      keyTech: 'AWS, Bitbucket Pipelines, Magento 2, Venia PWA, React, PHP, Jira',
    },
    {
      company: 'Skyone Solutions',
      role: 'Senior Frontend Developer',
      period: '12/2024 - 04/2025',
      place: 'São Paulo',
      highlights: [
        'Arquitetei aplicações React para produtos digitais de uso diário por milhares de usuários.',
        'Construí design system e biblioteca de componentes, padronizando a interface entre produtos.',
        'Otimizei Core Web Vitals, SEO técnico e acessibilidade; conduzi code review e mentoria de pessoas desenvolvedoras júnior e pleno.',
      ],
      keyTech: 'React, TypeScript, design systems, Core Web Vitals',
    },
    {
      company: 'Itaú Unibanco',
      role: 'Engenheiro de Software Sênior',
      period: '04/2022 - 06/2024',
      place: 'São Paulo',
      highlights: [
        'Desenvolvi microfrontends em Angular e TypeScript com Node.js para as páginas públicas do banco, no time de Martech (Marketing e Tecnologia).',
        'Implementei personalização e testes A/B com VWO e Salesforce Interaction Studio para o público não autenticado.',
        'Entreguei acessibilidade e performance em jornadas de altíssimo volume de acesso e com exigência regulatória.',
      ],
      keyTech: 'Angular, TypeScript, Node.js, microfrontends, VWO, Salesforce Interaction Studio',
    },
    {
      company: 'Risknow.ai',
      role: 'Senior Fullstack Developer',
      period: '06/2020 - 11/2021',
      place: 'Curitiba, PR',
      highlights: [
        'Construí dashboards em Vue.js, Nuxt e TypeScript para análise de dados de crédito imobiliário.',
        'Integrei APIs e microserviços em Python e Node.js, mapeando dados de múltiplas fontes.',
        'Construí interfaces integradas a bots de WhatsApp.',
      ],
      keyTech: 'Vue.js, Nuxt, TypeScript, Python, Node.js, APIs REST',
    },
  ] satisfies ResumeJob[],
  earlier: [
    {
      role: 'Senior Frontend Developer',
      where: 'MedPrev | 09/2019 - 02/2020',
      summary: 'Vue.js e Nuxt.js com REST e GraphQL.',
    },
    {
      role: 'Senior Frontend Developer',
      where: 'Trackmob | 03/2019 - 08/2019',
      summary:
        'dashboards em Vue.js sobre Ruby on Rails na plataforma SaaS usada por ONGs para acompanhar campanhas em tempo real.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Nossa Causa | 08/2018 - 03/2019',
      summary: 'sites acessíveis em WordPress.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Workshop Agência & Escola | 10/2017 - 07/2018',
      summary: 'WordPress, UX e análise.',
    },
    {
      role: 'Senior Frontend Developer e UX Designer',
      where: 'LojasKD Móveis | 09/2016 - 10/2017',
      summary: 'e-commerce em Symfony com microserviços em Node.js, Python e PHP; produtos internos em Vue.js.',
    },
    {
      role: 'Front-end Developer',
      where: 'Pipefy | 01/2016 - 08/2016',
      summary: 'nova interface da plataforma SaaS em Ruby on Rails.',
    },
    {
      role: 'Front-end Developer',
      where: 'MalaPronta.com | 01/2015 - 09/2015',
      summary: 'layout modernizado para responsivo.',
    },
    {
      role: 'Desenvolvedor web',
      where: 'agências de Curitiba | 11/2010 - 05/2014',
      summary: 'PHP, MySQL, WordPress e Magento.',
    },
  ] satisfies ResumeEarlier[],
  projects: [
    {
      lead: 'nandomoreira.dev',
      text: 'site em Astro com servidor MCP próprio, que deixa agentes de IA consultarem projetos e currículo; mais de 1.400 testes automatizados.',
    },
    {
      lead: 'Forja',
      text: 'cliente desktop em Electron e React que reúne Claude Code, Codex e Gemini numa só interface (forja.web.app).',
    },
    {
      lead: 'Plugins para o Noctalia Shell (Daybar, AI Bar, Gistbar)',
      text: 'Luau e QML, com a lógica coberta por testes automatizados.',
    },
    {
      text: '122 repositórios públicos no GitHub desde 2012, incluindo CLIs em Rust publicadas no crates.io (konfi, hypr-switcher).',
    },
  ] satisfies ResumeProject[],
  education: [
    { title: 'Tecnólogo em Sistemas para Internet', where: 'Universidade Positivo', period: '2015 - 2016' },
    { title: 'Técnico em Informática', where: 'Colégio Estadual do Paraná (CEP)', period: '2010 - 2011' },
  ],
  languages: 'Português (nativo), Inglês (profissional)',
} as const;
