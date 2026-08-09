---
phase: plan-complete
spec_path: docs/specs/theme-restyle/SPEC.md
plan_path: docs/plans/2026-08-09-theme-restyle.md
started_at: 2026-08-09
updated_at: 2026-08-09
current_section: ""
decisions:
  - "Tema astro-starter-portfolio (MIT, Astro 7, Tailwind 4) como referência de composição, reimplementado dentro do sistema"
  - "Paleta e fontes atuais preservadas por decisão do autor; acento periwinkle e Fonts API do tema ficam de fora"
  - "ClientRouter e ThemeToggle do tema descartados: embarcam JS de cliente"
  - "Separação portfólio/laboratório por reagrupamento dos quatro blocos, sem campo novo"
  - "Data vira campo obrigatório no schema de projects: o padrão de linha a exibe em destaque"
  - "About sai da home para /sobre, com resumo curto e link na home"
  - "Valores do tema fora da escala viram token nomeado, nunca valor arbitrário"
blockers: []
transitions:
  - "2026-08-09: research (interativo, 2 rodadas de perguntas)"
  - "2026-08-09: plan-complete"
---

# STATE — theme-restyle

Feature fora das seis sprints originais, nascida do pedido de trocar o visual. Não cria
feature nova no PRD: reescreve a apresentação de F1, F2 e as rotas de F4.

## Como o escopo foi fechado

O autor pediu inicialmente "todos acima" para escopo (colher ideias, manter sistema,
trocar identidade visual e adotar o tema como base) e ao mesmo tempo que **as decisões
aprovadas vencem** qualquer conflito. As duas coisas não cabem juntas ao pé da letra,
porque os componentes atuais são a materialização dessas decisões. A reconciliação
adotada, confirmada depois pelas escolhas concretas:

- **Muda tudo que é aparência:** composição, estrutura de seções, desenho dos componentes.
- **Não muda nada que é arquitetura:** zero JS de cliente, escuro exclusivo, motion contido, tokens, fonte única, os sete portões, WCAG AA.

Depois disso o autor restringiu ainda mais: **manter cores e fontes**. Então a mudança
de identidade visual acontece pela composição e pela densidade, não pela paleta.

## Temas avaliados

Nove temas free foram examinados página a página. O `astro-starter-portfolio` venceu por
ser o único em Astro 7 **e** Tailwind 4, sem ilhas nas dependências, e com Content
Collections tipadas por Zod, que é a mesma arquitetura de `content-data-layer`.

O `Astro EmDash Starter` foi descartado: é plataforma de conteúdo com CMS obrigatório,
SQLite, R2, React 19 e Pagefind, e colide com três Non-Goals do PRD (CMS, área logada,
i18n), além de substituir o `content-data-layer` inteiro por um banco.

Três ideias do EmDash ficaram anotadas para depois: paleta em OKLCH, middleware de CSP
por hash (candidato a `launch-hardening`) e `schema-dts` para tipar o JSON-LD do
`aeo-base`.

## Dívida e riscos

- `project-catalog`, `home-page` e `aeo-base` estão concluídas e consomem os componentes atuais. O plano preserva a API do que é reutilizado e atualiza os testes das três onde a estrutura muda.
- O `ProjectCard` em grid deixa de ser usado nas listagens. Ele não é removido nesta feature: a decisão de aposentá-lo fica para depois de a nova listagem estar no ar.
