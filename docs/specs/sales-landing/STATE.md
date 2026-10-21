---
feature: sales-landing
phase: implement
plan_path: docs/plans/2026-10-18-sales-landing.md
spec_path: docs/specs/sales-landing/SPEC.md
depth: deep
started_at: 2026-10-18
source: "Stitch, projeto 3626158459540278205: telas c0a0c46dd2aa4a62944aec66b75a746a (landing desktop), 1cda02f890eb48b090398883134c42f6 (landing mobile), df811c3ca67e4a868f0365e814654773 (site institucional desktop), 5983629069cc4cf4b6f1c5e797b27fbb (site institucional mobile)"
decisions:
  - "Subdomínio contrate.nandomoreira.dev, mesmo repo, ativado pela flag SALES_HOST_LIVE"
  - "Grilling em 2026-10-18: 15 decisões no Grilling Log da SPEC"
  - "2026-10-19: as chamadas passaram a abrir o /contato e a landing perdeu o formulário próprio (f5e8443)"
  - "2026-10-21: o formulário volta à landing e às páginas de detalhe, a pedido do Fernando, para o visitante não sair da página; todas as chamadas levam a #contato. Sem faixa de orçamento: os valores em R$ reprovam o portão de números inventados e ancorariam preço antes de ele decidir a tabela"
  - "2026-10-21 (mais tarde): o Fernando pediu o campo Orçamento no formulário de vendas, com as mesmas faixas do /contato; o portão de números inventados passou a ignorar só o <select name=orcamento>, e um teste prova que qualquer outro R$ continua reprovando"
  - "2026-10-21: a seção de ferramentas passa a abrir com 6 benefícios sem nome de produto; as 9 ferramentas ficam num <details>"
  - "2026-10-21: a reescrita do subdomínio passa a manter a query, senão o ?envio= do handler nunca chegava à landing em contrate.nandomoreira.dev"
blockers: []
transitions:
  - "2026-10-18: research, leitura das 4 telas do Stitch via MCP"
  - "2026-10-18: grilling e spec aprovada; plan"
  - "2026-10-18: plano salvo, 24 tarefas em 4 lotes"
---

# Estado: sales-landing

Página de vendas para clientes não técnicos (sites, lojas, blogs, produtos web) e página de
detalhe por serviço, desenhadas no Stitch a partir de um prompt escrito em 2026-10-18.
