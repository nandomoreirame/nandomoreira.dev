# Spec: Página Agora (`/now`)

> **Status:** aprovada (2026-10-11)
> **Origem:** pedido do autor, no espírito do movimento /now de Derek Sivers (nownownow.com)
> **Profundidade:** standard

## Problem Statement

O site diz quem o autor é (`/sobre`), o que fez (`/portfolio`, `/lab`) e o que usa
(`/setup`), mas não o que ele está fazendo **neste momento**. A resposta hoje está
espalhada (disponibilidade no perfil, rascunhos no teaser do blog) ou em lugar nenhum
(projetos ativos, o que joga, o que ouve). Uma página `/now` responde à pergunta "o que
você contaria a um amigo que não vê há um ano", com prioridades declaradas e sinais
automáticos que não envelhecem sozinhos.

## Goals

- Rota `/now`, item **Agora** no menu principal, `/agora` redirecionando para ela.
- Seções: **Foco**, **Projetos em andamento**, **Escrevendo**, **Ouvindo**, **Jogando**.
- Projetos, Spotify e Xbox vêm de APIs externas no servidor; foco e jogos de reserva são curados à mão.
- Nenhum JavaScript de cliente novo. Nenhuma falha externa derruba a página.
- Visão IA (`/now.md`, `/now/ia`) como as demais páginas cobertas.

## Non-Goals

- "Tocando agora" do Spotify e atualização ao vivo sem recarregar (descartado: exigiria JS de cliente ou exporia presença).
- Seções Lendo/Estudando e Vida/Lugar.
- Tool `get_now` no MCP.
- Inscrição no diretório nownownow.com (o autor faz à mão, depois do deploy).

## Context

- Molde existente: `/setup` (`src/lib/setup/setup.ts` com dados + `setupMarkdown`, página casca em `src/pages/setup.astro`, registro em `src/lib/ai-view/registry.ts`, `src/lib/aeo/sitemap.ts`, `src/lib/aeo/ai-index.ts`).
- O menu é a lista `items` em `src/components/layout/SiteNav.astro` (desktop e mobile leem a mesma lista).
- Rascunhos: `getUpcomingPosts()` já devolve os rascunhos em todos os modos para o teaser "Rascunhos em andamento" de `/posts`, sem link (as páginas de rascunho só existem em dev).
- Disponibilidade: `profile.availability` (`status`, `detail`, `updatedAt`).
- Segredos de produção vêm do Secret Manager declarados em `apphosting.yaml` (padrão do `/api/hire`).
- Portões que a página precisa atravessar: `no-client-js` (lista `SSR_ROUTES`), `no-leak` (rotas de máquina), contraste, literais fora da escala, fonte única.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| Rascunhos por título já disponíveis em produção, sem link | `src/lib/content/posts.ts:112` (`getUpcomingPosts`) | sim |
| Limite do teaser de rascunhos é 5 | `src/components/posts/upcoming-limit.ts:2` | sim |
| Redirects declarados em `astro.config.mjs` emitem 301 real | `astro.config.mjs:39` + armadilha registrada no `CLAUDE.md` | sim |
| Menu tem uma única lista para desktop e mobile | `src/components/layout/SiteNav.astro:12-18` | sim |
| Usuário do GitHub é `nandomoreirame` | `src/content/profile/profile.md:89` | sim |
| Projects têm `repoUrl` opcional, base para casar repo com case | `src/content/schemas/project.ts:38` | sim |
| O portão de JS enumera as rotas SSR à mão | `tests/design-system/no-client-js.build-test.ts` (`SSR_ROUTES`) | sim |

## Requirements

### P1 (MVP)

1. [REQ-001] QUANDO `/now` é requisitada ENTÃO o sistema DEVE responder 200, renderizada no servidor a cada requisição (sem `prerender`), com o cabeçalho "Agora" e a data "Atualizada em" vinda de `NOW_UPDATED_AT`.
2. [REQ-002] QUANDO `/agora` é requisitada ENTÃO o sistema DEVE responder 301 para `/now`, declarado em `redirects` do `astro.config.mjs`.
3. [REQ-003] QUANDO o menu principal renderiza ENTÃO ele DEVE exibir o item **Agora** (`/now`) entre Setup e Sobre, com `aria-current="page"` quando a página atual é `/now`.
4. [REQ-004] QUANDO a seção Foco renderiza ENTÃO ela DEVE mostrar as prioridades curadas (`NOW_FOCUS`), o que o autor está recusando no momento (`NOW_DECLINING`) e o `detail` de `profile.availability`.
5. [REQ-005] QUANDO a seção Projetos em andamento renderiza ENTÃO ela DEVE listar até 5 repositórios **públicos** de `nandomoreirame` com push nos últimos 30 dias, sem forks, sem arquivados e sem os nomes de `NOW_REPO_EXCLUDE` (inicial: `.dotfiles`, `dotfiles`, `nandomoreirame`), do mais recente ao mais antigo, com nome, descrição, linguagem e data do último push. Repositório privado nunca aparece, mesmo com `GITHUB_TOKEN` presente.
6. [REQ-006] QUANDO um repositório listado coincide com o `repoUrl` de um case ENTÃO o item DEVE apontar para a página do case; senão, para o repositório no GitHub.
7. [REQ-007] QUANDO a seção Escrevendo renderiza ENTÃO ela DEVE mostrar o último post publicado (com link) e os títulos dos rascunhos de `getUpcomingPosts()`, até `UPCOMING_LIMIT`, sem link.
8. [REQ-008] QUANDO a seção Ouvindo renderiza ENTÃO ela DEVE listar as últimas 5 faixas distintas tocadas no Spotify do autor (faixa, artista, link para `open.spotify.com` e o dia em que tocou: "hoje", "ontem" ou data curta, no fuso `America/Sao_Paulo`, nunca o horário), obtidas no servidor pelo endpoint `recently-played` com refresh token.
9. [REQ-009] QUANDO a seção Jogando renderiza ENTÃO ela DEVE mostrar, pela OpenXBL, o jogo em execução (se houver) e até 5 títulos jogados recentemente com a data da última sessão, ignorando os jogos de `NOW_GAME_EXCLUDE` (inicial: `Microsoft Jewel`) e completando os 5 com os seguintes do histórico.
10. [REQ-010] QUANDO a OpenXBL falha, não está configurada ou devolve lista vazia ENTÃO a seção Jogando DEVE exibir a lista curada `NOW_GAMES` em vez dela.
11. [REQ-011] QUANDO uma fonte externa (GitHub, Spotify, OpenXBL) falha, estoura o timeout de 2,5 s ou não tem credencial ENTÃO só a seção dela DEVE degradar (reserva ou estado vazio com texto); a página DEVE continuar respondendo 200.
12. [REQ-012] QUANDO uma fonte externa responde com sucesso ENTÃO o resultado DEVE ficar em cache em memória por fonte (GitHub 30 min, Spotify e Xbox 5 min); QUANDO a renovação falha com cache existente ENTÃO o sistema DEVE servir o último valor bom.
13. [REQ-013] QUANDO uma fonte externa falha ENTÃO o servidor DEVE registrar o erro sem incluir token, chave ou corpo da resposta.
14. [REQ-014] QUANDO o build termina ENTÃO `/now` DEVE estar na lista de rotas SSR do portão de JS e não DEVE carregar script além do único permitido.
15. [REQ-015] QUANDO `/now.md` ou `/now/ia` é requisitada ENTÃO o sistema DEVE servir a visão IA da página pelo registro `markdownForPath`, com as mesmas seções, passando pelo portão de vazamento.
16. [REQ-019] QUANDO `/now` responde 200 ENTÃO a resposta DEVE declarar `cache-control: public, max-age=60, s-maxage=300`.
17. [REQ-016] QUANDO o sitemap e o `ai-index.json` são gerados ENTÃO eles DEVEM incluir `/now`.
18. [REQ-017] QUANDO as credenciais de produção são configuradas ENTÃO elas DEVEM vir do Secret Manager por `apphosting.yaml` (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `OPENXBL_API_KEY`, `GITHUB_TOKEN` opcional), e a ausência de qualquer uma NÃO DEVE impedir o boot.

### P2 (Should Have)

19. [REQ-018] QUANDO o autor precisa gerar o refresh token do Spotify ENTÃO um script (`scripts/spotify-refresh-token.mjs`) DEVE conduzir o fluxo authorization code em `localhost` com o escopo `user-read-recently-played` e imprimir o token.

## Edge Cases

- Spotify devolve a mesma faixa várias vezes seguidas: deduplicar por id antes de cortar em 5.
- OpenXBL responde 200 com presença "Online" sem título, ou só com apps (Home, Netflix): filtrar apps, mostrar só jogos.
- GitHub sem nenhum push em 30 dias: estado vazio com texto, nunca lista de repositórios antigos.
- Rate limit do GitHub sem token (60/h por IP): coberto pelo cache de 30 min; 403 conta como falha (REQ-011/012).
- Homologação (`nandomoreira.home`) não recebe segredos: todas as seções externas mostram reserva ou estado vazio, e isso é o comportamento esperado.
- Rascunho sem título não existe (schema exige); zero rascunhos esconde a sublista.

## Architecture Decisions

- **SSR por requisição, sem polling.** "Tempo real" significa atualizado a cada carregamento (com cache), nunca ao vivo. Descartado: polling no script único (exceção nova ao portão de JS) e "tocando agora" (expõe presença em tempo real).
- **Cache em duas camadas.** Em memória por fonte (stale-on-error) e no CDN por 5 min. Atraso máximo aceito: cerca de 10 min.
- **Credencial ausente degrada, não derruba.** Diferente do `/api/hire`, que falha alto no boot: aqui a página é conteúdo opcional e a homologação roda sem segredos de propósito.
- **Copy curada rascunhada pelo agente e revisada pelo autor** antes do commit; jogos de reserva marcados com `TODO(author)`.

## Technical Constraints

- Lógica em funções puras sob `src/lib/now/`; fetchers recebem `fetch` e relógio injetados para teste sem rede.
- Nenhuma diretiva `client:*`, nenhum script novo.
- Serialização de data com o formatador já usado em `/setup` (`formatPolicyDate`).
- Leitura de posts e perfil só pela camada `src/lib/content/index.ts`.

## Assumptions

| Assumption | Como verificar na implementação |
|------------|---------------------------------|
| OpenXBL expõe o jogo atual em `/api/v2/presence` (ou equivalente) e os recentes em `/api/v2/player/titleHistory`, autenticados por `X-Authorization` | uma chamada real com a chave antes de escrever o parser; ajustar os fixtures ao payload real |
| Limite gratuito da OpenXBL é 150 req/h | painel do xbl.io |
| App Spotify em modo desenvolvimento funciona com conta Premium do dono como único usuário | autor tem Premium (confirmado); o script do REQ-018 prova na prática |
| `GET https://api.spotify.com/v1/me/player/recently-played?limit=50` devolve `items[].track` e `items[].played_at` | chamada real com o token gerado |

## Acceptance Criteria

- `npm run verify` verde, com `/now` no portão de JS.
- `bash scripts/verify-aeo-routes.sh` cobre `/now.md` e passa.
- HTTP real contra o build: `/now` 200, `/agora` 301 para `/now`, `/now.md` 200 `text/markdown`.
- Sem nenhuma credencial no ambiente, `/now` responde 200 com as reservas.

## Grilling Log

Decisões levantadas e resolvidas antes do build.

| # | Decisão | Resolução | Motivo |
|---|---------|-----------|--------|
| 1 | Spotify "em tempo real" sem JS de cliente | Só tocadas recentemente, via SSR | Não expõe presença ao vivo e não abre exceção no portão de JS |
| 2 | Fonte do Xbox | OpenXBL com reserva curada `NOW_GAMES` | Automático quando funciona, nunca seção vazia quando a API cai |
| 3 | Fonte dos projetos em andamento | Atividade pública do GitHub (30 dias, até 5) | Não envelhece sem manutenção |
| 4 | Seções extras | Foco/disponibilidade e Escrevendo (com títulos dos rascunhos) | Foco é o núcleo do conceito /now; rascunhos já são públicos por título no `/posts` |
| 5 | Repositórios privados | Nunca aparecem | Nome de repo privado é informação que não deve vazar |
| 6 | Repos de push diário sem ser projeto | Lista `NOW_REPO_EXCLUDE` curada | Evita ruído de dotfiles e do repo de perfil |
| 7 | Cache de CDN | `public, max-age=60, s-maxage=300` | Menos cold start contra as APIs; atraso de ~10 min é aceitável para uma página /now |
| 8 | Horário das faixas | Só o dia, nunca a hora | Não expõe a rotina |
| 9 | Autoria do conteúdo curado | Agente rascunha, autor revisa antes do commit | Destrava a implementação sem inventar fatos: jogos ficam como TODO |
| 10 | Conta Spotify | Premium (confirmado pelo autor) | Requisito do modo desenvolvimento |
| 11 | Rota | `/now` canônica, `/agora` com 301 | Convenção do nownownow, exigida para entrar no diretório |
| 12 | Jogo casual no histórico | `NOW_GAME_EXCLUDE` com `Microsoft Jewel`; o próximo do histórico ocupa a vaga | Pedido do autor depois de ver o histórico real |
