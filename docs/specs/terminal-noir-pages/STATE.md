---
feature: terminal-noir-pages
phase: implemented
spec_path: docs/specs/terminal-noir-pages/SPEC.md
plan_path: docs/plans/2026-10-17-terminal-noir-pages.md
started_at: 2026-10-17
depth: standard
parent: docs/specs/terminal-noir-redesign/STATE.md
---

# Estado: terminal-noir-pages

Fase 7 do redesign Terminal Noir: o visual das telas internas do Stitch (Setup, Agora,
Sobre, Contato, Blog, Portfólio, Laboratório) aplicado às páginas do site, mais post e
case, que o Stitch não desenhou. Regra herdada da feature mãe: entra só o visual; o
conteúdo continua vindo do perfil, das collections e de `src/lib/`.

Árvore suja no início do research: fase 6 (AGENTS.md) sem commit, tocando
`AgentBrief.astro`, que a `/contato` usa.

Spec aprovada em 2026-10-17 (16 requisitos: as seis páginas, a listagem do blog com
`PostRow` e tempo de leitura, e os extras do Stitch com dado real). Plano com 18 tarefas
em 4 lotes; a tarefa 13 depende da fase 6 da feature mãe estar commitada.

Implementado em 2026-10-17: tempo de leitura na camada de acesso, `extras` no schema,
`liveHost`, `SectionHeader` com `step`, `UpdatedAt`, `SectionRule`, `PostRow` no blog e
no arquivo, seções numeradas em Setup e Agora, linha do tempo e cards em Sobre, Contato
em duas colunas com `AgentBrief` `panel` e card do MCP, títulos de post e case em
Newsreader 400, "No ar" na listagem, `ClosingCta` em Portfólio e Lab, fios na home.
