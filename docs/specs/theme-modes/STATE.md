---
feature: theme-modes
phase: implement
started_at: 2026-10-20
depth: deep
spec_path: docs/specs/theme-modes/SPEC.md
plan_path: docs/plans/2026-10-20-theme-modes.md
decisions:
  - "Primeira visita segue prefers-color-scheme; a escolha manual fica no localStorage"
  - "Script inline bloqueante no <head> evita flash, inclusive em rotas pré-renderizadas"
  - "Shiki em dual theme com o port Shiki do Terminal Noir (terminal-noir e terminal-noir-paper), copiado em src/lib/code/themes"
  - "Todo par de cor do site passa AA nos dois temas sobre background, surface e surface-elevated (primeiro uso real da Paper)"
  - "Modo leitura mantém preto, sépia e claro, independentes do tema do site"
  - "WhatsApp na Paper em #075e54 (o verde da marca dá 1,90:1 no papel)"
  - "Ação de tema na paleta (atalho T) entra como P2"
blockers: []
transitions:
  - "2026-10-20: research, spec aprovada"
  - "2026-10-20: plan-complete, 12 tarefas"
  - "2026-10-20: plano revisto: contraste do site inteiro e temas Shiki do Terminal Noir; depende de contrast-gate (terminalnoir)"
  - "2026-10-20: implement started (--agentic)"
---

# Estado: theme-modes

Noir e Paper do Terminal Noir como temas do site. Depende de `contrast-gate` no
repositório do Terminal Noir (antes da tarefa 8). Colide com `i18n-foundation`
(plan-complete), que também mexe em `BaseLayout.astro` e no header: sequenciar.
