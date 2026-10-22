---
feature: post-review
phase: implement
started_at: 2026-10-21
depth: standard
spec_path: docs/specs/post-review/SPEC.md
plan_path: docs/plans/2026-10-21-post-review.md
---

# Estado: post-review

Revisor de texto dos posts no `astro dev`: grifar trechos, pedir mudança ou escrever o substituto, salvar em `docs/post-reviews/<slug>.md` para o Claude aplicar. Decisões do autor em 2026-10-21: só no dev, grava no repositório, pedido livre e texto substituto, só posts do blog. Spec aprovada em 2026-10-21; plano com 12 tarefas.

Decisões do plano: anotação guarda `start`/`end` (ordem e remarcação depois de recarregar); citação de vários parágrafos localizada pelo primeiro; controles nativos dentro de `astro-dev-toolbar-window`; portão `reviewerLeaks` provado vermelho com diretório temporário.

Decisão do autor (2026-10-21), atalhos de uma letra: o bloqueio fica, mas o carregador da paleta lê `event.composedPath()[0]` e ignora a letra quando esse nó é um campo. Isso cobre a textarea da toolbar, que o `document` enxerga como o host do shadow, sem citar o revisor no script de produção. O marcador `data-post-review` entra no portão de vazamento para o build não poder reintroduzi-lo.
