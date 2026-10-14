---
feature: lead-analytics
phase: implement-complete
depth: deep
started_at: 2026-10-14
completed_at: 2026-10-14
spec_path: docs/specs/lead-analytics/SPEC.md
plan_path: docs/plans/2026-10-14-lead-analytics.md
---

# Estado: lead-analytics

Spec aprovada em 2026-10-14 depois de uma rodada de grilling (17 decisões, ver o Grilling
Log). Plano salvo com 20 tarefas em 5 lotes. A tarefa 19 cria recursos no Google Cloud e só
roda com o aval do autor. O leitor dos dados (sh, Rust ou TUI) fica de fora de propósito e
será uma feature própria.

Implementada em 2026-10-14. Commits, em ordem: `6dc06c0` classificação, `17f470c` hash do
visitante, `08c524a` canal e UTM, `865af37` eventos e incrementos, `7749b56` o que conta,
`f768d12` texto do percurso, `02b36be` store, `df0646b` recorder, `bcb9eb1` middleware SSR,
`f2af95b` `/v.gif`, `16493d0` posição do pixel, `de70c4b` `/eu`, `a5325b3` `/go`, `0ff6ba5`
links do catálogo, `51dede7` links de contato, `884bc80` percurso no e-mail do lead,
`730fad5` uso do MCP, `5fd52a4` política de privacidade, `8a033b5` verificações HTTP,
`a8eac25` segredos em runtime.

Os segredos `analytics-hash-secret` e `analytics-self-token` existem no Secret Manager, e o
backend `nandomoreira-dev` do App Hosting (`us-east4`) tem acesso a eles. O TTL por
`expiresAt` está ligado em `analytics_events` e `analytics_daily` no banco `(default)`. O
token de autor fica só em `~/.config/nandomoreira/self-token` (modo 0600).

Revisão de código de 2026-10-14 (10 achados) corrigida: cache de tabela que guardava a
falha, erro de analytics depois de salvar o lead, contagem do MCP (só `tools/call` é
conversão, um batch por requisição), chaves literais no contrato, nomes reais de clientes
MCP, `/go` sem cases descontinuados, Referer mantido nos links do `/go`, `rel="me"` no
`<head>`, contradição na política e este arquivo, que estava em inglês.
