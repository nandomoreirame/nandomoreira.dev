/**
 * English sheet for /en/resume, word for word the English full-stack CV (the
 * markdown its PDF is built from). Same shape as the Portuguese RESUME. No
 * em/en dashes. Avoid bare "do" (ptLeftovers marker).
 */

import type { ResumeEarlier, ResumeJob, ResumeProject } from './resume';

export const summaryOfEn = (years: number): string =>
  `Senior Fullstack Software Engineer with ${years}+ years of experience, from the database to the interface: APIs, integrations, cloud and front-end in TypeScript, React, Node.js, NestJS and Python, with SaaS platforms in my history. At Liquid AI, I built end to end the internal product that became the source of truth for the operation, and cut the preparation of datasets for more than 20 clients from about 5 days to under 30 minutes. I write unit tests before the code, with Clean Architecture and DDD. Before that: Itaú Unibanco, Skyone, Risknow.ai and Pipefy.`;

export const RESUME_EN = {
  name: 'Fernando Moreira Costa',
  title: 'Senior Fullstack Software Engineer | React, Node.js, NestJS, TypeScript',
  place: 'São Paulo, SP, Brazil',
  links: [
    { label: 'nandomoreira.dev', href: 'https://nandomoreira.dev' },
    { label: 'linkedin.com/in/nandomoreirame', href: 'https://www.linkedin.com/in/nandomoreirame' },
    { label: 'github.com/nandomoreirame', href: 'https://github.com/nandomoreirame' },
  ],
  stack: [
    {
      area: 'Proficient',
      items:
        'TypeScript, JavaScript, React, Next.js, Node.js, Hono, REST APIs, GraphQL, SQL, MySQL, Firebase, unit testing, Git, Clean Architecture, DDD, Angular, Vue.js and Nuxt, HTML, CSS, Tailwind CSS, PHP (Symfony, Laravel), WordPress, Docker, CI/CD, AWS (Lambda, Step Functions, S3, Glue), GCP (Cloud Run, BigQuery), TDD, Vitest, Playwright, microfrontends, design systems, ETL, Claude Code, generative AI',
    },
    {
      area: 'Intermediate',
      items:
        'NestJS, PostgreSQL, Python (FastAPI, Polars, pandas, Pydantic, pytest), DynamoDB, AWS CloudWatch, Rust (ratatui, tokio), Electron, LLMs (Gemini), MCP servers',
    },
    { area: 'Basic', items: 'Java (Spring Boot)' },
  ],
  experience: [
    {
      company: 'Liquid AI',
      role: 'AI Engineer • Full Cycle Developer',
      period: '11/2025 - 09/2026',
      place: 'São Paulo, hybrid',
      highlights: [
        'Developed Play Manager end to end (React 19, Hono, Firebase), an internal product that became the source of truth for the operation, with role-based access control, a processing queue, per-stage deadlines and LLM-generated insights (Gemini).',
        'Cut the preparation of each client dataset from about 5 days to under 30 minutes, automating data extraction and pre-normalization through an API.',
        'Built the pre-normalization API in Python (FastAPI, Polars, Cloud Run) with DDD and Clean Architecture (hexagonal), serving more than 20 clients and protected by more than 4,800 test cases.',
        'Integrated the Sienge and UAU ERPs with AWS Lambda, Step Functions, Cloud Run and BigQuery.',
        'Took two production integration pipelines from 0% to 84% and 92% coverage, with 920 tests and a CI coverage gate that blocks deploys.',
        'Built an AI-assisted development framework on top of Claude Code, with mandatory TDD and lint, type, test and build gates across TypeScript, Python and Rust repositories.',
      ],
      keyTech:
        'TypeScript, React 19, Hono, Firebase, Python, FastAPI, Polars, SQL, AWS (Lambda, Step Functions, S3, Glue), GCP (Cloud Run, BigQuery), Gemini, Claude Code',
    },
    {
      company: 'Norte Marketing',
      role: 'Technology Manager',
      period: '08/2025 - 10/2025',
      place: 'São Paulo',
      highlights: [
        "Owned solution architecture and the technical design of a digital agency's deliveries, with an adapted Scrum in Jira, Bitbucket and Confluence.",
        'Automated versioning and deployment in Bitbucket Pipelines integrated with AWS, with linters and tests as quality gates, plus per-pull-request preview environments.',
        'Refactored and documented legacy e-commerce systems in Magento 2 and Venia PWA with AI-assisted development (Cursor).',
      ],
      keyTech: 'AWS, Bitbucket Pipelines, Magento 2, Venia PWA, React, PHP, Jira',
    },
    {
      company: 'Skyone Solutions',
      role: 'Senior Frontend Developer',
      period: '12/2024 - 04/2025',
      place: 'São Paulo',
      highlights: [
        'Architected React applications for digital products used daily by thousands of users.',
        'Built a design system and component library, standardizing the interface across products.',
        'Optimized Core Web Vitals, technical SEO and accessibility; ran code reviews and mentored junior and mid-level developers.',
      ],
      keyTech: 'React, TypeScript, design systems, Core Web Vitals',
    },
    {
      company: 'Itaú Unibanco',
      role: 'Senior Software Engineer',
      period: '04/2022 - 06/2024',
      place: 'São Paulo',
      highlights: [
        "Developed microfrontends in Angular and TypeScript with Node.js for the bank's public pages, in the Martech (Marketing and Technology) team.",
        'Implemented personalization and A/B testing with VWO and Salesforce Interaction Studio for unauthenticated visitors.',
        'Delivered accessibility and performance on very high-traffic journeys with regulatory requirements.',
      ],
      keyTech: 'Angular, TypeScript, Node.js, microfrontends, VWO, Salesforce Interaction Studio',
    },
    {
      company: 'Risknow.ai',
      role: 'Senior Fullstack Developer',
      period: '06/2020 - 11/2021',
      place: 'Curitiba, PR',
      highlights: [
        'Built dashboards in Vue.js, Nuxt and TypeScript for real estate credit data analysis.',
        'Integrated APIs and microservices in Python and Node.js, mapping data from multiple sources.',
        'Built interfaces integrated with WhatsApp bots.',
      ],
      keyTech: 'Vue.js, Nuxt, TypeScript, Python, Node.js, REST APIs',
    },
  ] satisfies ResumeJob[],
  earlier: [
    {
      role: 'Senior Frontend Developer',
      where: 'MedPrev | 09/2019 - 02/2020',
      summary: 'Vue.js and Nuxt.js with REST and GraphQL.',
    },
    {
      role: 'Senior Frontend Developer',
      where: 'Trackmob | 03/2019 - 08/2019',
      summary: 'Vue.js dashboards on Ruby on Rails for the SaaS platform NGOs used to follow campaigns in real time.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Nossa Causa | 08/2018 - 03/2019',
      summary: 'accessible WordPress websites.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Workshop Agência & Escola | 10/2017 - 07/2018',
      summary: 'WordPress, UX and analytics.',
    },
    {
      role: 'Senior Frontend Developer and UX Designer',
      where: 'LojasKD Móveis | 09/2016 - 10/2017',
      summary: 'Symfony e-commerce with Node.js, Python and PHP microservices; internal products in Vue.js.',
    },
    {
      role: 'Front-end Developer',
      where: 'Pipefy | 01/2016 - 08/2016',
      summary: 'new SaaS platform interface on Ruby on Rails.',
    },
    {
      role: 'Front-end Developer',
      where: 'MalaPronta.com | 01/2015 - 09/2015',
      summary: 'layout modernized to responsive.',
    },
    {
      role: 'Web Developer',
      where: 'Curitiba agencies | 11/2010 - 05/2014',
      summary: 'PHP, MySQL, WordPress and Magento.',
    },
  ] satisfies ResumeEarlier[],
  projects: [
    {
      lead: 'nandomoreira.dev',
      text: 'Astro site with its own MCP server that lets AI agents query my projects and resume; more than 1,400 automated tests.',
    },
    {
      lead: 'Forja',
      text: 'Electron and React desktop client that brings Claude Code, Codex and Gemini into a single interface (forja.web.app).',
    },
    {
      lead: 'Noctalia Shell plugins (Daybar, AI Bar, Gistbar)',
      text: 'Luau and QML, with the logic covered by automated tests.',
    },
    {
      text: '122 public GitHub repositories since 2012, including Rust CLIs published on crates.io (konfi, hypr-switcher).',
    },
  ] satisfies ResumeProject[],
  education: [
    { title: 'Associate degree in Internet Systems', where: 'Universidade Positivo', period: '2015 - 2016' },
    {
      title: 'Technical diploma in Computer Science',
      where: 'Colégio Estadual do Paraná (CEP)',
      period: '2010 - 2011',
    },
  ],
  languages: 'Portuguese (native), English (professional)',
} as const;
