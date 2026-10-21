# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual

**Sprint 1 concluída.** O spike de infraestrutura fechou em 2026-08-08 com o plano A
confirmado: Astro 7 SSR com `@astrojs/node` standalone está no ar no App Hosting
(`docs/adr/001-hosting-platform.md`). A sprint 2 está liberada e nada dela foi
implementado ainda.

Antes de escrever qualquer coisa, leia a spec e o plano da feature em que vai mexer. As
decisões já foram tomadas e estão registradas; reabri-las sem motivo custa mais do que
segui-las.

Commits deste repositório usam **gitmoji** (`✨ feat(...)`, `🔧 chore(...)`). É convenção
do projeto e sobrepõe a regra global de não usar emoji.

## Idioma

- **Camada humana em pt-BR, camada de máquina em inglês.** Páginas, copy, cases e conteúdo visível: português. `llms.txt`, `AGENTS.md`, `robots.txt`, `resume.json`, `resume.txt` e as respostas do MCP: inglês. Sem exceção, nos dois sentidos.
- **Documentos gerados (`docs/`) em pt-BR**, com requisitos no formato `QUANDO [evento] ENTÃO o sistema DEVE [resposta]`. Isso é um override deliberado do padrão do framework (inglês). Está registrado no Decision Log de `docs/specs/00-roadmap.md`.
- **Identificadores sempre em inglês**: slugs, nomes de arquivo, símbolos de código, chaves de frontmatter, REQ-IDs, comentários no código.

## Comandos

```bash
npm run dev            # astro dev
npm run build          # astro build
npm start              # node ./dist/server/entry.mjs (o build de produção)
npm run check          # astro check (type-check)
npm test               # vitest run — só a suíte unitária
npm run test:watch     # vitest
npm run test:build     # asserções sobre a saída do build (exige build antes)
npm run verify         # check + test + build + test:build, o portão completo
```

**`npm test` roda apenas `tests/**/*.test.ts` e precisa passar em clone limpo.**
Asserção que lê `dist/` vai em `tests/**/*.build-test.ts`, que roda por
`npm run test:build` com `vitest.build.config.ts`. Misturar as duas deixa a suíte
vermelha logo depois de um `git clone`, porque `dist/` é gitignored.

Um arquivo de teste só:

```bash
npx vitest run tests/content/project-schema.test.ts
```

Caminho com colchetes precisa de aspas, senão o shell expande como glob:

```bash
npx vitest run "tests/catalog/case-page.test.ts"
```

Scripts de verificação que exercitam o build real por HTTP (cada um sobe o servidor,
testa e derruba):

```bash
bash scripts/verify-local-server.sh                  # SSR de fato, antes de gastar um deploy
bash scripts/verify-deployed.sh <url-do-backend>     # fecha o spike contra produção
bash scripts/verify-schema-gate.sh                   # conteúdo inválido quebra o build (sprint 2)
bash scripts/verify-aeo-routes.sh                    # rotas de máquina, status e content-type (sprint 4)
```

Refresh token do Spotify para a página `/now`. Cadastre `http://127.0.0.1:8888/callback` no app do Spotify antes de rodar. O script imprime só o `refresh_token`.

```bash
SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-refresh-token.mjs
```

```bash
bash scripts/run-stats.sh                                     # instala o stats e abre a TUI (visitas, funil e leads)
cargo run --release --manifest-path tools/stats/Cargo.toml   # stats: visitas, funil e leads (TUI)
cargo test --manifest-path tools/stats/Cargo.toml            # testes do leitor
```

`verify-local-server.sh` usa `PORT=8080` por padrão. Se a porta estiver ocupada ele
falha com `FAIL: the server died on startup` em vez de validar o processo alheio;
passe `PORT=<livre>` para contornar.

Todos terminam com uma linha de marca (`ALL LOCAL CHECKS PASSED`, `SCHEMA GATE PASSED`,
`AEO ROUTES PASSED`). **A evidência é essa linha, nunca o código de saída**: o status de
um pipeline é o do último estágio, então um `cmd | grep` no fim mascara a falha.

## Arquitetura

### Stack

Astro 7.2.0 em `output: 'server'` com `@astrojs/node` em modo standalone, publicado no
Firebase App Hosting (`nandomoreira-dev`, `us-east4`) via `apphosting.yaml` próprio.
Tailwind CSS 4 com o tema em `@theme` no CSS. Zod para schema de conteúdo e de payload.
Vitest, com renderização de componente por `experimental_AstroContainer`.

O adapter oficial da plataforma (`@apphosting/astro-adapter`) foi **descartado**: 0.0.1
desde janeiro de 2025, versão única. É a origem do RISK-001 e o motivo de a sprint 1 ser
um spike.

### Fonte única de verdade

Duas Content Collections (`projects` e `profile`) alimentam seis superfícies: home,
catálogo, `llms.txt`, JSON-LD, currículo e as tools do MCP.

**Só `src/lib/content/projects.ts` e `src/lib/content/profile.ts` podem chamar
`getCollection`.** Todo o resto importa de `src/lib/content/index.ts`. Um teste
(`tests/content/single-source.test.ts`) varre `src/` e reprova qualquer outra chamada.

Sem essa regra, "fonte única" vira intenção: a primeira página com pressa lê direto, a
redação de confidencialidade deixa de ser aplicada e as superfícies divergem. O modo de
falha é o pior possível para este produto, porque o agente responde errado com
confiança.

### Camadas

```
src/
  content/          collections + schemas Zod (a verdade)
  lib/content/      camada de acesso (o único caminho de leitura)
  lib/catalog/      lógica do catálogo: links visíveis, JSON-LD por case
  lib/home/         lógica da home: validação serviço-case, JSON-LD Person
  lib/aeo/          geradores das rotas de máquina, URLs absolutas, escape de JSON-LD
  components/ui/    design system compartilhado
  components/{catalog,home,layout}/  seções e composições por superfície
  layouts/          BaseLayout: skip link, main, container, canonical, WebSite JSON-LD
  pages/            rotas, cascas finas sobre lib/
```

A lógica mora em funções puras sob `lib/`, testáveis sem subir o Astro. Páginas e
componentes são casca. Quando uma decisão aparecer dentro de um `.astro`, ela provavelmente
está no lugar errado.

### Visão IA (`docs/specs/ai-view`)

Toda página coberta tem `<página>.md` (home: `/index.md`) e `<página>/ia` (home: `/ia`),
servidas pelas rotas genéricas `src/pages/[...path].md.ts` e `src/pages/[...path]/ia.astro`.
As duas consultam `markdownForPath` (`src/lib/ai-view/registry.ts`), a **única** tabela
caminho → markdown; caminho fora dela responde 404. Página nova só ganha visão IA quando
entra no registro. O slug `ia` é reservado nos schemas. Rótulos em `src/lib/ai-view/labels.ts`.

### JSON-LD, dividido de propósito

- `Person` — `src/lib/home/person-ld.ts`, derivado do perfil.
- `SoftwareApplication` ou `CreativeWork` — `src/lib/catalog/json-ld.ts`, por case. Tem `liveUrl` é aplicação; senão obra.
- `WebSite` — `src/lib/aeo/website-ld.ts`, global, injetado no `BaseLayout`.

A serialização é **sempre** por `serialiseJsonLd` de `src/lib/aeo/json-ld.ts`, que escapa
`<`. Reimplementar o escape localmente é como uma das cópias fica para trás quando a
regra mudar, e o teste reprova isso.

## Portões automatizados

Sete testes transformam em falha regras que os documentos declaram mas que nada
impediria de violar. **Nunca relaxe um deles para fazer a suíte passar: corrija o
código.**

| Portão | Arquivo | O que impede |
|---|---|---|
| Contraste | `tests/design-system/contrast.test.ts` | Par de cor abaixo de 4,5:1 |
| Literal fora da escala | `tests/design-system/no-ad-hoc-values.test.ts` | Hex solto e valor arbitrário do Tailwind em `src/` |
| JavaScript de cliente sob lista de permissão | `tests/design-system/no-client-js.build-test.ts` | Script fora da lista, o do ponteiro acima de 2,25 KB gzip, a prévia de áudio fora de `/now` ou acima de 1 KB gzip, ou a paleta de comandos fora de um chunk sob demanda ou acima de 4 KB gzip |
| Fonte única | `tests/content/single-source.test.ts` | `getCollection` fora da camada de acesso |
| Schema quebra o build | `scripts/verify-schema-gate.sh` | Conteúdo inválido chegando em produção |
| CTA primário único | `tests/home/single-primary-cta.test.ts` | Botão primary fora do hero, ou mais de um nele (zero é aceito desde 2026-10-19, quando o hero perdeu os botões por decisão do Fernando) |
| Vazamento nas rotas de máquina | `tests/aeo/no-leak.test.ts` | E-mail, chave, caminho absoluto, IP privado |

Ao criar um portão novo, prove que ele fica vermelho antes de considerá-lo pronto. Um
portão que nunca falhou não é portão.

## Restrições que não são preferência

- **JavaScript de cliente só por exceção nomeada.** Existe um único script, o do `PointerField`, em todas as páginas: o efeito de ponteiro (generative-case-art, 2026-10-07), o botão Copiar da visão IA (ai-view, 2026-10-08), a memória das escolhas do modo leitura mais o Esc (2026-10-16) e o carregador da paleta de comandos (command-palette, 2026-10-19), juntos em até 2304 B gzip. O orçamento era 1536 B; subiu em 2026-10-19 por decisão do Fernando porque o Vite envolve todo `import()` de cliente no auxiliar `__vitePreload` (cerca de 717 B gzip). Funcionalidade nova entra nesse script ou exige decisão registrada. As outras exceções: a prévia de áudio de `/now` (now-page, REQ-027, 2026-10-11), um segundo script só nessa rota, em até 1 KB gzip, marcado por `data-now-preview`; e o módulo da paleta (command-palette, D1, 2026-10-19), em `src/scripts/palette.ts`, marcado por `data-command-palette`, baixado sob demanda pelo carregador do `PointerField`, em até 4 KB gzip e nunca como `<script>` da página. E o boot de tema (theme-modes, REQ-010, 2026-10-20), inline no `<head>` de todas as páginas, marcado por `data-theme-boot`, em até 512 B gzip, dono também do clique do botão de tema. O portão reprova qualquer outro script. Nenhuma diretiva `client:*`.
- **A medição de visitas é server-side** (middleware, `/v.gif` e `/go`). O pixel é um `<img>`, não um script, e não entra na exceção de JavaScript de cliente.
- **O token `border` (`#222226`) reprova WCAG AA**, com 1,24:1 sobre o fundo. Serve como separador decorativo e **nunca** como único delimitador de alvo interativo ou meio de transmitir informação. Contorno que precisa ser percebido usa `border-strong` ou `primary`.
- **Nenhum número sem narrativa.** `StatItem` lança se receber `value` sem `context`. Cerca de 700 das 964 estrelas do GitHub vêm de temas Jekyll de 2018, e exibir o agregado sem contexto seria enganoso (RISK-004).
- **Todo case precisa de ao menos um link.** `repoUrl` e `liveUrl` não podem ser ambos nulos: um case sem link não tem evidência verificável, e o schema falha o build.
- **Todo serviço anunciado precisa de um case que o comprove.** A validação cruzada roda no frontmatter de `Services.astro` e quebra o build se apontar para slug inexistente.
- **Nenhum e-mail nas rotas de máquina.** Contato humano na home; agente usa `POST /api/hire`.
- **Dois temas, Noir e Paper** (theme-modes, 2026-10-20, decisão do Fernando). A primeira visita segue `prefers-color-scheme`; o botão do header e a ação `T` da paleta trocam e lembram em `localStorage.theme`. Os tokens Paper vivem em dois blocos idênticos em `global.css` (`@media` do sistema e `[data-theme="paper"]`), comparados por `tests/design-system/paper-contrast.test.ts`, que também mede todo token de texto a 4,5:1 sobre as três superfícies nos dois temas. Os blocos de código usam o port Shiki do Terminal Noir (`src/lib/code/themes/`, cópia byte a byte de `../terminalnoir/ports/shiki`). O modo leitura dos posts continua com preto, sépia e claro, e vence o tema do site enquanto está ligado.
- **`robots.txt` é orientação, não controle de acesso.** A premissa é crawler hostil que o ignora; a proteção real é não haver nada sensível nas rotas públicas.

## Fluxo RPI

```
docs/{BRIEF,PRD,MVP-SCOPE,DESIGN-GUIDELINES}.md   documentos estratégicos (aprovados)
docs/specs/00-roadmap.md                          6 sprints, 11 features, dependências
docs/specs/<slug>/SPEC.md                         requisitos QUANDO/ENTÃO/DEVE + REQ-IDs
docs/specs/<slug>/STATE.md                        fase e decisões daquela feature
docs/plans/YYYY-MM-DD-<slug>.md                   tarefas atômicas TDD, ligadas a REQ-IDs
```

Cada tarefa de plano traz Red-Green-Refactor completo, com o código de teste e de
implementação. TDD não é opcional aqui: a tarefa começa pelo teste vermelho.

**Specs e planos existem para as sprints 1 a 4.** `structured-resume`, `mcp-server`,
`hire-endpoint` e `launch-hardening` estão sem spec de propósito: são rotas de servidor e
cutover, e o plano B do spike (Hosting estático mais Cloud Functions) produziria uma
arquitetura diferente para as quatro.

### Ordem que não pode ser invertida

1. **Sprint 1 bloqueia tudo** (F8.1 do PRD). Nenhuma feature começa antes de `docs/adr/001-hosting-platform.md` existir com uma decisão declarada: plano A confirmado ou plano B acionado.
2. **Sprint 2**: `design-system-foundation` e `content-data-layer` em paralelo, `project-catalog` depois dos dois.
3. **Sprint 3**: os 8 cases **antes** da home. O `MVP-SCOPE.md` lista "começar pelo hero bonito" como armadilha, e escrever os cases junto com a estrutura é a única mitigação real do RISK-003, que é o risco de maior probabilidade do projeto.
4. **Fim da sprint 4** é a linha do corte de emergência (RISK-005): F1, F2, F3, F4, F5 e F8 já constituem lançamento válido. Se o prazo estourar, pula-se a sprint 5 e F6/F7 entram com o site no ar.
5. **Cutover só depois do MCP validado com cliente real.** Apontar o domínio antes derrubaria justamente o argumento central do posicionamento.

## Deploy

Backend `nandomoreira-dev` em `us-east4`, servindo em
`https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app`. **`us-east1` não existe
no App Hosting**; as regiões disponíveis são `asia-east1`, `asia-southeast1`,
`europe-west4`, `us-central1`, `us-east4` e `us-east5`.

**O rollout é automático desde 2026-08-09.** O backend tem o repositório GitHub
conectado e `rolloutPolicy: {"codebaseBranch": "main"}`, então **push em `main` dispara
build e rollout sozinho**. Nada precisa ser rodado à mão para publicar.

Confirme pela API, não pelo console. O build automático se distingue do manual pelo campo
`branch` do `source.codebase`, que só vem preenchido no automático:

```bash
T=$(gcloud auth print-access-token)
BASE="https://firebaseapphosting.googleapis.com/v1beta/projects/nandomoreira-dev/locations/us-east4/backends/nandomoreira-dev"
curl -s -H "Authorization: Bearer $T" "$BASE/traffic"   # quem está servindo
curl -s -H "Authorization: Bearer $T" "$BASE/builds"    # branch=main => automático
```

O ciclo push → `SUCCEEDED` leva cerca de 3 minutos. `traffic.current.splits[].build` é a
autoridade sobre o que está no ar; o campo `commit` costuma vir vazio, então não tente
descobrir por ele qual commit está servindo.

**Armadilha:** `firebase.json` mantém `"alwaysDeployFromSource": true`. Com o GitHub
conectado, isso é uma saída de emergência, não o caminho normal, e um
`firebase deploy --only apphosting` publica **o fonte local**, inclusive o que não está
commitado, por cima do que o GitHub construiu. A partir daí ninguém mais sabe qual commit
está servindo, que é justamente o que a conexão resolveu. Use só conscientemente, e
prefira corrigir em `main`.

Se precisar mesmo do deploy manual, ele **bloqueia de 2 a 3 minutos** esperando o build:
rode em background, nunca em foreground com timeout curto, porque o timeout mata a CLI
depois de o build já existir no servidor e o retry cego devolve `HTTP 409`.

`firebase apphosting:rollouts:create --git-commit <sha>` passou a funcionar, porque exige
repositório conectado e agora há um. Serve para promover um commit específico sem esperar
o rollout automático, ou para voltar a um commit anterior.

### Ligar as fontes da `/now`

O `apphosting.yaml` só declara segredo que já existe no Secret Manager. Um nome
declarado e inexistente quebra o rollout. Para cada fonte, nesta ordem:

1. `firebase apphosting:secrets:set <nome>`
2. `firebase apphosting:secrets:grantaccess <nome> --backend nandomoreira-dev`
3. Só então acrescentar a entrada no `apphosting.yaml` e fazer push.

| Segredo | Variável |
|---|---|
| `now-openxbl-api-key` | `OPENXBL_API_KEY` |
| `now-spotify-client-id` | `SPOTIFY_CLIENT_ID` |
| `now-spotify-client-secret` | `SPOTIFY_CLIENT_SECRET` |
| `now-spotify-refresh-token` | `SPOTIFY_REFRESH_TOKEN` |
| `now-github-token` | `GITHUB_TOKEN` |

O `GITHUB_TOKEN` (fine-grained, só repositórios públicos em leitura) existe por causa do calendário de contribuições: a API GraphQL do GitHub exige token mesmo para dado público. A lista de repositórios funcionaria sem ele.

**Armadilha:** o `firebase apphosting:secrets:set` oferece "adicionar ao apphosting.yaml" e, rodado fora da pasta do projeto, **sobrescreve o arquivo inteiro** só com a entrada nova (aconteceu em 2026-10-19). Responda não a essa pergunta e acrescente a entrada à mão.

## Lançamentos (`/releases/17`)

Um arquivo por dia de trabalho em `src/data/releases/<data>.md`, só frontmatter (`version`, `date`, `title`, `summary`, `highlights` de 2 a 6), validado por Zod em `src/lib/releases/data.ts`. Não é content collection de propósito: coleção nova só chega ao Vitest depois que o `astro dev` regrava o `.astro/data-store.json`.

```bash
npm run releases:draft -- [AAAA-MM-DD]            # commits visíveis do dia e a tag (v17.<commits no fim do dia>)
npm run releases:draft -- [AAAA-MM-DD] --write    # cria o arquivo com [[PREENCHER]], que reprova o schema
npm run releases:check                            # avisa dias com feat/fix/perf sem lançamento; sempre sai 0
```

O texto é escrito pelo comando global `/release-day [data]`, que lê o `--json` do script, escreve em pt-BR o que o visitante percebe (não commit por commit) e mostra para revisão. Dia cujos commits visíveis não mudam nada para quem visita entra em `src/data/releases/skipped.json` (`{"AAAA-MM-DD": "motivo"}`). O `npm run verify` termina com o `releases:check`, que só avisa.

## Homologação no homelab

`bash scripts/deploy-staging.sh` publica a árvore local (rascunhos não commitados
incluídos) em **http://nandomoreira.home**, um container Docker no homelab atrás do
Caddy, com o nome resolvido pelo Pi-hole. É um build `--mode staging`, o único além do
`astro dev` em que os rascunhos aparecem (`showDrafts` em `src/lib/content/posts.ts`).
Produção não muda: continua sendo push em `main`.

- Arquivos: `deploy/staging/Dockerfile`, `deploy/staging/compose.yml`, `scripts/deploy-staging.sh`.
- O container escuta só em `127.0.0.1:4321`; o Caddy responde com `X-Robots-Tag: noindex`.
- Nenhum segredo vai para lá, então `/api/hire` responde erro na homologação e nunca notifica.
- O SSH do homelab passa pelo Tailscale SSH, que às vezes pede uma verificação no navegador antes de conectar.
- A evidência é a linha `STAGING DEPLOY PASSED`.

## Importar config de outros agentes

Existem `~/.codex/config.toml` e `~/.gemini/settings.json` na máquina. Se quiser trazer
MCP servers, slash commands, subagents ou skills de lá, responda `/import` para ver o que
é importável, depois `/import --yes=<digest>` para aplicar. Se `/import` não estiver
disponível nesta superfície, rode `claude import` no terminal.

## Armadilhas já pagas (movidas do ~/.claude/CLAUDE.md)

As duas lições abaixo saíram do `CLAUDE.md` global em 12/08/2026. Elas são específicas
deste projeto (Astro), então carregavam em toda sessão de toda máquina sem servir a
ninguém fora daqui. Aqui carregam exatamente quando importam.

- Cachear HTML na Cloudflare faz as visitas SSR servidas do cache deixarem de contar: a contagem acontece no middleware, e o pixel só cobre página pré-renderizada.

### Astro: `Astro.redirect` em página com `prerender = true` devolve 200 + meta refresh, nunca 301

- Uma página pré-renderizada não tem como emitir status HTTP, então o `Astro.redirect('/x', 301)` dentro dela vira um documento com `<title>Redirecting to: /x` e `<meta http-equiv="refresh" content="0;url=/x">`, servido com **200**. O redirect "funciona" no navegador, então passa despercebido; para crawler e cache não é redirect nenhum. Aconteceu duas vezes no mesmo repo (`/notas/[slug]` e `/projetos/[slug]`), e os testes estavam VERDES porque liam o fonte procurando a string `301` — teste de fonte não distingue as duas coisas, por construção. FIX: ou declarar em `redirects: {}` no `astro.config.mjs` (o adapter emite 301 de verdade; aceita padrão com param, `'/velho/[slug]': '/[slug]'`), ou remover o `prerender` e deixar a rota SSR. O único portão que pega isso é HTTP real: `curl -s -o /dev/null -w '%{http_code}'` contra o build rodando. A página irmã sem `prerender` no mesmo diretório respondendo 301 corretamente é o que torna o sintoma confuso.

### Astro dev server NÃO incorpora arquivo NOVO de content collection (store congelado)

- O `astro dev` persiste as content collections em `.astro/data-store.json` e serve a coleção a partir do estado carregado no boot. **Um arquivo `.md` CRIADO depois que o servidor subiu não entra**, e reescrever o arquivo NÃO destrava (o watcher do glob não reprocessa o `add`). Sintoma: a página lista N itens enquanto o disco tem N+M, e o `npm run build` na MESMA árvore serve todos corretamente. Diagnóstico decisivo: comparar o mtime de `.astro/data-store.json` com o dos arquivos novos, e grepar os slugs no store — os que faltam na página são exatamente os que faltam no store. **Isso vale para arquivo novo; a EDIÇÃO de um arquivo que o store já conhece normalmente recarrega.** Caso irmão, mais traiçoeiro: acrescentar um CAMPO NOVO ao schema Zod e usá-lo num arquivo existente também pode servir o valor antigo em silêncio, porque o Zod faz strip de chave desconhecida no parse cacheado — sem erro, sem aviso, só o fallback. FIX: reiniciar o dev server (`astro dev stop` e subir de novo); apagar `.astro/data-store.json` antes ajuda. **Mas reiniciar NÃO resolve quando o strip já foi gravado em disco** (aconteceu em 08/10/2026 com o campo `art`): um `astro dev` que estava rodando com o schema antigo reprocessou os `.md` alterados dois segundos depois da edição, descartou o campo e gravou a entrada no store junto com o **digest do arquivo NOVO**. Daí em diante todo boot vê digest igual, não reprocessa e serve a entrada sem o campo, para sempre. Diagnóstico: uma rota temporária que devolve `Object.keys((await getEntry('projects', '<slug>')).data)` mostra a chave ausente, e o mesmo `digest` no `.astro/data-store.json` aparece sem a chave (o `node_modules/.astro/data-store.json` pode estar certo, e não é o que o dev lê). Aqui o FIX obrigatório é `npx astro dev stop && rm .astro/data-store.json && npm run dev`. Prevenção: ao acrescentar campo ao schema, pare o dev server ANTES de editar os `.md`. NUNCA conclua "faltou implementar" de uma página do dev server sem conferir o build (`npm run build` + rodar `dist/server/entry.mjs`) — o build lê do disco e é a autoridade.
- **Antes de mudar o schema e editar `.md`, confira se há dev server com `./node_modules/.bin/astro dev status` (ou `ss -ltnp | grep :4321`), nunca com `pgrep -f 'astro dev'`:** o processo aparece como `node .../astro/bin/astro.mjs dev`, e esse padrão não casa. Em 17/10/2026 isso deu "nenhum dev server" com um rodando desde a véspera, e os 11 posts com `extras`/`keyPoints` novos foram gravados sem os campos. Diagnóstico decisivo: `node -e` com `unflatten` do `devalue` sobre o `.astro/data-store.json` e comparar `Object.keys(entry.data)` com as chaves de `entry.rendered.metadata.frontmatter`; chave que só existe no frontmatter foi descartada pelo schema velho.
- **Mudar o pipeline de markdown (transformer do Shiki em `src/lib/code/toolbar.ts`, plugins do satteri) NÃO invalida o HTML dos posts no dev:** o `rendered` de cada entrada fica no `.astro/data-store.json` com o digest do `.md`, e o digest não muda. Em 17/10/2026 o dev serviu o markup antigo do bloco de código com o CSS novo (barra sem estilo), enquanto o build estava certo. FIX: `./node_modules/.bin/astro dev stop && rm .astro/data-store.json && npm run dev`. Confira pelo HTML (`curl ... | grep code-header`), não pelo olho.
- **CUIDADO ao apagar `.astro/data-store.json`: ele só é (re)escrito no SHUTDOWN do dev server.** Nem `npm run build` nem `npx astro sync` nem `astro check` o recriam, e o `astro dev` recusa uma segunda instância (`Dev server already running ... pid N`), então não dá para regenerá-lo em paralelo ao servidor do usuário. Com o arquivo ausente, todo `getCollection` dentro do Vitest devolve **coleção vazia** (`The collection "X" does not exist or is empty`) e a suíte cai em massa — no nandomoreira.dev foram 47 testes em 12 arquivos, a maioria pré-existente, o que parece regressão do seu próprio trabalho e não é. Só recuperei rodando `npx astro dev stop` e subindo o dev de novo. Corolário: qualquer suíte que renderiza página lendo content collection depende desse artefato gitignored, então `npm test` num clone limpo que nunca rodou `astro dev` NÃO passa, por mais que o CLAUDE.md do projeto prometa. Antes de apagar o store para "invalidar cache", tenha o caminho de volta.
