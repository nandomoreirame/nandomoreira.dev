# Spec: Spike de infraestrutura e deploy

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 1
> **PRD:** F8 (F8.1, F8.2, F8.3)
> **Status:** implemented
> **Criado:** 2026-08-08
> **Concluído:** 2026-08-08 — plano A confirmado em [ADR-001](../../adr/001-hosting-platform.md)

## Problem Statement

O projeto escolheu Astro 7 SSR no Firebase App Hosting, mas o adapter oficial da
plataforma (`@apphosting/astro-adapter`) está em 0.0.1 desde janeiro de 2025, com
versão única e 1.509 downloads/mês. Sem adapter oficial mantido, não há garantia de
que um build SSR do Astro sobe e responde no App Hosting, e toda a camada de máquina
(F5, F6, F7) depende de rotas de servidor funcionando.

Este é o RISK-001 do `BRIEF.md` e a questão aberta Q1 do `PRD.md`. Enquanto ele não
fecha, qualquer feature construída está apostando numa arquitetura não verificada.

## Goals

- Um Astro 7 com `@astrojs/node` em modo standalone respondendo em produção na URL
  do App Hosting, com uma rota que prova execução no servidor (não conteúdo estático).
- Deploy reproduzível a partir de um comando documentado, sem passo manual no console.
- Decisão registrada em ADR: plano A confirmado, ou plano B acionado com o motivo.
- Tempo de caixa: 2 dias. Estourou, o plano B é acionado por decurso de prazo.

## Context

*No momento em que esta spec foi escrita:* o repositório estava vazio, só com `docs/`.
Não havia `package.json`, `astro.config.mjs` nem repositório git inicializado. Este
spike foi literalmente a primeira linha de código do projeto.

O projeto Firebase `nandomoreira-dev` já existe, região `us-east4`, e hoje serve o
site antigo (`svelte-nandomoreira.dev`, arquivado) via Firebase Hosting clássico. O
App Hosting exige plano Blaze. O domínio `nandomoreira.dev` permanece apontado para o
site antigo durante todo o spike: nada aqui toca produção do domínio.

O App Hosting constrói a partir de um `apphosting.yaml` no repositório e roda a
aplicação em Cloud Run. Para frameworks sem adapter oficial, o caminho é declarar
`buildCommand` e `runCommand` próprios e fazer o servidor escutar em `0.0.0.0` na
porta indicada por `PORT`.

## Verified Claims

Quando esta spec foi escrita, toda afirmação abaixo era **assumption** — converter cada
uma em fato ou refutá-la era exatamente o propósito do spike. A coluna `Verified`
registra o resultado.

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| O repositório contém apenas `docs/`, sem `package.json` nem git inicializado | n/a | yes (inspeção do diretório em 2026-08-08, antes da Task 1) |
| `astro@7.2.0` e `@astrojs/node@11.1.0` são as versões correntes e saudáveis | `docs/PRD.md:491` (tabela "Dependências verificadas", aferida em 2026-08-07) | yes (instaladas e pinadas em `package.json`) |
| O adapter Node standalone gera o entrypoint em `dist/server/entry.mjs` | `tests/config/adapter.build-test.ts` | yes |
| O servidor standalone respeita as variáveis `HOST` e `PORT` do ambiente | `scripts/verify-local-server.sh` | yes |
| O App Hosting injeta `PORT` no contêiner e exige bind em `0.0.0.0` | `apphosting.yaml` | yes (deploy responde em produção) |
| `apphosting.yaml` aceita `scripts.buildCommand` e `scripts.runCommand` próprios | `apphosting.yaml` | yes |
| O projeto `nandomoreira-dev` está em plano Blaze | n/a | yes (backend criado com sucesso) |
| A região do App Hosting é `us-east4` | `docs/adr/001-hosting-platform.md` | yes (`us-east1`, declarada nos documentos estratégicos, não existe no serviço) |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO o projeto é construído com `npm run build` ENTÃO o sistema DEVE produzir um build de servidor Astro 7 com `@astrojs/node` em `mode: 'standalone'`.
2. **[REQ-002]** QUANDO o servidor é iniciado ENTÃO ele DEVE escutar no host `0.0.0.0` e na porta indicada pela variável de ambiente `PORT`, com um valor padrão quando ela estiver ausente.
3. **[REQ-003]** QUANDO um cliente requisita `/api/health` ENTÃO o sistema DEVE responder 200 com `content-type: application/json` e um corpo contendo o instante da requisição, provando execução no servidor e não conteúdo pré-renderizado.
4. **[REQ-004]** QUANDO `/api/health` é requisitado duas vezes em momentos distintos ENTÃO os dois corpos de resposta DEVEM diferir, o que refuta a hipótese de resposta estática cacheada.
5. **[REQ-005]** QUANDO o deploy é disparado pelo comando documentado ENTÃO o App Hosting DEVE construir e publicar o backend sem intervenção manual no console.
6. **[REQ-006]** QUANDO o backend está publicado ENTÃO `/` e `/api/health` DEVEM responder 200 na URL do App Hosting.
7. **[REQ-007]** QUANDO o spike conclui ENTÃO o resultado DEVE ser registrado em `docs/adr/001-hosting-platform.md`, declarando plano A confirmado ou plano B acionado, com o erro observado.
8. **[REQ-008]** QUANDO o spike falha em qualquer um dos requisitos acima ENTÃO o plano B DEVE ser acionado: site estático no Firebase Hosting clássico com os endpoints de `/api/*` em Cloud Functions.

### P2 (Should Have)

1. **[REQ-009]** QUANDO o servidor recebe `SIGTERM` ENTÃO ele DEVE encerrar as conexões em curso antes de sair, para que o Cloud Run não derrube requisição em voo durante um rollout.
2. **[REQ-010]** QUANDO `apphosting.yaml` é lido ENTÃO ele DEVE declarar `minInstances: 0` e um teto de instâncias, para que um site pessoal não gere custo ocioso.

### P3 (Nice to Have)

 1. **[REQ-011]** QUANDO o build roda em CI ENTÃO lint e type-check DEVEM rodar antes do build, falhando cedo.

## Edge Cases

- **`PORT` ausente no ambiente local** — O servidor cai para uma porta padrão (4321) em vez de falhar. Sem isso, `npm start` local não roda.
- **Bind em `localhost` em vez de `0.0.0.0`** — O contêiner sobe, o health check do Cloud Run não alcança o processo e o deploy falha com timeout. É o modo de falha mais provável do plano A e o primeiro a ser checado se REQ-006 falhar.
- **`runCommand` apontando para caminho errado do entrypoint** — Falha em runtime, não em build. O log do Cloud Run mostra `Cannot find module`. A Task 4 valida o caminho localmente antes de qualquer deploy.
- **Build passa e runtime falha** — São estágios distintos no App Hosting. Um build verde não é evidência de deploy funcional; só REQ-006 é.
- **Rollout demora e o comando da CLI expira** — `apphosting:rollouts:create` bloqueia esperando o build. O timeout do comando não significa que o build não foi criado. Verificar o estado real do backend antes de qualquer retry.
- **Resposta de `/api/health` idêntica entre chamadas** — Indica pré-renderização ou cache de borda, não SSR. REQ-004 existe exatamente para pegar esse falso positivo.
- **Plano Blaze não habilitado** — O App Hosting recusa a criação do backend. É bloqueio de conta, não de código; resolver antes da Task 6.
- **Prazo de 2 dias estourado** — Aciona REQ-008 por decurso de prazo, mesmo sem erro técnico conclusivo. O objetivo do spike é decidir, não é vencer a plataforma.

## Architecture Decisions

1. **`@astrojs/node` standalone em vez de `@apphosting/astro-adapter`** — O adapter oficial está em 0.0.1 desde janeiro de 2025, versão única, sem manutenção. `@astrojs/node` tem 2,7M downloads/mês e release na mesma data do core. Alternativa descartada: usar o oficial e aceitar o risco de abandono numa dependência de infraestrutura.
2. **`mode: 'standalone'` em vez de `mode: 'middleware'`** — Standalone traz o servidor HTTP pronto, que é o que o Cloud Run precisa. Middleware exigiria escrever e manter um servidor Express só para adaptar, sem ganho.
3. **Rota de prova em `/api/health`, não na home** — Uma home dinâmica pode ser confundida com página pré-renderizada. Um endpoint que retorna o instante da requisição só pode responder valores diferentes se estiver executando no servidor.
4. **Plano B declarado antes de começar** — Site estático no Hosting clássico com `/api/*` em Cloud Functions. Declarar a saída antes evita a armadilha de insistir na plataforma além do tempo de caixa.
5. **Escopo mínimo deliberado** — Sem Tailwind, sem content collections, sem design system. Qualquer coisa a mais confunde falha de plataforma com falha de configuração do projeto. Tailwind entra na sprint 2, quando o terreno já está provado.
6. **`minInstances: 0`** — Aceita cold start, que o PRD já declara aceitável em EC-012. Um site pessoal com instância quente permanente é custo sem contrapartida.

## Grilling Log

Herda o grilling do discovery (`PRD.md`, "Resolvidas no grilling"). As linhas abaixo
são as decisões desta feature em particular.

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Como provar SSR sem ambiguidade | Endpoint `/api/health` com o instante da requisição, comparado entre duas chamadas | Conteúdo estático não muda entre requisições. É a prova mais barata e não admite falso positivo |
| 2 | O que entra no spike | Só Astro, adapter Node e `apphosting.yaml` | Cada dependência a mais é uma causa raiz a mais quando falhar |
| 3 | Quando desistir do plano A | 2 dias de caixa, ou falha em REQ-006 sem causa identificada | Sem critério de parada declarado antes, spike vira projeto |
| 4 | O spike vira o projeto ou é jogado fora | Vira o projeto | O repositório está vazio; a configuração validada é exatamente a base da sprint 2 |
| 5 | Domínio durante o spike | Permanece no site antigo | O cutover é da sprint 6 e depende do MCP validado (Flow 3 do PRD) |

## Constraints

- Astro 7.2.0, `@astrojs/node` 11.1.0, TypeScript 5.x. Versões aferidas em 2026-08-07.
- Firebase App Hosting, projeto `nandomoreira-dev`, região `us-east4`, plano Blaze. O App Hosting suporta apenas `asia-east1`, `asia-southeast1`, `europe-west4`, `us-central1`, `us-east4` e `us-east5`; `us-east1`, declarada nos documentos estratégicos até 2026-08-08, nunca esteve disponível.
- Tempo de caixa de 2 dias, com 10 a 15 horas disponíveis por semana.
- O domínio `nandomoreira.dev` não pode ser tocado nesta feature.
- Nenhuma feature de produto pode começar antes que este spike feche (F8.1).

## Out of Scope

| Item | Reason |
|------|--------|
| Tailwind CSS e design system | Sprint 2. Aqui só adicionaria variável ao diagnóstico |
| Content Collections | Sprint 2 (`content-data-layer`) |
| Qualquer rota de produto (`/`, `/projetos`, `/api/mcp`) | Sprints seguintes. A home do spike é um placeholder |
| Cutover do domínio | Sprint 6 (`launch-hardening`) |
| Lighthouse, acessibilidade, SEO | Sprint 6. Nada aqui é conteúdo final |
| Firestore, serviço de e-mail | Sprint 5 (`hire-endpoint`) |
| Pipeline de CI completo | REQ-011 é P3; o mínimo é o deploy reproduzível por comando |

## Test Strategy

- **Unit:** o build do Astro não tem lógica de negócio a testar. O teste real é de contrato do endpoint: `/api/health` responde 200, `application/json`, e com corpo variável entre chamadas.
- **Integration:** subir o build localmente (`node dist/server/entry.mjs` com `PORT` definido) e exercitar `/` e `/api/health` por HTTP. Isto valida REQ-001 a REQ-004 antes de qualquer deploy, que é o estágio caro.
- **E2E:** as mesmas duas rotas contra a URL pública do App Hosting depois do rollout. Valida REQ-005 e REQ-006. É o único teste que fecha o spike, porque só ele exercita a plataforma.
- **Não automatizar:** a verificação de plataforma é feita uma vez. Um harness de teste para um spike de 2 dias custa mais que o spike.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Build Astro 7 com adapter Node standalone | P1 | Done |
| REQ-002 | Servidor escuta em `0.0.0.0` e na porta de `PORT` | P1 | Done |
| REQ-003 | `/api/health` responde 200 JSON com o instante da requisição | P1 | Done |
| REQ-004 | Duas chamadas a `/api/health` retornam corpos distintos | P1 | Done |
| REQ-005 | Deploy reproduzível por comando documentado | P1 | Done |
| REQ-006 | `/` e `/api/health` respondem 200 na URL do App Hosting | P1 | Done |
| REQ-007 | Resultado registrado em ADR | P1 | Done |
| REQ-008 | Plano B acionado em caso de falha | P1 | N/A (plano B não acionado) |
| REQ-009 | Encerramento gracioso em `SIGTERM` | P2 | Done |
| REQ-010 | `minInstances: 0` e teto de instâncias | P2 | Done |
| REQ-011 | Lint e type-check antes do build em CI | P3 | Pending (P3, coberto localmente por `npm run verify`) |
