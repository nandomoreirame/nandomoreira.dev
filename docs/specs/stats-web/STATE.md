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
| T12 Hub | Grok | `web::hub` 5 ok; suíte 159 ok; fmt e clippy ok. `wake` fica com `expect(dead_code)` até o poller da T16 | 6168b9c | pendente |
| T13 página | Grok | `web::pages` 5 ok; suíte 164 ok; fmt e clippy ok. `cargo audit` sem vulnerabilidade; aviso permitido RUSTSEC-2026-0374 (`basic-toml` sem manutenção, transitivo do askama). Askama 0.16 escapa `&` como `&#38;`; o teste aceita `&amp;` e `&#38;`. O literal `href="#main"` usa `r##` porque `"#` fecha `r#` | d27239a | pendente |
| T14 abas | Grok | `web::pages` 10 ok; suíte 169 ok; fmt e clippy ok | 19ca9fe | pendente |
| T15 lead | Grok | `web::lead` 4 ok; suíte 173 ok; fmt e clippy ok. `LeadDetail::pages` é `(hora, caminho)` | fcdd41c | pendente |
| T16 ao vivo | Grok | `web::live` e `web::assets` 8 ok; suíte 181 ok; fmt e clippy ok. `cargo audit` sem vulnerabilidade nova (aviso permitido do `basic-toml` continua). `tick` e `wake` são `pub(crate)` para o poller no módulo irmão | 4502357 | pendente |
| T17 stats web | Grok | `web::serve` 4 ok; suíte 185 ok; fmt e clippy ok. Binário de debug em `--demo --no-open`: linha `stats web em http://127.0.0.1:7878/`, `/healthz` ok, Host estrangeiro 421, SIGINT encerra com status 0. O navegador não foi aberto | 4e33f1b | pendente |
| T18 e2e | Codex | Vermelho: `live/last30` 534 px; medição estabilizada: `live/day` 534 px. Verde: `STATS WEB E2E PASSED`; fmt, clippy e suíte Rust 185 ok. `.scroll` posicionado contém os elementos absolutos de acessibilidade | pendente (Claude) | pendente |
| T19 container | Codex | Vermelho: 8 falhas (arquivos ausentes e contexto sem exclusão). Verde: `Tests 8 passed (8)`; compose válido; fmt, clippy e suíte Rust 185 ok. Build real `stats-web:check` ok; `docker run --rm stats-web:check stats --help` lista `web`; npm: 375 arquivos e 3261 testes ok | pendente (Claude) | pendente |
| T20 deploy-stats.sh | Codex | Vermelho: 5 falhas por script ausente, 8 testes anteriores ok. Verde: `Tests 13 passed (13)` e `SYNTAX OK`; fmt, clippy e suíte Rust 185 ok. npm intermediário: 3 timeouts de 5 s em renderizações do site sob concorrência; repetição final verde: 375 arquivos e 3261 testes ok, sem alterar timeouts ou testes. Deploy não executado, conforme handoff | pendente (Claude) | pendente |
| T21 docs | Codex | Vermelho: contagens de `stats web` no README e `deploy-stats.sh` no CLAUDE iguais a 0. Verde: ambas 2; README conferido com `docs-guardrails` e acentuação sem ocorrências. Portão final verde: fmt, clippy, 185 testes Rust e 3261 testes npm | pendente (Claude) | pendente |

O Grok parou no limite semanal de tokens durante a T18. T18 a T21 passaram para o Codex
pelo handoff `docs/plans/2026-10-29-stats-web-handoff-codex.md`, sem git: o Claude commita.

Módulos de teste filhos não herdam os `use` do pai: cada um importa o que usa. Tipos privados que o teste do plano chama ficam `pub(crate)`.


## Execução Codex (2026-10-29)

Escopo: T18 a T21, sem operações Git após a leitura inicial do estado. Commits e revisão
independente ficam com o Claude, conforme o handoff selecionado pelo autor. `phase`
permanece `implement`. Nenhuma chave foi lida ou criada e nenhum deploy foi executado.
Os dois rascunhos de conteúdo do autor foram preservados.

A T18 acrescenta espera por `load` e duas medições separadas por 500 ms para evitar
falso verde antes de o layout assentar. A única correção visual é `position: relative`
no `.scroll`, contendo o `.sr-only` absoluto. T19 e T20 seguem os blocos do plano.
Na T21, `docs-guardrails` também motivou contexto de uso antes da descrição e a
justificativa de manter o leitor junto do site. As sugestões automáticas de acentuação
para os verbos preexistentes "seria" e "publica" no CLAUDE foram descartadas após
revisão contextual.

Validação final: `cargo fmt --manifest-path tools/stats/Cargo.toml --check` e
`cargo clippy --manifest-path tools/stats/Cargo.toml --all-targets -- -D warnings`
passaram. `cargo test` imprimiu `test result: ok. 185 passed; 0 failed`.
`npm test` terminou com `Test Files 375 passed (375)` e `Tests 3261 passed (3261)`.
O build real da imagem terminou com `Successfully tagged localhost/stats-web:check`;
a ajuda executada dentro dela listou `web`. Compose validado e script executável,
com `SYNTAX OK`. O deploy permanece não executado e a revisão independente pendente.


## Deploy de teste autorizado (2026-10-29)

O autor pediu para finalizar as pendências e executar o deploy. A conta de serviço
`stats-reader@nandomoreira-dev.iam.gserviceaccount.com` foi criada com
`roles/datastore.viewer`. A credencial foi gravada diretamente no homelab em
`~/.config/stats/sa.json`, com modo `600`, sem conteúdo exibido e sem arquivo no
repositório. Rotação prevista em até 90 dias. O DNS `stats.home` já resolvia para
`100.97.74.108`; não foi necessário alterar o split DNS.

`bash scripts/deploy-stats.sh` terminou com `STATS DEPLOY PASSED`: 200 pelo Tailscale
e 403 pela rede local. O container está `running`, sem reinícios, com publicação
somente em `127.0.0.1:7879`. As cinco abas responderam 200, sem alertas. A verificação
Playwright contra o endereço publicado terminou com `STATS DEPLOYED BROWSER PASSED`
(360 px, teclado, rótulos, recorte mensal e URL preservada após recarregar).

Validação repetida: fmt e clippy aprovados, `185 passed; 0 failed` no Rust e
`14 passed (14)` no teste de configuração de deploy atual. Nenhuma alteração de
código foi necessária nesta rodada.

A revisão independente pelo helper `agy-review.sh` foi tentada. A preparação da
cópia descartável falhou com patch vazio; uma cópia temporária do helper contornou
essa falha sem modificar o framework ou o projeto. O agy então retornou exit 3,
indisponível por autenticação, quota ou rede. Grok e Codex implementaram esta feature,
portanto não substituem o revisor independente nesta rodada. Revisão e commits
continuam pendentes, separados do deploy de teste aprovado. `phase: implement`
permanece até a revisão, conforme o contrato do handoff.

Após 35 segundos de conexão no navegador, a página permaneceu sem alerta de erro:
`STATS LIVE DATA CHECK PASSED: no data error after a polling cycle`.
