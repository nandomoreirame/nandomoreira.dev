# Spec: Painel web do leitor de analytics (`stats-web`)

> **Status:** aprovada (2026-10-29)
> **Origem:** pedido do autor, continuação do `lead-analytics-reader` (a TUI em `tools/stats`)
> **Profundidade:** deep

## Problem Statement

O leitor de analytics só existe como TUI: exige um terminal na máquina do autor, não abre
no celular e não mostra nada temporal (nem gráfico por dia, nem semana ou mês de
calendário, nem intervalo livre). As perguntas que a medição responde ficam presas ao
terminal e a janelas móveis de no máximo 30 dias.

## Goals

- O mesmo binário serve o painel em `127.0.0.1` e abre o navegador (`stats web`).
- O homelab serve em `http://stats.home`, que abre pelo Tailscale e responde 403 (ou nem resolve) para quem está só no Wi-Fi da casa.
- Paridade com a TUI: Ao vivo, Funil, Tráfego, MCP, Vendas, detalhe do lead e atualização ao vivo.
- Série diária em gráfico de até 24 meses; recortes de calendário (dia, semana de segunda a domingo, mês) com navegação, janelas móveis de 7 e 30 dias e intervalo livre.
- Links clicáveis e layout que funciona a 360 px.

## Non-Goals

- Cloud Run, IAP ou rota `/admin` no site (descartados pelo autor).
- Escrever no Firestore, de qualquer forma.
- Login no app: a rede é a barreira.

## Context

- A TUI (`tools/stats`) já lê o Firestore pela API REST, com cache local de eventos (`src/cache.rs`), filtro por dia e campo de data.
- A lógica de funil, vendas, totais, cidades e detalhe do lead está em funções puras da lib que recebem eventos e a lista de dias. Só `ui.rs` é específico do ratatui. A TUI continua existindo.
- Os eventos brutos expiram em 30 dias e os contadores diários em 24 meses.
- O registro do lead (nome, contato, briefing) é lido sob demanda e fica só em memória (REQ-013 de `lead-analytics-reader`).
- A homologação no homelab (`deploy/staging`) publica um container em `127.0.0.1` atrás do Caddy (rede do host) e registra o nome `.home` no Pi-hole. O Pi-hole resolve `.home` para toda a rede local; o tailnet ainda não resolve `.home` (item 1 do backlog em `~/Games/HOMELAB-NOTES.md`).
- O homelab está no Tailscale com o IP `100.97.74.108`.

## Verified Claims

O que cada trecho sustenta: funil, vendas, totais, cidades e detalhe do lead são funções
puras reaproveitáveis; o cache de eventos e o cliente REST já existem; o token local vem do
`gcloud`; o `DemoWorld` alimenta os testes; só `ui.rs` é do ratatui; os TTLs são 30 dias e
24 meses; a homologação publica só em loopback e o Caddy lê `~/caddy/Caddyfile`.

| Claim | Source (file:line) | Verified |
|---|---|---|
| pub fn funnel(events: &[Event], days: &[String]) -> Funnel | `tools/stats/src/funnel.rs:46` | yes |
| pub fn sales(events: &[Event], days: &[String]) -> Sales | `tools/stats/src/sales.rs:43` | yes |
| pub fn sum(days: &[&Daily]) -> Totals | `tools/stats/src/totals.rs:15` | yes |
| pub fn cities(events: &[Event], days: &[String], limit: usize) | `tools/stats/src/totals.rs:58` | yes |
| pub fn lead_detail(lead: &Lead, record: Option<&Value>, events: &[Event]) | `tools/stats/src/lead.rs:33` | yes |
| pub struct EventCache | `tools/stats/src/cache.rs:82` | yes |
| pub fn cache_path( | `tools/stats/src/cache.rs:17` | yes |
| pub fn events_since_query(from_at: &str, limit: u32) | `tools/stats/src/client.rs:18` | yes |
| pub async fn dailies(&self, days: &[String]) | `tools/stats/src/client.rs:141` | yes |
| pub async fn document(&self, collection: &str, id: &str) | `tools/stats/src/client.rs:153` | yes |
| pub fn access_token(runner: &impl Runner) | `tools/stats/src/auth.rs:50` | yes |
| pub struct DemoWorld | `tools/stats/src/demo.rs:108` | yes |
| pub fn draw(frame: &mut Frame, app: &App | `tools/stats/src/ui.rs:30` | yes |
| const EVENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; | `src/lib/analytics/event.ts:53` | yes |
| const DAILY_TTL_MONTHS = 24; | `src/lib/analytics/event.ts:54` | yes |
| "127.0.0.1:${STAGING_PORT:-4321}:8080" | `deploy/staging/compose.yml:15` | yes |
| CADDYFILE="$HOME/caddy/Caddyfile" | `scripts/deploy-staging.sh:55` | yes |
| O Caddy, na rede do host, vê o IP do Tailscale como origem de quem chega pela `tailscale0` | comportamento do Caddy e do Tailscale | assumption |
| O split DNS do Tailscale para o domínio `home` apontando para `100.97.74.108` resolve `stats.home` fora de casa | painel do Tailscale | assumption |
| Uma conta de serviço com `roles/datastore.viewer` lê `analytics_*`, `cv_downloads` e `hire_requests` pela API REST | IAM do Google Cloud | assumption |

## Requirements

### P1 (MVP)

**Servidor e segurança**

1. **[REQ-001]** QUANDO o autor roda `stats web` ENTÃO o sistema DEVE servir o painel em `127.0.0.1:7878` (`--port` muda a porta) e abrir o navegador (`--no-open` desliga).
2. **[REQ-002]** QUANDO chega uma requisição com `Host` fora da lista permitida (`localhost`, `127.0.0.1` e o valor de `--host-name`, como `stats.home`) ENTÃO o sistema DEVE responder 421 sem dados, contra DNS rebinding.
3. **[REQ-003]** QUANDO `GOOGLE_APPLICATION_CREDENTIALS` aponta para uma chave de conta de serviço ENTÃO o sistema DEVE gerar o token a partir dela, sem `gcloud`; sem a variável, DEVE usar o `gcloud`, como a TUI.
4. **[REQ-004]** QUANDO a credencial falta ou é recusada ENTÃO o servidor DEVE continuar no ar e mostrar o erro na página, sem reiniciar em loop.
5. **[REQ-005]** QUANDO uma página mostra dado vindo do Firestore ou da URL (caminho, cidade, canal, briefing) ENTÃO o sistema DEVE escapar o HTML por template, nunca por concatenação.

**Telas e recortes**

6. **[REQ-006]** QUANDO o autor abre o painel ENTÃO o sistema DEVE mostrar Ao vivo, Funil, Tráfego, MCP e Vendas com os mesmos números que a TUI daria para os mesmos dados, vindos das mesmas funções da lib.
7. **[REQ-007]** QUANDO o autor escolhe dia, semana ou mês ENTÃO o sistema DEVE mostrar o recorte de calendário no fuso de São Paulo (semana de segunda a domingo, mês do dia 1 ao último), com ← → para o anterior e o seguinte, sem passar de hoje.
8. **[REQ-008]** QUANDO o autor escolhe "últimos 7" ou "últimos 30" ENTÃO o sistema DEVE usar a janela móvel que termina hoje.
9. **[REQ-009]** QUANDO o autor informa um intervalo livre ENTÃO o sistema DEVE aceitá-lo só se o início vier antes ou no fim, o fim não passar de hoje e o intervalo couber em 24 meses; fora disso, DEVE explicar o erro.
10. **[REQ-010]** QUANDO o recorte muda ENTÃO o sistema DEVE refleti-lo na URL, para que recarregar ou abrir o link mantenha o mesmo recorte.
11. **[REQ-011]** QUANDO o recorte tem dias fora dos 30 dias de eventos brutos ENTÃO Funil, Vendas, cidades e feed DEVEM avisar que cobrem só a parte dentro da janela, e Tráfego, MCP e a série DEVEM usar os contadores diários.
12. **[REQ-012]** QUANDO o recorte tem mais de um dia ENTÃO o sistema DEVE desenhar em SVG a série diária de visitas humanas, agentes e leads, com dia sem documento contado como 0 e uma tabela equivalente para leitor de tela.
13. **[REQ-013]** QUANDO o autor clica num caminho ENTÃO o sistema DEVE abrir `https://nandomoreira.dev<caminho>` em outra aba; QUANDO clica num canal ou numa cidade ENTÃO DEVE filtrar o recorte por ele, com um jeito visível de limpar o filtro.
14. **[REQ-014]** QUANDO a tela tem 360 px de largura ENTÃO a página NÃO DEVE rolar na horizontal; tabelas largas rolam dentro do próprio bloco.
15. **[REQ-015]** QUANDO o autor navega só por teclado ou por leitor de tela ENTÃO todo controle DEVE ser alcançável, com foco visível e rótulo.

**Dados ao vivo**

16. **[REQ-016]** QUANDO há ao menos uma página aberta ENTÃO o servidor DEVE buscar eventos novos a cada 30 s e empurrá-los por SSE; sem nenhuma página aberta, NÃO DEVE ler o Firestore.
17. **[REQ-017]** QUANDO o autor liga o tempo real ENTÃO o intervalo DEVE cair para 5 s e voltar a 30 s sozinho depois de 30 minutos, com aviso.
18. **[REQ-018]** QUANDO a leitura do Firestore falha ENTÃO a página DEVE manter o último dado e mostrar o erro.
19. **[REQ-019]** QUANDO um dia já terminou ENTÃO seus contadores diários DEVEM ficar no cache local, e só hoje (mais ontem, uma vez depois da meia-noite) é relido; os eventos usam o `EventCache` existente.

**Lead e homelab**

20. **[REQ-020]** QUANDO o autor abre um lead ENTÃO o sistema DEVE buscar o registro sob demanda e mostrar nome, contato, briefing e percurso, com `Cache-Control: no-store`, sem gravar nada em disco nem no cache.
21. **[REQ-021]** QUANDO o autor roda `scripts/deploy-stats.sh` ENTÃO o sistema DEVE publicar o container em `127.0.0.1` no homelab, configurar o Caddy para `stats.home` aceitando só `100.64.0.0/10` e `fd7a:115c:a1e0::/48` (403 para o resto), apontar `stats.home` no Pi-hole para o IP do homelab no Tailscale e terminar com a linha `STATS DEPLOY PASSED`.

### P2 (Should Have)

Nenhum: tudo o que o autor pediu entrou como P1.

### P3 (Nice to Have)

Nenhum.

## Edge Cases

- **Dia virando com a página aberta** - "hoje" e as janelas móveis avançam na meia-noite de São Paulo; um recorte fixo vindo da URL (`?from=…&to=…`) não muda.
- **Recorte fora dos 30 dias de eventos** - funil, vendas, cidades e feed mostram "eventos brutos só cobrem os últimos 30 dias"; num recorte parcial, mostram o que existe, com o aviso.
- **Query string adulterada** (`?from=2026-13-40`, `?to=2099-01-01`, `?channel=<script>`) - responde 400 com mensagem e nunca devolve o parâmetro sem escape.
- **Dia sem documento diário** - a série conta 0, sem interromper a linha.
- **Recorte de 24 meses** - acima de 120 dias o gráfico agrega por semana para caber no SVG; a tabela acessível mantém os dias.
- **Várias abas abertas** - uma leitura do Firestore por ciclo, transmitida a todas; a última aba fechada para a leitura em até um ciclo.
- **SSE caindo** (celular dormindo, troca de rede) - o `EventSource` reconecta sozinho e o servidor manda o estado atual inteiro na volta, não um diff.
- **Token vencendo com o servidor no ar por dias** - o token da conta de serviço é renovado antes de 1 h; um 401 renova e tenta de novo uma vez, como na TUI.
- **Chave ausente ou revogada** - a página mostra "credencial inválida" e o container continua de pé (REQ-004).
- **Lead cujo registro sumiu** - mostra "registro não encontrado" com o percurso, como a TUI.
- **Cache corrompido ou de outra versão** - começa vazio e relê do Firestore.
- **Porta 7878 ocupada no modo local** - sai com "porta 7878 em uso; use --port".
- **Host não permitido** - 421, inclusive no endpoint SSE.
- **Origem do Caddy não ser o IP do Tailscale** (assumption) - o script de deploy prova o 200 pelo Tailscale e o 403 pela rede local antes de imprimir a marca; se a origem vier errada, o deploy falha em vez de abrir o painel para a casa.
- **Split DNS não configurado** (assumption) - `stats.home` resolve só em casa com Tailscale ligado; o README documenta o passo manual no painel do Tailscale.
- **Papel da conta de serviço insuficiente** (assumption) - a página mostra o 403 do Firestore como erro de credencial (REQ-004).
- **Um nó do tailnet compartilhado com outra pessoa** - essa pessoa veria os dados de lead; a barreira de acesso pressupõe um tailnet só do autor (registrado como consequência aceita).

## Architecture Decisions

1. **Servidor HTTP** - Escolhido `axum` sobre o tokio que o crate já usa. Descartado: actix-web, um runtime a mais sem ganho.
2. **Templates** - Escolhido `askama`: HTML em arquivo próprio, escape automático (REQ-005) e checagem na compilação. Descartado: maud, que transforma o HTML em macro Rust e dificulta mexer no layout.
3. **Token da conta de serviço** - Escolhido `jsonwebtoken`: JWT RS256 assinado localmente e trocado em `oauth2.googleapis.com/token`. Descartados: `gcp_auth` (outra pilha HTTP) e `gcloud` na imagem (~500 MB de Python).
4. **Atualização ao vivo** - Escolhido SSE (`axum::response::Sse`) com fragmentos HTML já escapados pelo servidor e um script pequeno sem build que troca as seções (até 2 KB gzip). Descartados: WebSocket (bidirecional sem necessidade) e polling do cliente (mais leituras).
5. **Estado no servidor** - Um estado compartilhado (`Arc<RwLock>`) com o `EventLog` e os contadores; a leitura do Firestore só roda enquanto houver assinante SSE (REQ-016). Descartado: uma leitura por aba, que multiplica o custo.
6. **Modelo de recorte** - Novo `Range { from, to }` na lib, com dia, semana e mês de calendário; o `Period` da TUI passa a produzir um `Range`, e funil, vendas e totais continuam recebendo a lista de dias. Descartado: estender o enum `Period`, que misturaria calendário com a navegação da TUI.
7. **Gráficos** - SVG gerado no servidor, à mão. Descartado: biblioteca JS de gráficos, que exige build e pesa no celular.
8. **Cache** - O `EventCache` existente, mais um `dailies.json` com os dias encerrados (REQ-019). Descartado: reler até 730 documentos diários a cada abertura.
9. **Visual** - CSS embutido com tokens do Terminal Noir e tema claro por `prefers-color-scheme`. Descartado: Tailwind, que exige build.
10. **Um binário, dois modos** - `stats` abre a TUI e `stats web` sobe o servidor, sobre a mesma lib. Descartados: substituir a TUI (perde o uso por ssh) e crates separados (mais um `Cargo.toml` sem ganho real).
11. **Container** - Build em duas etapas (`rust:1.88`, depois `debian-slim` com `ca-certificates`); dentro escuta em `0.0.0.0:8080`, no host é publicado só em `127.0.0.1:7879`, com volume para o cache. Descartado: binário solto no host, sem isolamento nem `restart`.
12. **Credencial do homelab** - Conta de serviço `stats-reader@nandomoreira-dev` com `roles/datastore.viewer`; chave em `~/.config/stats/sa.json` (modo `0600`) no homelab, montada read-only, nunca no repositório, rotação a cada 90 dias. Descartados: copiar o ADC pessoal (escopo da conta inteira) e empurrar o cache da máquina do autor (dados velhos e sem detalhe de lead).
13. **Barreira de acesso** - A rede é a autenticação: Tailscale, Caddy com `remote_ip 100.64.0.0/10 fd7a:115c:a1e0::/48` e checagem de `Host` no app. Descartados: basic auth ou login (credencial a mais num tailnet só do autor) e LAN aberta sem lead.
14. **Nome e DNS** - `stats.home` no Pi-hole apontando para o IP do Tailscale do homelab (`100.97.74.108`), mais split DNS do domínio `home` no painel do Tailscale. Descartados: `tailscale serve` (o autor quer o nome `stats.home`) e bind direto no IP do Tailscale (sem nome).

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Onde roda | Local e homelab; sem Cloud Run e sem `/admin` | Decisão do autor antes da pesquisa. |
| 2 | Quem acessa o homelab e se o lead aparece | Só pelo Tailscale, com detalhe do lead | O Wi-Fi da casa não alcança; o lead continua só em memória no servidor. |
| 3 | Credencial do Firestore no homelab | Conta de serviço só leitura com chave montada | Se vazar, só lê, e revoga-se sem tocar na conta pessoal. |
| 4 | Stack do front | HTML do servidor com SSE, sem build | Um binário só, sem npm. |
| 5 | Destino da TUI | Continua; `stats web` é um segundo modo | Mantém o uso por terminal e ssh. |
| 6 | Escopo além da paridade | Série diária, intervalo livre, links clicáveis, layout para celular, filtro de período | Pedido do autor. |
| 7 | Significado de semana e mês | Calendário (segunda a domingo, mês cheio) com navegação, mais janelas móveis de 7 e 30 dias | Escolha do autor. |
| 8 | Nome e caminho de rede | `stats.home` via Pi-hole para o IP do Tailscale, Caddy restrito à faixa do Tailscale, split DNS do domínio `home` | O autor quer o domínio `stats.home`; o split DNS evita depender do homelab para todo o DNS. |
| 9 | Proteção do modo local | Bind em `127.0.0.1` e checagem de `Host` | Evita DNS rebinding de uma página qualquer aberta no navegador. |
| 10 | Custo de leitura com o servidor sempre no ar | Lê o Firestore só com assinante SSE | Servidor ocioso não gasta leitura. |

## Constraints

- Só leitura no Firestore (`runQuery`, `batchGet`, `GET`).
- O registro do lead nunca vai para disco: nem no cache do servidor nem no do navegador.
- Toda dependência nova (`axum`, `askama`, `jsonwebtoken`) passa por `cargo audit` antes de entrar.
- O script de cliente não tem build nem dependência e fica em até 2 KB gzip.
- O portão da feature é `cargo fmt`, `cargo clippy -D warnings` e `cargo test` em `tools/stats/`; o deploy só conta com a linha `STATS DEPLOY PASSED`.

## Out of Scope

| Item | Reason |
|------|--------|
| Cloud Run, IAP, `/admin` no site | Descartados pelo autor. |
| Login no app | A rede é a barreira. |
| HTTPS | O túnel do Tailscale já cifra o tráfego. |
| Escrita no Firestore (marcar lead como atendido etc.) | O leitor é só leitura. |
| Exportar CSV | Não foi pedido. |
| Ativar o split DNS no painel do Tailscale | Passo manual do autor, documentado no README. |

## Test Strategy

- **Unit:** `Range` (semana, mês, navegação, limites, parse da URL), token JWT (assinatura com chave de teste e claims), agregação semanal, SVG da série, cache dos contadores diários.
- **Integration:** axum em processo, sem rede, com um Firestore falso alimentado pelo `DemoWorld`: status e `Host` permitido ou recusado, escape de `<script>` vindo do Firestore e da query, `no-store` no lead, SSE só lendo com assinante, 400 em parâmetro inválido.
- **Paridade:** números de funil, totais e vendas para os mesmos dados batem com os da `App` da TUI.
- **E2E:** `stats web --demo` no Playwright (360 px sem rolagem horizontal, navegação por teclado, troca de recorte); no homelab, o script de deploy prova 200 vindo do Tailscale e 403 vindo da rede local antes de imprimir a marca.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | `stats web` em 127.0.0.1:7878, abre o navegador | P1 | Pending |
| REQ-002 | `Host` fora da lista responde 421 | P1 | Pending |
| REQ-003 | Token por chave de conta de serviço, senão `gcloud` | P1 | Pending |
| REQ-004 | Credencial inválida não derruba o servidor | P1 | Pending |
| REQ-005 | Escape de HTML por template | P1 | Pending |
| REQ-006 | Paridade das cinco abas com a TUI | P1 | Pending |
| REQ-007 | Dia, semana e mês de calendário com navegação | P1 | Pending |
| REQ-008 | Janelas móveis de 7 e 30 dias | P1 | Pending |
| REQ-009 | Intervalo livre validado | P1 | Pending |
| REQ-010 | Recorte refletido na URL | P1 | Pending |
| REQ-011 | Aviso fora dos 30 dias de eventos | P1 | Pending |
| REQ-012 | Série diária em SVG com tabela acessível | P1 | Pending |
| REQ-013 | Links para o site e filtros por canal e cidade | P1 | Pending |
| REQ-014 | 360 px sem rolagem horizontal | P1 | Pending |
| REQ-015 | Teclado e leitor de tela | P1 | Pending |
| REQ-016 | SSE a cada 30 s só com assinante | P1 | Pending |
| REQ-017 | Tempo real de 5 s por até 30 min | P1 | Pending |
| REQ-018 | Falha do Firestore mantém o último dado | P1 | Pending |
| REQ-019 | Cache dos contadores de dias encerrados | P1 | Pending |
| REQ-020 | Detalhe do lead sob demanda, `no-store` | P1 | Pending |
| REQ-021 | Deploy no homelab com `STATS DEPLOY PASSED` | P1 | Pending |
