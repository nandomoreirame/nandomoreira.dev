# nandomoreira.dev

Portfólio e blog de Fernando Moreira, escrito para pessoa e para agente. As páginas contam o trabalho; o [servidor MCP](https://nandomoreira.dev/mcp), o currículo em [JSON Resume](https://nandomoreira.dev/api/resume.json) e o markdown por rota entregam a mesma informação sem renderizar HTML.

Produção: [https://nandomoreira.dev](https://nandomoreira.dev)

## Stack

Astro 7 (`output: 'server'`) com `@astrojs/node` em modo standalone, Tailwind CSS 4, Zod nas content collections e Vitest. O processo sobe no Firebase App Hosting, backend `nandomoreira-dev`, região `us-east4`.

Exige Node.js 22 ou superior.

## Começar

```bash
npm install
npm run dev
```

Abra [http://localhost:4321](http://localhost:4321). O servidor de desenvolvimento escuta em `[::1]:4321`.

Rascunho de post aparece na listagem no `astro dev` e no deploy de staging. O build de produção omite rascunho.

Para exercitar o servidor de produção na máquina:

```bash
npm run build
npm start
```

`npm start` sobe `dist/server/entry.mjs`. `scripts/verify-local-server.sh` usa `PORT=8080`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`prebuild` apaga `dist/`) |
| `npm start` | Sobe o build |
| `npm run check` | `astro check` |
| `npm test` | Vitest, só `tests/**/*.test.ts` |
| `npm run test:build` | Asserções sobre `dist/`. Exige build antes |
| `npm run verify` | `check`, teste, build e `test:build` |

`npm test` precisa passar num clone limpo e não lê `dist/`. Asserção que depende do build mora em `tests/**/*.build-test.ts`.

Caminho com colchetes precisa de aspas:

```bash
npx vitest run "tests/catalog/case-page.test.ts"
```

## Conteúdo

Três collections em `src/content/`: `projects` (cases), `posts` e `profile`. O schema Zod de cada uma quebra o build se o markdown for inválido.

Só `src/lib/content/projects.ts`, `src/lib/content/profile.ts` e `src/lib/content/posts.ts` leem a collection. O resto importa de `src/lib/content/index.ts`.

Páginas e componentes são casca. Regra de negócio fica em função pura sob `src/lib/`.

## Rotas

Pessoa: `/`, `/portfolio`, `/lab`, `/posts`, `/sobre`, `/setup`, `/now`, `/contato`, `/curriculo`, `/mcp`, `/privacidade`.

Agente, em inglês:

| Rota | Conteúdo |
| --- | --- |
| `/llms.txt`, `/llms-full.txt` | Resumo do site para modelo |
| `/AGENTS.md` | Briefing do agente |
| `/ai-index.json` | Índice das páginas |
| `/<caminho>.md` e `/<caminho>/ia` | Markdown da página, se ela estiver no registro |
| `/api/mcp` | MCP Streamable HTTP, protocolo `2025-11-25` |
| `/api/resume.json`, `/api/resume.txt` | Currículo |
| `/api/health` | `{ "runtime": "astro-node-standalone" }` |
| `POST /api/hire` | Contratação. Contato por e-mail fica fora das rotas de máquina |

Tools do MCP, declaradas em `src/lib/mcp/catalog.ts`: `get_profile`, `check_availability`, `list_projects`, `get_project`, `get_resume`.

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

`/api/mcp` responde 406 sem o header `Accept` de SSE.

## Variáveis de ambiente

Valores ficam no Secret Manager e no `.env` local (gitignored). O modelo versionado é `.env.example`. `apphosting.yaml` só declara segredo que já existe: um nome inexistente quebra o rollout.

| Variável | Efeito |
| --- | --- |
| `RESEND_API_KEY`, `HIRE_NOTIFY_TO`, `HIRE_NOTIFY_FROM` | `/api/hire` e `/api/cv`. Ausência falha ao carregar o módulo |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da service account para Firestore local. Em produção vale a identidade do App Hosting |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Faixa atual em `/now`. Sem o trio, a seção some |
| `OPENXBL_API_KEY` | Jogos recentes do Xbox em `/now`. Sem a chave, a seção some |
| `GITHUB_TOKEN` | Opcional. A API pública do GitHub responde sem token |
| `ANALYTICS_HASH_SECRET`, `ANALYTICS_SELF_TOKEN` | Contagem de visitas. Segredo curto desliga a medição |

O refresh token do Spotify sai de:

```bash
SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-refresh-token.mjs
```

Cadastre `http://127.0.0.1:8888/callback` no app do Spotify antes. O script imprime só o `refresh_token`.

Homologação não recebe segredo: `/api/hire` responde erro e não notifica.

## Publicar

Push em `main` dispara build e rollout no App Hosting. O que está no ar é `traffic.current.splits[].build`, conferido pela API. O ciclo leva cerca de 3 minutos.

`firebase deploy --only apphosting` publica a árvore local, inclusive o que não está commitado, por cima do que o GitHub construiu. O caminho normal é o push.

Homologação no homelab, com rascunho incluído:

```bash
bash scripts/deploy-staging.sh
```

Sobe em [http://nandomoreira.home](http://nandomoreira.home). A evidência é a linha `STAGING DEPLOY PASSED`.

Outros scripts de verificação terminam numa linha de marca (`ALL LOCAL CHECKS PASSED`, `SCHEMA GATE PASSED`, `AEO ROUTES PASSED`). Essa linha é a evidência: um `cmd | grep` no fim mascara a falha do estágio anterior.

## Onde continuar

| Arquivo | Assunto |
| --- | --- |
| `CLAUDE.md` | Comandos, camadas, portões, deploy e armadilhas já pagas |
| `docs/adr/` | Decisões de hospedagem e desligamento |
| `docs/specs/` | Requisitos por feature |
| `docs/plans/` | Planos de implementação |

Commits deste repositório usam gitmoji (`✨ feat(...)`, `🔧 chore(...)`).

Repositório privado. Não há licença de uso aberto.
