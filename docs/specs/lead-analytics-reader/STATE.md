---
feature: lead-analytics-reader
phase: plan-complete
plan_path: docs/plans/2026-10-14-lead-analytics-reader.md
spec_path: docs/specs/lead-analytics-reader/SPEC.md
depth: standard
started_at: 2026-10-14
---

# Estado: lead-analytics-reader

Leitor local (TUI em Rust, ratatui + tokio) dos dados do lead-analytics, em `tools/stats/`
deste repositório. Decidido antes da pesquisa: TUI em Rust, código neste repositório,
spec via RPI antes de implementar.

Spec aprovada em 2026-10-14: 18 requisitos (16 P1, 2 P2), 15 decisões no Grilling Log. O
autor aprovou a primeira seção e pediu para salvar sem revisar as outras quatro.

Plano salvo em 2026-10-14 com 17 tarefas em 4 lotes. O portão desta feature é `cargo fmt`,
`cargo clippy -D warnings` e `cargo test` em `tools/stats/`, porque o `rpi-gates.sh` só detecta
o `package.json` da raiz. A Task 17 roda contra produção com o autor presente.

## Verificação em produção (2026-10-14)

Tarefas 1 a 16 commitadas em `main` (`2f8d1c9` a `7be0361`). Esta tarefa não tem commit.

A credencial ADC já existia (`authorized_user`, `quota_project_id` = `nandomoreira-dev`). A TUI não pediu login. Dia de São Paulo: `2026-10-14`.

`GET analytics_daily/2026-10-14` respondeu HTTP 200. O cabeçalho da TUI ficou igual ao documento: pessoas 25, agentes 3, robôs 16, cliques 0, CV 0, briefings 0, MCP 0. O grupo `conversions` não existe nesse documento, então CV, briefing, clique e chamada de tool ficam 0.

Tráfego de hoje bateu com o documento. Páginas: `/` 16, `/posts` 2, `/setup` 2, `/sobre` 2, `/contato` 1, `/lab` 1, `/now` 1. Canais: direct 10, other 2. Países: BR 18, CN 2, e 1 em AE, RU, SE, SG e US. Nenhum destino de `/go`. MCP de hoje: clientes other 3 e claude-code 1; métodos initialize 4, tools/list 4, notifications/initialized 3 e other 3; lista de tools vazia.

A consulta de eventos do cliente (`at >= 2026-09-15T03:00:00.000Z`, ordem ascendente, página de 500) respondeu HTTP 200, com 33 documentos numa página e sem erro de índice. Conversões no intervalo: mcp 2. Nenhum `cv` ou `hire`, então não havia lead. Enter no funil não abriu detalhe e não mostrou erro.

`r` mostrou `tempo real · 5 s` na barra. `]` foi para `7 dias` e de novo para `30 dias`, sem erro. `q` encerrou com código 0.

Funil de hoje e dos 30 dias: Chegou 15, Viu evidência 0, Agiu 0, Virou lead 0. O 15 é a visita (dia de São Paulo, visitante humano), não o contador `traffic.human` (25).

Não feito, de propósito: visita nova ao site, porque escreveria analytics de produção, então não houve observação de uma visita em 30 s nem em 5 s; `nmcli networking off`, porque derruba a rede da máquina.
