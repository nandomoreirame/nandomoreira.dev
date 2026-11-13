---
slug: i18n-sales
phase: implement
spec_path: docs/specs/i18n-sales/SPEC.md
plan_path: docs/plans/2026-10-19-i18n-sales.md
depends_on: [i18n-foundation]
updated: 2026-11-13
---

# STATE: i18n-sales

Spec aprovada pelo Fernando em 2026-10-19. Plano revisado em 2026-10-23, ainda com 11 tarefas. Implementação: `/rpi-implement i18n-sales`.

A revisão manda traduzir a copy do disco (prazo, pagamento, orçamento e formulário), não o texto de 2026-10-18. O índice `/en/search.json` passa a usar o catálogo inglês na tarefa 2.


## Execução de 2026-11-13

- Implementador: Codex. Base da revisão: `2b158dec23dd35a0d18ae5ab578005ebed5abc76`.
- Contrato: um commit por tarefa validada; nenhuma publicação solicitada.
- Preservar os quatro artefatos de revisão existentes fora dos commits desta feature.
- Adaptação do plano: o catálogo atual possui detalhe apenas em `site-institucional`; preservar a paridade do REQ-007, traduzindo os seis cards e o detalhe existente, sem inventar ofertas para os cinco serviços sem detalhe.

| Tarefa | Estado | Evidência | Commit |
|---|---|---|---|
| 1. Slugs e pares | validada | 846 testes sales/i18n; check sem erros; vermelho registrado | neste commit |
