# Spec: Medição de leads e conversão (`lead-analytics`)

> **Status:** aprovada (2026-10-14)
> **Origem:** pedido do autor: avaliar leads e conversão sem Google Analytics
> **Profundidade:** deep

## Problem Statement

O site não mede nada. O autor não sabe quais canais trazem visitas, quais posts e cases
levam a contato, de onde veio quem mandou um briefing ou baixou o currículo, nem quanto
os agentes de IA usam as rotas de máquina. Ferramentas prontas exigem script no
navegador, o que o portão `no-client-js` proíbe, e a política de privacidade promete
"sem analytics".

## Goals

- Medir visitas humanas e de agentes sem JavaScript de cliente e sem cookie de visitante.
- Registrar conversões: briefing (`/api/hire`), currículo (`/api/cv`), MCP e cliques de saída (`/go/...`).
- Levar o percurso do dia para o aviso de briefing e de currículo.
- Guardar dado bruto por 30 dias e agregado por 24 meses, num formato documentado como contrato para um leitor futuro.
- Política de privacidade reescrita de forma honesta.

Decisões que os dados devem apoiar: onde divulgar, o que escrever, qualificar leads e
medir o uso por agentes.

## Non-Goals

- O leitor dos dados (script `.sh`, binário Rust ou TUI ratatui): feature separada, depois desta.
- Contador ao vivo, contador público e resumo semanal por e-mail.

## Context

- O middleware (`src/middleware.ts`) só acrescenta `x-robots-tag` no domínio `.hosted.app`.
- Posts, cases e anos do arquivo são pré-renderizados. O adapter Node os serve como arquivo estático **antes** do middleware, então só um pixel os enxerga.
- `/api/hire` e `/api/cv` já gravam no Firestore (`hire_requests`, `hire_request_network`, `cv_downloads`) e avisam pelo Resend, com TTL por campo `expiresAt`.
- `/api/mcp` é stateless, com um servidor por requisição.
- O runtime do App Hosting tem `minInstances: 0` e reduz a CPU depois da resposta, então gravação disparada sem esperar pode se perder.
- A política (`src/lib/privacy/policy.ts`) afirma hoje "O site não usa cookies, analytics, pixel de anúncio, gravação de sessão nem fingerprinting".

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| O middleware só define `x-robots-tag` | `src/middleware.ts:4` (`onRequest`) | sim |
| Post é pré-renderizado | `src/pages/[slug].astro:17` (`prerender = true`) | sim |
| Case de lab é pré-renderizado | `src/pages/lab/[slug].astro:11` | sim |
| Case de portfólio é pré-renderizado | `src/pages/portfolio/[slug].astro:11` | sim |
| Ano do arquivo é pré-renderizado | `src/pages/posts/arquivo/[year].astro:10` | sim |
| `Astro.isPrerendered` existe no contexto | `node_modules/astro/dist/types/public/context.d.ts:474` | sim |
| Cliente Firestore memoizado e reutilizável | `src/lib/hire/firestore.ts` (`getFirestoreClient`) | sim |
| IP do cliente atrás da Cloudflare | `src/lib/hire/rate-limit.ts:88` (`clientIpOf`) | sim |
| Notifier de briefing em texto | `src/lib/hire/notify.ts:35` (`resendNotifier`) | sim |
| Notifier de currículo | `src/lib/cv/download.ts:171` (`resendCvNotifier`) | sim |
| Handler de briefing | `src/lib/hire/handler.ts:65` (`handleHire`) | sim |
| Handler de currículo | `src/lib/cv/download.ts:101` (`handleCvDownload`) | sim |
| Tipos de contato do perfil | `src/content/schemas/profile.ts:26` (`kind: z.enum`) | sim |
| O portão de JS lista as rotas SSR à mão | `tests/design-system/no-client-js.build-test.ts:17` (`SSR_ROUTES`) | sim |
| Promessa atual da política | `src/lib/privacy/policy.ts:29` | sim |
| Fim do `body` no layout, onde entra o pixel | `src/layouts/BaseLayout.astro:164` | sim |
| Gerador do sitemap, base do conjunto de páginas conhecidas | `src/lib/aeo/sitemap.ts:38` (`buildSitemap`) | sim |
| O header `cf-ipcountry` chega na origem | Cloudflare, não verificável no código | suposição |

## Requirements

### P1 (MVP)

**Coleta**

1. [REQ-001] QUANDO uma página HTML de rota SSR responde a um GET com status 2xx ENTÃO o middleware DEVE registrar a visita (caminho sem query, classe, canal, UTMs, país e hash), esperando a gravação por no máximo 250 ms; falha ou timeout NÃO DEVE alterar a resposta.
2. [REQ-002] QUANDO uma página pré-renderizada é gerada ENTÃO ela DEVE conter `<img src="/v.gif" alt="" width="1" height="1">` no fim do `body`; página SSR NÃO DEVE conter o pixel.
3. [REQ-003] QUANDO `/v.gif` é requisitado ENTÃO o sistema DEVE responder sempre 200, GIF 1×1, `cache-control: no-store`, e só DEVE gravar se o Referer for do próprio domínio, o caminho do Referer pertencer ao conjunto de páginas do sitemap e o IP estiver dentro de 30 gravações por 10 minutos. Caminho e UTMs vêm do Referer; o canal é a UTM ou `unknown`.
4. [REQ-004] QUANDO uma requisição é medida ENTÃO o user agent DEVE classificá-la em `human`, `ai_agent`, `search_crawler` ou `other_bot`; só `human` e `ai_agent` geram evento bruto, e todas as classes incrementam o agregado.
5. [REQ-005] QUANDO o hash do visitante é calculado ENTÃO ele DEVE ser HMAC(HMAC(`ANALYTICS_HASH_SECRET`, dia em São Paulo), IP + user agent), truncado em 16 bytes, e o IP NÃO DEVE ser gravado. QUANDO o segredo está ausente ENTÃO a coleta DEVE ficar desligada sem erro.
6. [REQ-006] QUANDO o referrer é externo ENTÃO o canal DEVE ser derivado do host (`google`, `bing`, `duckduckgo`, `linkedin`, `github`, `x`, `bluesky`, `other`); sem referrer o canal DEVE ser `direct`; referrer do próprio domínio NÃO DEVE definir canal. As UTMs `source`, `medium` e `campaign` DEVEM ser limpas de caracteres de controle e truncadas em 64 caracteres.
7. [REQ-007] QUANDO um GET atinge uma superfície de máquina (`.md`, `/ia`, `llms.txt`, `AGENTS.md`, `/api/resume.*`) ENTÃO ele DEVE ser registrado como `kind: 'machine'`, com a classe do user agent.
8. [REQ-008] QUANDO a requisição traz o cookie `nm_self=1` ENTÃO nada DEVE ser gravado. QUANDO `/eu?token=<ANALYTICS_SELF_TOKEN>` é acessado com o token correto ENTÃO o sistema DEVE gravar `nm_self=1` (HttpOnly, Secure, SameSite=Lax, 1 ano); token errado ou ausente DEVE responder 404.

**Conversões**

9. [REQ-009] QUANDO `/api/hire` grava um briefing ou `/api/cv` grava um download ENTÃO o sistema DEVE registrar a conversão (`hire` ou `cv`, `refId` = id do registro) com o hash do visitante.
10. [REQ-010] QUANDO `/go/contato/<kind>` ou `/go/<lab|portfolio>/<slug>/<repo|live>` é requisitado ENTÃO o sistema DEVE registrar a conversão `outbound` e responder 302 para a URL da tabela fechada (perfil e projetos), com `no-store`; destino fora da tabela DEVE responder 404, e nenhuma URL de destino pode vir da requisição. Os links humanos de contato e de repo/live dos cases DEVEM apontar para `/go/...`; JSON-LD, `llms.txt` e MCP mantêm as URLs reais.
11. [REQ-011] QUANDO `/api/mcp` recebe JSON-RPC ENTÃO o sistema DEVE contar cada mensagem por método e, em `tools/call`, pelo nome da tool, sem jamais gravar argumentos.

**Uso dos dados**

12. [REQ-012] QUANDO o aviso de briefing ou de currículo é enviado ENTÃO ele DEVE incluir o percurso do dia daquele hash: canal de entrada, UTMs, país, páginas em ordem com HH:mm (São Paulo) e total de visitas. O bloco é em inglês, como o resto do e-mail; sem percurso, DEVE dizer "No journey recorded today.". Falha na consulta NÃO DEVE impedir o envio.
13. [REQ-013] QUANDO a feature entra no ar ENTÃO a política de privacidade DEVE descrever a medição (o que é coletado, o hash diário sem IP, os prazos de 30 dias e 24 meses, base legal de legítimo interesse) e `POLICY_UPDATED_AT` DEVE ser atualizado.
14. [REQ-014] QUANDO um evento é gravado ENTÃO ele DEVE ir para `analytics_events` com `expiresAt` em +30 dias, e o agregado para `analytics_daily/<YYYY-MM-DD>` por `FieldValue.increment`, com `expiresAt` em +24 meses, conforme o contrato de dados abaixo.

### P2 (Should Have)

15. [REQ-015] QUANDO `/api/mcp` recebe `initialize` com `clientInfo.name` ENTÃO o sistema DEVE contar o nome do cliente, truncado em 64 caracteres.

### P3 (Nice to Have)

Nenhum.

## Data Contract

Estável: o leitor futuro depende dele. Mudança aqui exige atualizar esta seção.

```
analytics_events/<auto-id>
  kind: 'pageview' | 'machine' | 'conversion'
  at: string            ISO-8601 UTC
  day: string           'YYYY-MM-DD' em America/Sao_Paulo
  expiresAt: Timestamp  at + 30 dias (TTL)
  visitor: string       hex, HMAC truncado em 16 bytes
  class: 'human' | 'ai_agent' | 'search_crawler' | 'other_bot'
  source: 'ssr' | 'pixel' | 'api'
  path: string          sem query
  channel: string       google | bing | duckduckgo | linkedin | github | x | bluesky | other | direct | unknown | internal | utm:<source>
  utm: { source, medium, campaign } | null
  country: string | null   ISO 3166-1 alpha-2; null vira a chave unknown no agregado
  conversion?: { type: 'hire' | 'cv' | 'outbound' | 'mcp', target?: string, refId?: string, tool?: string, client?: string }

analytics_daily/<YYYY-MM-DD>
  day: string
  expiresAt: Timestamp  fim do dia + 24 meses (TTL)
  traffic.<class>: number
  pages.<pathKey>: number          só human
  channels.<channel>: number       só human; internal não entra
  countries.<cc>: number           só human; sem país a chave é unknown
  machine.<class>: number
  conversions.<type>: number
  outbound.<targetKey>: number     só quando class é human
  mcp.methods.<method>: number
  mcp.tools.<tool>: number
  mcp.clients.<name>: number       (P2)
```

`outbound` só incrementa o agregado (`conversions.outbound` e `outbound.<targetKey>`) quando
`class` é `human`. Clique de outra classe não entra nesses contadores.

`pathKey` e `targetKey` são `encodeURIComponent(valor)` com `.` trocado por `%2E`, porque o
ponto quebra o field path do `update`.

## Edge Cases

- IP que muda no meio do dia (rede móvel) divide o percurso; NAT com o mesmo user agent junta duas pessoas. Limitação aceita.
- A virada da meia-noite em São Paulo corta o percurso; rotacionar o segredo no meio do dia também.
- Prefetch (`Sec-Purpose: prefetch` ou `Purpose: prefetch`) e `HEAD` não contam.
- Bloqueador de imagem ou Referer removido por extensão apaga a visita do pixel, sem erro.
- Pico viral passa de cerca de 1 escrita/s no doc diário e pode causar contenção: o incremento perdido é aceito, o evento bruto fica.
- JSON-RPC em lote no MCP conta cada mensagem.
- Briefing enviado por agente via API normalmente vem sem percurso.
- `cf-ipcountry` ausente ou `XX`/`T1`: o evento guarda `country: null` e o agregado usa a chave `unknown`.
- Se a Cloudflare passar a cachear HTML, as visitas SSR servidas do cache deixam de contar.
- Cold start soma latência ao primeiro request; o teto de 250 ms vale só para a gravação.

## Architecture Decisions

- **Coleta híbrida (middleware + pixel)** em vez de tirar o `prerender`: medir não justifica mudar a entrega das páginas mais lidas. Custo: o canal das páginas estáticas depende de UTM.
- **Hash diário** em vez de cookie (contradiz a promessa do site) ou de nenhuma identidade (sem percurso de lead).
- **Firestore, evento + `increment`** em vez de rollup agendado (exigiria Cloud Scheduler) ou Cloud Logging (sem agregado longo nem consulta em tempo de request).
- **Espera limitada a 250 ms** em vez de disparar sem esperar, por causa da CPU reduzida após a resposta.
- **Lógica pura em `src/lib/analytics/`** (classificação, canal, UTM, hash, evento, incrementos, tabela do `/go`, percurso); middleware e rotas são casca, e o store é uma interface com implementação Firestore e falsa.
- **Nenhum script novo:** o pixel é `<img>`, o `/go` é redirect, o portão `no-client-js` não muda.

## Constraints

- Nada de script, `client:*` ou cookie para visitante; `nm_self` existe só no navegador do autor.
- Segredos novos, nesta ordem para cada um: `firebase apphosting:secrets:set`, `grantaccess`, só então a entrada no `apphosting.yaml`.
  - `analytics-hash-secret` → `ANALYTICS_HASH_SECRET`
  - `analytics-self-token` → `ANALYTICS_SELF_TOKEN`
- Portões existentes não relaxam (`no-leak`, `no-client-js`, fonte única). A tabela do `/go` lê projetos e perfil por `src/lib/content`.
- Dentro da cota grátis do Firestore: até cerca de 10 mil visitas medidas por dia.
- Toda entrada (Referer, user agent, UTM, parâmetros do `/go` e do `/eu`) é validada e truncada no servidor.
- Políticas de TTL do Firestore criadas para `analytics_events.expiresAt` e `analytics_daily.expiresAt`.

## Out of Scope

| Item | Motivo |
|------|--------|
| Leitor dos dados (sh, Rust, TUI) | Feature separada; esta spec entrega o contrato |
| Contador ao vivo e contador público | Exigiria JS ou conflita com a regra do `StatItem` |
| Resumo semanal por e-mail | Exigiria agendador; dispensado pelo autor |
| Shard de contador para picos | YAGNI no tráfego atual |
| Score de bot da Cloudflare | Plano pago |
| Tool privada no MCP | Exige autenticação no MCP |

## Test Strategy

- **Unitário (Vitest, `tests/analytics/`):** classificação de user agent; canal por host; limpeza de UTM; hash (determinístico no dia, muda na virada de São Paulo, nunca contém o IP); montagem de evento e incrementos com escape de chave; tabela do `/go` (desconhecido → 404, destino nunca vem da query); gate do pixel; `/eu` com token certo e errado; percurso formatado; texto da política. Store falso, sem Firestore real.
- **Integração:** handlers de hire e de cv gravam a conversão e enviam o aviso mesmo com a consulta do percurso falhando; o middleware respeita os 250 ms com store lento.
- **Build-test:** páginas pré-renderizadas têm o pixel, páginas SSR não têm; `no-client-js` segue verde.
- **HTTP real:** `scripts/verify-aeo-routes.sh` cobre `/v.gif` (200, `image/gif`, `no-store`), `/go/...` (302 e 404) e `/eu` sem token (404).

## Grilling Log

Decisões levantadas e resolvidas no grilling (2026-10-14).

| # | Decisão | Resolução | Motivo |
|---|---------|-----------|--------|
| 1 | Como medir páginas pré-renderizadas | Híbrido: middleware SSR + pixel `<img>` | Mantém as páginas estáticas; aceita canal só por UTM nelas |
| 2 | Identidade do visitante | HMAC diário de IP + UA, IP nunca gravado | Liga lead ao percurso sem cookie |
| 3 | Retenção | 30 dias bruto, 24 meses agregado | Mesmo prazo do IP do formulário; comparação ano a ano |
| 4 | Onde ver os dados | Percurso no e-mail do lead; leitor local depois | Resumo semanal e tool MCP descartados |
| 5 | Saídas medidas | Contatos + repo/live dos cases via `/go`, tabela fechada | Mede interesse real sem open redirect |
| 6 | Armazenagem | Firestore evento + `increment` | Sem job agendado |
| 7 | O que é visita | GET HTML 2xx; superfícies de máquina em série própria | Separa leitura humana de consumo por agente |
| 8 | Classes de tráfego | human, ai_agent, search_crawler, other_bot; bruto só nas duas primeiras | Protege a cota de escritas |
| 9 | Latência no SSR | Espera de até 250 ms, falha silenciosa | CPU reduzida após a resposta |
| 10 | Fronteira do dia | Meia-noite de São Paulo | Mesmo fuso do `cvFileName` |
| 11 | O que guardar da URL | Caminho sem query, 3 UTMs (64), canal pelo host | Cardinalidade e privacidade |
| 12 | Visitas do autor | Cookie `nm_self` por `/eu?token=` | Nenhum visitante recebe cookie |
| 13 | Abuso do pixel | Referer próprio, caminho conhecido, limiter 30/10 min | Evita inflar contagem e cota |
| 14 | Segredo do hash | `analytics-hash-secret`; sem ele, coleta desligada | Falha segura |
| 15 | MCP | Método + tool, nunca argumentos; `clientInfo.name` em P2 | Uso por agentes sem conteúdo |
| 16 | Leitor dos dados | Fora desta spec (sh/Rust/TUI depois) | Pedido do autor; spec documenta o contrato |
| 17 | Contador "realtime" | Fora do escopo | Exigiria JS no visitante |

## Requirement Traceability

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| REQ-001 | Visita SSR pelo middleware, teto de 250 ms | P1 | Done (`7749b56`, `df0646b`, `bcb9eb1`) |
| REQ-002 | Pixel só em página pré-renderizada | P1 | Done (`16493d0`) |
| REQ-003 | `/v.gif` com gate de Referer, caminho e limiter | P1 | Done (`f2af95b`, `8a033b5`) |
| REQ-004 | Classificação de tráfego | P1 | Done (`6dc06c0`, `865af37`) |
| REQ-005 | Hash diário, IP nunca gravado | P1 | Done (`17f470c`, `df0646b`, `a8eac25`) |
| REQ-006 | Canal e UTMs | P1 | Done (`08c524a`, `865af37`) |
| REQ-007 | Série de superfícies de máquina | P1 | Done (`7749b56`, `bcb9eb1`) |
| REQ-008 | Exclusão do autor por `/eu` | P1 | Done (`df0646b`, `de70c4b`, `8a033b5`, `a8eac25`) |
| REQ-009 | Conversões hire e cv | P1 | Done (`884bc80`) |
| REQ-010 | `/go` com tabela fechada | P1 | Done (`a5325b3`, `0ff6ba5`, `51dede7`, `8a033b5`) |
| REQ-011 | MCP por método e tool | P1 | Done (`730fad5`) |
| REQ-012 | Percurso no aviso do lead | P1 | Done (`f768d12`, `884bc80`) |
| REQ-013 | Política de privacidade reescrita | P1 | Done (`5fd52a4`) |
| REQ-014 | Coleções e TTL conforme contrato | P1 | Done (`865af37`, `02b36be`, `a8eac25`) |
| REQ-015 | Nome do cliente MCP | P2 | Done (`730fad5`) |
