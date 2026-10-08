# ADR-001: Plataforma de hospedagem e modelo de deploy

> **Status:** accepted
> **Deciders:** nandomoreira
> **Date:** 2026-08-08
> **Spec:** [infra-deploy-spike](../specs/infra-deploy-spike/SPEC.md) — REQ-005, REQ-006, REQ-007, REQ-008

---

## Context

O projeto escolheu Astro 7 SSR no Firebase App Hosting, mas o adapter oficial da
plataforma (`@apphosting/astro-adapter`) está em 0.0.1 desde janeiro de 2025, com
versão única e 1.509 downloads/mês. Sem adapter mantido, não havia garantia de que um
build SSR do Astro subisse e respondesse no App Hosting, e toda a camada de máquina
(F5, F6, F7) depende de rotas de servidor funcionando.

Esse é o RISK-001 do `BRIEF.md` e a questão aberta Q1 do `PRD.md`. Enquanto ele não
fechasse, qualquer feature construída estaria apostando numa arquitetura não verificada.
Por isso F8.1 declara que o spike vem **antes de qualquer implementação de feature**.

O spike rodou em 2026-08-08, dentro do tempo de caixa de 2 dias.

---

## Decision Drivers

- Provar ou refutar o plano A em produção, não em ambiente local
- Não confundir falha de plataforma com falha de configuração do projeto (escopo mínimo)
- Ter um critério de parada declarado antes de começar, para o spike não virar projeto
- Deixar o resultado reproduzível por comando documentado (REQ-005)

---

## Considered Options

### Option 1: Astro 7 SSR com `@astrojs/node` standalone no App Hosting (plano A)

**Description:** `output: 'server'` com `@astrojs/node` em `mode: 'standalone'`, iniciado
pelo `runCommand` de um `apphosting.yaml` próprio.

**Pros:**

- Uma plataforma só para site e rotas de servidor
- `@astrojs/node` tem 2,7M downloads/mês e release na mesma data do core
- O autor já opera Firebase em três produtos

**Cons:**

- Configuração de execução manual, sem adapter oficial que a resolva

**Estimated Effort:** Low

---

### Option 2: `@apphosting/astro-adapter` oficial

**Description:** Usar o adapter da própria plataforma.

**Pros:**

- Integração declarada como oficial

**Cons:**

- 0.0.1, publicado em 23/01/2025, versão única, 1.509 downloads/mês
- Abandono numa dependência de infraestrutura é risco desproporcional

**Estimated Effort:** Low

---

### Option 3: Firebase Hosting clássico mais Cloud Functions (plano B)

**Description:** Site estático no Hosting clássico, com `/api/*` em Cloud Functions.

**Pros:**

- Caminho conhecido, sem depender de adapter

**Cons:**

- Duas superfícies de deploy para manter
- Reescreve as specs de `structured-resume`, `mcp-server`, `hire-endpoint` e `launch-hardening`

**Estimated Effort:** Medium

---

## Observation (2026-08-08)

Backend criado e publicado:

- **Backend:** `nandomoreira-dev`
- **Região:** `us-east4`
- **URL:** `https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app`
- **Cloud Run:** `projects/279171183748/locations/us-east4/services/nandomoreira-dev`

Saída de `bash scripts/verify-deployed.sh https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app`:

```
== REQ-006: / responds 200 ==
== REQ-003: /api/health responds 200 as JSON ==
== REQ-003: the platform is not allowed to cache it ==
== REQ-004: a second call returns a different payload ==
SPIKE PASSED: Astro SSR is live on App Hosting
```

Corpos observados em duas chamadas separadas por 3 segundos, que é o que refuta
pré-renderização e cache de borda:

```json
{"status":"ok","renderedAt":"2026-08-08T19:32:36.316Z","runtime":"astro-node-standalone"}
{"status":"ok","renderedAt":"2026-08-08T19:32:39.613Z","runtime":"astro-node-standalone"}
```

Cabeçalhos da resposta em produção: `HTTP/2 200`, `cache-control: no-store`,
`content-type: application/json; charset=utf-8`.

---

## Decision

**Option 1. Plano A confirmado.** Astro 7.2.0 SSR com `@astrojs/node` 11.1.0 em modo
standalone roda no Firebase App Hosting e serve rotas de servidor de verdade. RISK-001
está fechado e Q1 do PRD está respondida.

O plano B (Option 3) **não foi acionado** e permanece disponível apenas como saída caso
uma major futura do adapter ou da plataforma quebre esta configuração.

Duas decisões subordinadas, tomadas durante o spike:

### Região: `us-east4`, não `us-east1`

`BRIEF.md`, `PRD.md`, `MVP-SCOPE.md` e a spec declaravam `us-east1`. **O App Hosting não
oferece essa região.** As suportadas, conferidas em 2026-08-08 na API de locations do
projeto, são `asia-east1`, `asia-southeast1`, `europe-west4`, `us-central1`, `us-east4` e
`us-east5`. `us-east4` é a mais próxima do que os documentos pretendiam, e os quatro
documentos foram corrigidos.

O backend serve com `servingLocality: GLOBAL_ACCESS`, então a região não determina a
latência do visitante. Ela importa para co-locar o Firestore de `hire_requests` (F7), que
deve ser criado em `us-east4`.

### Deploy: fonte local no spike, repositório conectado desde 2026-08-09

**Emenda de 2026-08-09.** O backend passou a ter o repositório GitHub conectado
(`codebase.repository` preenchido, `rolloutPolicy: {"codebaseBranch": "main"}`), então
push em `main` dispara build e rollout automaticamente, sem comando. Isso resolve a
rastreabilidade que o parágrafo abaixo apontava como pendente, e antecipa a recomendação
que estava reservada para o cutover da sprint 6. O comando
`firebase apphosting:rollouts:create <backend> --git-commit <sha>` passou a funcionar.

Fica uma ressalva: `firebase.json` ainda declara `"alwaysDeployFromSource": true`. Com o
repositório conectado, um `firebase deploy --only apphosting` publica o **fonte local**,
inclusive o que não está commitado, por cima do que o GitHub construiu, e a origem do que
está servindo volta a ser desconhecida. É saída de emergência, não caminho normal.

**Estado original, durante o spike:** o backend não tinha repositório conectado e o deploy
era, com o fonte local como origem do build:

```bash
firebase deploy --only apphosting --project nandomoreira-dev
```

Consequência daquela configuração: `firebase apphosting:rollouts:create <backend> --git-commit <sha>`,
originalmente documentado na Task 9 do plano, **não funcionava**, e o plano foi corrigido.

`firebase.json` e `.firebaserc` passam a ser versionados: sem eles, um clone limpo não
reproduz o deploy e REQ-005 não se sustenta.

---

## Consequences

### Positive

- Sprint 2 está liberada. O gate F8.1 fecha aqui
- As specs de `structured-resume`, `mcp-server`, `hire-endpoint` e `launch-hardening` podem ser escritas contra rotas de servidor Astro, sem reescrita para Cloud Functions
- O spike não é descartado: a configuração validada é a base do projeto
- `/api/health` fica como sonda permanente de que o SSR está vivo

### Negative

- Sem adapter oficial, uma major do Astro ou do `@astrojs/node` pode exigir revalidar `runCommand` e o caminho de `dist/server/entry.mjs`. `tests/config/adapter.build-test.ts` cobre esse acoplamento
- Deploy a partir do fonte local não amarra o que está no ar a um commit, o que dificulta responder "qual código está servindo". Conectar o GitHub resolve, e é o caminho recomendado antes do cutover (sprint 6)

### Neutral

- Cold start do Cloud Run com `minInstances: 0` pode passar de 1s na primeira chamada, o que EC-012 do PRD já declara aceitável
- O Firestore de F7 fica preso a `us-east4` por co-locação

---

## Links

- Spec: `docs/specs/infra-deploy-spike/SPEC.md`
- Plano: `docs/plans/2026-08-08-infra-deploy-spike.md` (Task 9, Task 10)
- ADR relacionado: [ADR-002 — encerramento em SIGTERM](002-graceful-shutdown.md)
- Roadmap: `docs/specs/00-roadmap.md` (sprint 1)
