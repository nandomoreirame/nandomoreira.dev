/**
 * English sheet for /en/resume. Same shape as the Portuguese RESUME; the PDF
 * download stays Portuguese (labeled as such). US English, first person, no
 * em/en dashes, no number changes. Avoid bare "do" (ptLeftovers marker).
 */

import type { ResumeEarlier, ResumeJob, ResumeProject } from './resume';

export const summaryOfEn = (years: number): string =>
  `Software engineer with ${years} years of career, from data to interface. At Liquid AI, I built and operated the mortgage data pipeline for more than 20 real estate developers, where I cut the time to prepare a dataset and deliver it into the pipeline from five days down to as little as 30 minutes, automating with AI what used to be manual. I sustained that operation with my own AI-assisted development framework, with security guardrails and mandatory quality gates. Before that, six years on high-scale products: Itaú Unibanco, Pipefy and Skyone. Open source maintainer since 2012.`;

export const RESUME_EN = {
  name: 'Fernando Moreira Costa',
  title: 'AI Engineer • Full Cycle Developer',
  place: 'São Paulo, SP, Brazil',
  links: [
    { label: 'nandomoreira.dev', href: 'https://nandomoreira.dev' },
    { label: 'linkedin.com/in/nandomoreirame', href: 'https://www.linkedin.com/in/nandomoreirame' },
    { label: 'github.com/nandomoreirame', href: 'https://github.com/nandomoreirame' },
  ],
  stack: [
    {
      area: 'Applied AI',
      items:
        'Claude Code (skills, hooks, subagents, MCP), multi-agent orchestration, agent harness, Gemini, Codex, Cursor',
    },
    {
      area: 'Backend',
      items:
        'Python 3.12 (FastAPI, Polars, pandas, Pydantic v2, pytest, boto3), TypeScript (Hono, Node.js, Bun), PHP (Symfony, Laravel)',
    },
    {
      area: 'Frontend',
      items:
        'React 19, Next.js 16 (App Router), Angular, Vue.js and Nuxt, TypeScript, Tailwind 4, shadcn/ui, Electron, microfrontends, design systems',
    },
    {
      area: 'Data',
      items: 'ETL in production, BigQuery, S3, DynamoDB, Firebase, data normalization and validation, pt-BR encoding',
    },
    {
      area: 'Cloud',
      items:
        'AWS (Lambda, Step Functions, Glue, Batch, S3, CloudWatch), GCP (Cloud Run, Cloud Functions, BigQuery, Secret Manager)',
    },
    { area: 'Systems', items: 'Rust (tokio, ratatui), Go (Fyne), Linux' },
    {
      area: 'Engineering',
      items:
        'TDD, DDD, hexagonal architecture, Feature-Sliced Design, CI/CD, Docker, Git Flow, E2E tests with Playwright, Core Web Vitals, accessibility',
    },
  ],
  experience: [
    {
      company: 'Liquid AI',
      role: 'AI Engineer • Full Cycle Developer',
      period: 'Nov/2025 - Sep/2026',
      place: 'São Paulo, hybrid',
      intro:
        "I owned the data pipeline that turns client real estate developers' datasets into metrics inside Liquid's products, and the AI-assisted development framework that sustained software delivery.",
      highlights: [
        'Cut the interval between receiving a dataset and delivering it pre-normalized into the pipeline from about five days down to as little as 30 minutes, replacing case-by-case manual work with API-driven extraction and pre-normalization assisted by AI. It was the largest gain in the operation since I took over the area.',
        'Designed and built Play Manager, an internal product that became the source of truth for the operation and replaced control that lived in a third-party tool: phase, owner, deadline and health of every dataset became visible in one place, for the team and for leadership.',
        'Brought automation into the product: extraction and pre-normalization started firing from the interface itself, with a queue, idempotency and automatic pipeline enqueueing, removing the manual run for every dataset.',
        'Embedded the delivery deadline as a product rule, with a time budget per stage and automatic classification into on time, at risk and late, which anticipates delay instead of noticing it after the due date.',
        'Led the cutover to the new product without forcing the team to relearn, by mirroring the interaction patterns they already knew; the full portfolio migrated without a blocking divergence.',
        'Covered with tests two extraction and integration pipelines that shipped to production with no automated tests: 920 cases written, taking coverage from 0% to 84% and 92%, with a coverage gate in CI on every pull request and deploys blocked when the suite fails.',
        'Sustained the pre-normalization engine with a suite of more than 4,800 test cases, across unit, integration, regression and parity, which protected every data transformation change against silent breakage in production.',
        'Built the internal AI-assisted development framework on Claude Code that standardized delivery: 106 reusable automations, 34 commands that expose research, plan, implementation, review and versioning flows, 19 specialized agents and hooks at seven points in the session lifecycle, with persistent memory across four layers and a mechanism that turns every corrected error into a rule, so it is not repeated.',
        'Hardened that flow with executable guardrails instead of recommendations: hooks that block credential-file edits in real time, commit-pattern validation before the write, and 21 inviolable rules covering OWASP, LLM-specific risks, a ban on autonomous versioning by an agent, and explicit human consent before a destructive action.',
        'Made TDD mandatory by tooling, not by discipline: no task advances without a failing test before the code, and every delivery crosses a ladder of gates that adapts to the repository language, with ESLint, Prettier, tsc, Vitest and build in TypeScript, Ruff, mypy and pytest in Python, and clippy, fmt and cargo in Rust, plus a minimum coverage floor when closing the feature.',
        'Orchestrated three AI CLIs with separated roles, under the rule that whoever writes does not judge: one implements each task, another reviews as a second look from a different model, and the orchestrator validates against the gates and is the only one who versions, taking over a step when one of them is unavailable.',
      ],
    },
    {
      company: 'Norte Marketing',
      role: 'Technology Manager',
      period: 'Aug/2025 - Oct/2025',
      place: 'São Paulo',
      highlights: [
        "Led the technology area as the team's main technical reference, owning solution architecture, technical design, documentation and delivery management.",
        'Rolled out an adapted Scrum agile culture, integrating Jira, Bitbucket and Confluence to give flow and predictability to the team deliveries.',
        'Automated versioning and deploys in pipelines integrated with AWS, with linters and automated tests as a quality gate.',
        'Implemented preview environments with temporary links per Pull Request, shortening the QA validation cycle and raising delivery quality.',
        'Applied AI-assisted development (Cursor) to document and refactor legacy systems in Magento 2 and Venia PWA.',
      ],
    },
    {
      company: 'Skyone Solutions',
      role: 'Senior Frontend Developer',
      period: 'Dec/2024 - Apr/2025',
      place: 'São Paulo',
      highlights: [
        'Architected and shipped React applications for digital products used daily by thousands of users.',
        'Built a design system and reusable component library, standardizing the interface across products and cutting rework across squads.',
        'Optimized web performance with a focus on Core Web Vitals, technical SEO and accessibility.',
        'Led code review, defined development standards and mentored junior and mid-level developers.',
      ],
    },
    {
      company: 'Itaú Unibanco',
      role: 'Senior Software Engineer',
      period: 'Apr/2022 - Jun/2024',
      place: 'São Paulo',
      highlights: [
        "Built products in a microfrontend architecture for the bank's unauthenticated pages, in Angular and TypeScript with Node.js, working at the intersection of Marketing and Technology.",
        'Implemented personalization and A/B testing with VWO and Salesforce Interaction Studio, delivering segmented experiences for the unauthenticated audience.',
        "Raised accessibility, performance and clarity of the bank's public journeys, in an environment of very high traffic and strong regulatory demand.",
        'Took part in solution design alongside the business teams, turning marketing demand into sustainable frontend architecture.',
      ],
    },
    {
      company: 'Risknow.ai',
      role: 'Senior Fullstack Developer',
      period: 'Jun/2020 - Nov/2021',
      place: 'Curitiba, PR',
      highlights: [
        'Built interactive dashboards for data intelligence applied to the mortgage credit journey.',
        'Processed and mapped data from multiple sources, integrating APIs and microservices that turned raw data into actionable insight for the client.',
        'Built interfaces integrated with WhatsApp bots, shortening the property appraisal and financing cycle.',
      ],
    },
  ] satisfies ResumeJob[],
  earlier: [
    {
      role: 'Senior Frontend Developer',
      where: 'MedPrev (Sep/2019 - Feb/2020) and Trackmob (Mar/2019 - Aug/2019), Curitiba',
      summary:
        'Reactive interfaces in Vue.js and Nuxt.js consuming REST and GraphQL; Vue.js dashboards on Ruby on Rails for NGOs to track campaign impact in real time.',
    },
    {
      role: 'Senior Web Developer',
      where: 'Nossa Causa (Aug/2018 - Mar/2019) and Workshop Agência & Escola (Oct/2017 - Jul/2018), Curitiba',
      summary:
        'Responsive and accessible WordPress sites for NGOs and institutional clients, also acting as UX and analyst in planning and designing the solutions.',
    },
    {
      role: 'Senior Frontend Developer and UX Designer',
      where: 'LojasKD Móveis (Sep/2016 - Oct/2017), Pinhais, PR',
      summary:
        'Symfony e-commerce consuming microservices in Node.js, Python and PHP. Performance work with Gulp.js and Webpack, internal products in Vue.js, user research and A/B testing after the promotion to UX Designer.',
    },
    {
      role: 'Mid-level Front-end Developer',
      where: 'Pipefy (Jan/2016 - Aug/2016) and MalaPronta.com (Jan/2015 - Sep/2015), Curitiba',
      summary:
        "I started the new interface of Pipefy's process management platform (Ruby on Rails, Bootstrap 4, SASS); at MalaPronta, I modernized a five-year-old layout for responsive and cut server load by minifying and cleaning CSS and JavaScript.",
    },
    {
      role: 'Web Developer',
      where: 'Agência WX, IBPT, Salsa:Mobion, Totalize and Agência CGDW (Nov/2010 - May/2014), Curitiba',
      summary:
        'Career start in PHP, MySQL, WordPress and Magento: institutional sites, online stores, proprietary CMSs and a drag-and-drop page builder for WordPress, in the Elementor model.',
    },
  ] satisfies ResumeEarlier[],
  projects: [
    {
      lead: 'forja (github.com/nandomoreirame)',
      text: 'desktop client in Electron and React for Claude Code, Gemini, Codex and Cursor, with rich visual rendering for AI CLIs. Public beta, 11 stars.',
    },
    {
      lead: 'bragstack.app',
      text: 'PWA in Next.js 16 for developers to log achievements in the STAR format with AI support.',
    },
    {
      lead: 'konfi and hypr-switcher (Rust)',
      text: 'TUI dotfiles manager and visual window switcher for Wayland, published on crates.io.',
    },
    {
      text: '122 public repositories and 476 followers on GitHub, contributing since 2012.',
    },
  ] satisfies ResumeProject[],
  education: [
    { title: 'Technologist in Internet Systems', where: 'Universidade Positivo', period: '2015 - 2016' },
    { title: 'Technical in Computing', where: 'Colégio Estadual do Paraná (CEP)', period: '2010 - 2011' },
  ],
  languages: 'Portuguese (native), English (professional)',
} as const;
