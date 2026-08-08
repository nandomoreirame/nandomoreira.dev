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
| Zero JavaScript de cliente | `tests/design-system/no-client-js.test.ts` | Ilha acidental nas rotas P0 |
| Fonte única | `tests/content/single-source.test.ts` | `getCollection` fora da camada de acesso |
| Schema quebra o build | `scripts/verify-schema-gate.sh` | Conteúdo inválido chegando em produção |
| CTA primário único | `tests/home/single-primary-cta.test.ts` | Segundo botão de peso igual na home |
| Vazamento nas rotas de máquina | `tests/aeo/no-leak.test.ts` | E-mail, chave, caminho absoluto, IP privado |

Ao criar um portão novo, prove que ele fica vermelho antes de considerá-lo pronto. Um
portão que nunca falhou não é portão.

## Restrições que não são preferência

- **Zero JavaScript de cliente no P0.** Nenhuma diretiva `client:*`. A primeira ilha interativa é o filtro do catálogo (F11), que é v1.2.
- **O token `border` (`#262626`) reprova WCAG AA**, com 1,31:1 sobre o fundo. Serve como separador decorativo e **nunca** como único delimitador de alvo interativo ou meio de transmitir informação. Contorno que precisa ser percebido usa `border-strong` ou `primary`.
- **Nenhum número sem narrativa.** `StatItem` lança se receber `value` sem `context`. Cerca de 700 das 964 estrelas do GitHub vêm de temas Jekyll de 2018, e exibir o agregado sem contexto seria enganoso (RISK-004).
- **Todo case precisa de ao menos um link.** `repoUrl` e `liveUrl` não podem ser ambos nulos: um case sem link não tem evidência verificável, e o schema falha o build.
- **Todo serviço anunciado precisa de um case que o comprove.** A validação cruzada roda no frontmatter de `Services.astro` e quebra o build se apontar para slug inexistente.
- **Nenhum e-mail nas rotas de máquina.** Contato humano na home; agente usa `POST /api/hire`.
- **Tema escuro único.** Sem alternância claro/escuro, sem `prefers-color-scheme`.
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

O deploy sai do **fonte local**, não de repositório GitHub conectado
(`"alwaysDeployFromSource": true` no `firebase.json`):

```bash
firebase deploy --only apphosting --project nandomoreira-dev
```

Ele **bloqueia de 2 a 3 minutos** esperando o build. Rode em background, nunca em
foreground com timeout curto: um timeout mata a CLI depois de o build já existir no
servidor, e o retry cego devolve `HTTP 409`. Antes de qualquer retry, consulte o estado
real: `traffic.current.splits[].build` da REST API do App Hosting é a autoridade sobre o
que está servindo, e a lista de `rollouts` pode vir vazia mesmo com o deploy no ar.

`firebase apphosting:rollouts:create --git-commit <sha>` **não funciona** aqui, porque
exige repositório conectado. Conectar o GitHub é o caminho recomendado antes do cutover
(sprint 6), para que dê para responder qual commit está servindo.

## Importar config de outros agentes

Existem `~/.codex/config.toml` e `~/.gemini/settings.json` na máquina. Se quiser trazer
MCP servers, slash commands, subagents ou skills de lá, responda `/import` para ver o que
é importável, depois `/import --yes=<digest>` para aplicar. Se `/import` não estiver
disponível nesta superfície, rode `claude import` no terminal.
