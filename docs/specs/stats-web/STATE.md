---
feature: stats-web
phase: implement
plan_path: docs/plans/2026-10-29-stats-web.md
spec_path: docs/specs/stats-web/SPEC.md
depth: deep
started_at: 2026-10-29
---

# Estado: stats-web

Versão web do leitor de analytics em Rust (`tools/stats`, hoje uma TUI ratatui).

Decidido antes da pesquisa (2026-10-29, Fernando):

- Roda em dois lugares: local, o próprio binário servindo em `127.0.0.1` e abrindo no
  navegador; e no homelab, num container atrás do Caddy, no mesmo esquema de
  `deploy/staging`.
- Descartados: Cloud Run com IAP e rota `/admin` no site.
- A lógica existente da lib (`app`, `funnel`, `sales`, `totals`, `period`, `cache`,
  `client`, `auth`) é reaproveitada; só `ui.rs` é específico do ratatui.

Spec aprovada em 2026-10-29: 21 requisitos, todos P1, e 10 decisões no Grilling Log. O
autor aprovou as quatro seções (contexto, requisitos, arquitetura, casos-limite com
restrições, escopo e testes).

Passos manuais do autor, fora do código: criar a conta de serviço `stats-reader` com
`roles/datastore.viewer`, gerar a chave e copiá-la para `~/.config/stats/sa.json` no
homelab; adicionar o split DNS do domínio `home` para `100.97.74.108` no painel do
Tailscale.

Plano salvo em 2026-10-29 com 21 tarefas em 4 lotes (lib pura, credencial e fonte,
servidor, verificação e homelab). Desvios da spec registrados no plano: imagem
`rust:1.96-slim-bookworm`, script de cliente limitado a 2048 B brutos, série na aba Ao
vivo e dados do `--demo` estáticos no web. A base (filtro por dia e cache de eventos)
entrou em `5bb598d` antes da tarefa 1. A revisão parte desse commit.

## Ledger

| Tarefa | Implementação | Testes | Commit | Revisão |
|---|---|---|---|---|
| T1 Range | Grok | `range` 7 ok; suíte 109 ok; fmt e clippy ok | 1817cb9 | pendente |
| T2 View | Grok | `view` 7 ok; suíte 116 ok; fmt e clippy ok; `cargo audit` limpo depois de subir `rustls-webpki` 0.103.16 e `webpki-root-certs` 1.0.11 (RUSTSEC-2026-0382 e 0383 já estavam no lock) | a15c11a | pendente |
| T3 scope | Grok | `scope` 2 ok; suíte 118 ok; fmt e clippy ok | f770088 | pendente |
| T4 series | Grok | `series` 3 ok; suíte 121 ok; fmt e clippy ok | 864e63a | pendente |
| T5 svg | Grok | `svg` 4 ok; suíte 125 ok; fmt e clippy ok | 73d848c | pendente |
| T6 DailyCache | Grok | `cache` 11 ok; suíte 129 ok; fmt e clippy ok | add9484 | pendente |
| T7 token | Grok | `token` 8 ok; suíte 137 ok; fmt, clippy e cargo audit ok | e37d310 | pendente |
| T8 source | Grok | `source` 4 ok; suíte 141 ok; fmt e clippy ok | 52e15a7 | pendente |
| T9 host | Grok | `web::host` 3 ok; suíte 144 ok; fmt, clippy e cargo audit ok | be643a6 | pendente |
| T10 snapshot | Grok | `web::snapshot` 3 ok; suíte 147 ok; fmt e clippy ok | 13d1389 | pendente |
| T11 display | Grok | `web::display` 7 ok; suíte 154 ok; fmt e clippy ok | 22d4b59 | pendente |
| T12 Hub | Grok | `web::hub` 5 ok; suíte 159 ok; fmt e clippy ok. `wake` fica com `expect(dead_code)` até o poller da T16 | pendente | pendente |

Módulos de teste filhos não herdam os `use` do pai: cada um importa o que usa. Tipos privados que o teste do plano chama ficam `pub(crate)`.
