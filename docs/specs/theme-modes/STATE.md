---
feature: theme-modes
phase: review
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
  - "2026-10-20: 12 tasks done (Grok implemented, Claude reviewed: agy unavailable); gates green except two store-bound tests; browser check 31/31"
---

# Estado: theme-modes

Noir e Paper do Terminal Noir como temas do site. Depende de `contrast-gate` no
repositório do Terminal Noir (antes da tarefa 8). Colide com `i18n-foundation`
(plan-complete), que também mexe em `BaseLayout.astro` e no header: sequenciar.

## Implementação (2026-10-20)

- Conferência no navegador (Playwright contra o build, 1280 e 390px): 31/31. Paper na primeira
  visita com o sistema claro em `/`, post e case; troca, recarga e mudança do sistema ao vivo;
  foco visível; paleta com "Usar tema escuro" e `T`; WhatsApp `#075e54`; sem JS segue o sistema
  e esconde o botão; modo leitura preto vence o Paper.
- Blocos de código no build: 132 blocos com as duas variantes, nenhuma cor inline, pior token
  7,68:1 (Noir) e 5,38:1 (Paper).
- **Pendente do ambiente:** os dois testes de variante de `code-contrast.test.ts` leem o HTML
  do `.astro/data-store.json` do dev, que ainda tem o Shiki antigo. Ficam verdes depois de
  `./node_modules/.bin/astro dev stop && rm .astro/data-store.json && npm run dev` e, com o
  "ready", outro `astro dev stop` (o store só é gravado no shutdown).
- `motion.test.ts` (reduced-motion da paleta) continua vermelho, falha anterior a esta feature.
- Desvios do plano, todos com teste: o modo leitura preto redefine os seis tokens que o Paper
  muda e ele não declarava (REQ-009); `tokens.test.ts` deixou de proibir `prefers-color-scheme`
  e passou a aceitar só os seletores do theme-modes; `contato.test.ts` aceita o boot de tema
  byte a byte; o carregador da paleta busca o módulo também no `T`; abaixo de `md` o botão vai
  para o menu (a pílula ocupa a barra desde 2026-10-17) e, em `/servicos`, abaixo de `sm`, para
  a pilha flutuante.
- Fora do escopo, anotado: em 320px o botão "Abrir menu" já saía da tela antes desta feature
  (marca + pílula + botão somam 374px).
