# Plan: Spike de infraestrutura e deploy

> **Spec:** `docs/specs/infra-deploy-spike/SPEC.md`

**Goal:** Provar em produção que um Astro 7 SSR com `@astrojs/node` standalone sobe e responde no Firebase App Hosting, ou acionar o plano B com o motivo registrado.
**Architecture:** Projeto Astro mínimo em `output: 'server'` com adapter Node em modo standalone. O entrypoint gerado (`dist/server/entry.mjs`) escuta em `0.0.0.0:$PORT` e é iniciado pelo `runCommand` declarado em `apphosting.yaml`. Uma única rota de API (`/api/health`) devolve o instante da requisição com `cache-control: no-store`, o que torna impossível confundir SSR com conteúdo pré-renderizado ou cacheado na borda.
**Tech Stack:** Astro 7.2.0, `@astrojs/node` 11.1.0, TypeScript 5.x, Vitest, Firebase App Hosting (`nandomoreira-dev`, `us-east4`).
**Total Tasks:** 10
**Estimated Complexity:** large (9+ tasks)

---

## Pré-requisitos (fora do plano, feitos pelo autor)

Estas três coisas não são tarefas do implementador porque envolvem git, console e
conta. Precisam estar prontas antes da Task 9.

1. Repositório git inicializado e publicado como `github.com/nandomoreirame/nandomoreira.dev`. Serve ao versionamento; o deploy em si sai do fonte local (ver Task 9 e ADR-001).
2. Projeto `nandomoreira-dev` no plano Blaze.
3. `firebase login` válido. Se a CLI retornar erro de autenticação, a Rule 13 autoriza rodar o login sem perguntar.

## Verificação de caminhos (§3.5)

`Files: Modify` verificados: **0**. Todos existentes: **n/a**. O repositório contém
apenas `docs/`, então as 10 tarefas são exclusivamente `Create`. Nenhuma reclassificação
create-vs-modify pendente.

---

### Task 1: Bootstrap do repositório Node

**Requirement:** REQ-001
**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `security-reviewer`, `consequences-reviewer`

**Step 1: Write the failing test**

Não há teste nesta tarefa: é criação de manifesto, sem lógica. O portão é o passo 4.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL com `npm error code ENOENT ... package.json`

**Step 3: Write minimal implementation**

`package.json`:

```json
{
  "name": "nandomoreira-dev",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "start": "node ./dist/server/entry.mjs",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/node": "11.1.0",
    "astro": "7.2.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^3.2.0"
  }
}
```

`astro` e `@astrojs/node` ficam **pinados sem caret**: são a dependência sob teste
neste spike, e uma resolução diferente da aferida em 2026-08-07 invalidaria o
resultado. As de desenvolvimento usam faixa.

`.gitignore`:

```gitignore
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.DS_Store
.firebase/
*.log
```

`.nvmrc`:

```
22
```

**Step 4: Run test to verify it passes**

Run: `npm install && node -e "const p=require('./package.json'); if(p.dependencies.astro!=='7.2.0') throw new Error('astro nao pinado'); console.log('OK')"`
Expected: PASS, imprime `OK` e `node_modules/` populado.

**Step 5: Commit**

Run: `/git commit`

---

### Task 2: Configurar Astro em SSR com adapter Node standalone

**Requirement:** REQ-001
**Files:**

- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `security-reviewer`, `consequences-reviewer`

**Step 1: Write the failing test**

`tests/config/adapter.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('astro node adapter (standalone)', () => {
  it('emits a standalone server entrypoint after build', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config/adapter.test.ts`
Expected: FAIL com `expected false to be true` (não há `dist/`).

**Step 3: Write minimal implementation**

`astro.config.mjs`:

```js
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nandomoreira.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npx vitest run tests/config/adapter.test.ts`
Expected: PASS. O build imprime `[@astrojs/node] Server built in ...` e o teste passa.

Se `dist/server/entry.mjs` não existir mas o build tiver passado, listar `dist/` e
corrigir o caminho em toda a Task 7 antes de seguir: a assumption sobre o nome do
entrypoint está registrada na spec justamente porque pode mudar entre majors.

**Step 5: Commit**

Run: `/git commit`

---

### Task 3: Teste de contrato de `/api/health`

**Requirement:** REQ-003, REQ-004
**Files:**

- Create: `tests/api/health.test.ts`
- Create: `vitest.config.ts`

**Team:**

- Track: backend
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `security-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

`tests/api/health.test.ts`:

```ts
import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/api/health';

const invoke = () => GET({} as unknown as APIContext);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('GET /api/health', () => {
  it('responds 200 with a JSON content type', async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('forbids caching, so an edge cache cannot fake a live response', async () => {
    const response = await invoke();

    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('reports the moment the request was served', async () => {
    const body = await (await invoke()).json();

    expect(body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(body.renderedAt))).toBe(false);
  });

  it('returns a different payload on a later call, which static output cannot do', async () => {
    const first = await (await invoke()).json();
    await sleep(5);
    const second = await (await invoke()).json();

    expect(second.renderedAt).not.toBe(first.renderedAt);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/health.test.ts`
Expected: FAIL com `Failed to resolve import "../../src/pages/api/health"`.

**Step 3: Write minimal implementation**

Nenhuma. Esta tarefa entrega apenas o teste vermelho. A implementação é a Task 4.

**Step 4: Run test to verify it passes**

Não se aplica: o teste DEVE terminar vermelho aqui. Verde nesta tarefa significa que
o arquivo de implementação já existe e a ordem Red-Green foi quebrada.

**Step 5: Commit**

Run: `/git commit`

---

### Task 4: Implementar `/api/health`

**Requirement:** REQ-003, REQ-004
**Files:**

- Create: `src/pages/api/health.ts`
- Test: `tests/api/health.test.ts`

**Team:**

- Track: backend
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `security-reviewer`, `type-safety-reviewer`, `test-reviewer`
**Depends on:** Task 3

**Step 1: Write the failing test**

Já escrito na Task 3.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/health.test.ts`
Expected: FAIL, os quatro casos vermelhos por import não resolvido.

**Step 3: Write minimal implementation**

`src/pages/api/health.ts`:

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      status: 'ok',
      renderedAt: new Date().toISOString(),
      runtime: 'astro-node-standalone',
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
```

`prerender = false` é obrigatório: sem ele o Astro pode resolver a rota em build e o
endpoint devolve o mesmo instante para sempre, que é exatamente o falso positivo que
a spec quer evitar (EC "Resposta de `/api/health` idêntica entre chamadas").

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/health.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 5: Home placeholder

**Requirement:** REQ-006
**Files:**

- Create: `src/pages/index.astro`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

`tests/pages/index.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home route', () => {
  it('exists so the deployed backend answers 200 on /', () => {
    expect(existsSync('src/pages/index.astro')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/index.test.ts`
Expected: FAIL com `expected false to be true`.

**Step 3: Write minimal implementation**

`src/pages/index.astro`:

```astro
---
const buildTarget = 'infra-deploy-spike';
---

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>nandomoreira.dev</title>
  </head>
  <body>
    <main>
      <h1>nandomoreira.dev</h1>
      <p>Spike de infraestrutura: {buildTarget}.</p>
      <p><a href="/api/health">/api/health</a></p>
    </main>
  </body>
</html>
```

O `noindex` é deliberado: enquanto o conteúdo é placeholder, indexá-lo contamina o
resultado de busca do domínio antes do lançamento. Ele sai na sprint 6.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pages/index.test.ts && npm run build`
Expected: PASS, e o build conclui sem erro.

**Step 5: Commit**

Run: `/git commit`

---

### Task 6: Validar bind em `0.0.0.0` e porta de `PORT` no build local

**Requirement:** REQ-002
**Files:**

- Create: `scripts/verify-local-server.sh`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `security-reviewer`, `consequences-reviewer`
**Depends on:** Task 4, Task 5

**Step 1: Write the failing test**

O próprio script é o teste. Ele sobe o build, exercita as duas rotas por HTTP real e
compara dois corpos de `/api/health`. É a validação de integração que a spec exige
antes de gastar um deploy.

**Step 2: Run test to verify it fails**

Run: `bash scripts/verify-local-server.sh`
Expected: FAIL com `No such file or directory`.

**Step 3: Write minimal implementation**

`scripts/verify-local-server.sh`:

```bash
#!/usr/bin/env bash
# Validates REQ-002/003/004 against the real build, before spending a deploy.
# Deliberately no `set -u`: the Bash tool sources a shell snapshot that
# references unbound vars and would abort the script.
set -eo pipefail

PORT="${PORT:-8080}"
HOST="${HOST:-0.0.0.0}"
BASE="http://127.0.0.1:${PORT}"

npm run build

HOST="$HOST" PORT="$PORT" node ./dist/server/entry.mjs &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "${BASE}/api/health" > /dev/null && break
  sleep 1
done

echo "== REQ-006: / responds 200 =="
curl -s -o /dev/null -w '%{http_code}\n' "${BASE}/" | grep -qx 200

echo "== REQ-003: /api/health responds 200 as JSON =="
curl -s -D - -o /tmp/health-1.json "${BASE}/api/health" | grep -qi 'content-type: application/json'

echo "== REQ-004: a second call returns a different payload =="
sleep 1
curl -s -o /tmp/health-2.json "${BASE}/api/health"
if diff -q /tmp/health-1.json /tmp/health-2.json > /dev/null; then
  echo "FAIL: identical payloads, the route is not server-rendered" >&2
  exit 1
fi

echo "== REQ-002: the process is bound on 0.0.0.0 =="
ss -ltnp 2>/dev/null | grep -q "0.0.0.0:${PORT}"

echo "ALL LOCAL CHECKS PASSED"
```

**Step 4: Run test to verify it passes**

Run: `chmod +x scripts/verify-local-server.sh && bash scripts/verify-local-server.sh`
Expected: PASS, termina com `ALL LOCAL CHECKS PASSED`.

Se a linha do `ss` falhar e as demais passarem, o servidor subiu em `localhost`. É o
modo de falha mais provável do plano A: corrigir o bind antes de qualquer deploy,
porque no Cloud Run ele se manifesta como timeout de health check e o log não diz o
motivo.

**Step 5: Commit**

Run: `/git commit`

---

### Task 7: Declarar `apphosting.yaml`

**Requirement:** REQ-005, REQ-010
**Files:**

- Create: `apphosting.yaml`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `security-reviewer`, `consequences-reviewer`
**Depends on:** Task 6

**Step 1: Write the failing test**

`tests/config/apphosting.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = readFileSync('apphosting.yaml', 'utf8');

describe('apphosting.yaml', () => {
  it('starts the standalone entrypoint the build actually emits', () => {
    expect(manifest).toContain('node ./dist/server/entry.mjs');
  });

  it('binds on all interfaces, or Cloud Run health checks never reach the process', () => {
    expect(manifest).toContain('0.0.0.0');
  });

  it('scales to zero, so an idle personal site costs nothing', () => {
    expect(manifest).toContain('minInstances: 0');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config/apphosting.test.ts`
Expected: FAIL com `ENOENT: no such file or directory, open 'apphosting.yaml'`.

**Step 3: Write minimal implementation**

`apphosting.yaml`:

```yaml
runConfig:
  minInstances: 0
  maxInstances: 2
  concurrency: 80
  cpu: 1
  memoryMiB: 512

env:
  - variable: HOST
    value: "0.0.0.0"
    availability:
      - RUNTIME

scripts:
  buildCommand: npm run build
  runCommand: node ./dist/server/entry.mjs
```

`PORT` não é declarado: o Cloud Run injeta a variável e sobrescrevê-la quebra o
health check. `maxInstances: 2` é teto de contenção de custo, não de capacidade.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/config/apphosting.test.ts`
Expected: PASS, `Tests 3 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 8: Verificar encerramento em `SIGTERM`

**Requirement:** REQ-009 (P2)
**Files:**

- Create: `docs/adr/002-graceful-shutdown.md`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `consequences-reviewer`
**Depends on:** Task 6

**Step 1: Write the failing test**

Tarefa de investigação com saída documental. O portão é o ADR existir com um
resultado observado, não inferido.

**Step 2: Run test to verify it fails**

Run: `test -f docs/adr/002-graceful-shutdown.md`
Expected: FAIL, exit 1.

**Step 3: Write minimal implementation**

Observar o comportamento real antes de escrever:

```bash
PORT=8080 HOST=0.0.0.0 node ./dist/server/entry.mjs &
SERVER_PID=$!
sleep 2
kill -TERM "$SERVER_PID"
sleep 2
if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "OBSERVED: process survives SIGTERM"
else
  echo "OBSERVED: process exits on SIGTERM"
fi
```

Registrar em `docs/adr/002-graceful-shutdown.md` o que foi observado e a decisão. Se o
servidor standalone já encerra sozinho, REQ-009 está atendido e o ADR diz isso. Se
não encerra, a decisão é **aceitar** para o MVP e documentar: o Cloud Run concede
período de graça no rollout, o volume esperado é baixo, e trocar para `mode:
'middleware'` só para ganhar shutdown gracioso reintroduz um servidor próprio para
manter, contra a decisão de arquitetura 2 da spec.

Não inventar o resultado: escrever o ADR a partir da saída do comando.

**Step 4: Run test to verify it passes**

Run: `test -f docs/adr/002-graceful-shutdown.md && grep -q "OBSERVED" docs/adr/002-graceful-shutdown.md && echo OK`
Expected: PASS, imprime `OK`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 9: Deploy no App Hosting e verificação em produção

**Requirement:** REQ-005, REQ-006
**Files:**

- Create: `scripts/verify-deployed.sh`

**Team:**

- Track: infra
- Implementer: `infra-engineer` (skills: `cloud-cli`, `bash-linux`)
- Reviewers: `security-reviewer`, `consequences-reviewer`
**Depends on:** Task 7, e os três pré-requisitos do topo deste plano

**Step 1: Write the failing test**

`scripts/verify-deployed.sh` exercita as mesmas asserções da Task 6 contra a URL
pública. É o único teste que fecha o spike, porque só ele toca a plataforma.

**Step 2: Run test to verify it fails**

Run: `bash scripts/verify-deployed.sh https://<backend>.us-east4.hosted.app`
Expected: FAIL, o backend ainda não existe.

**Step 3: Write minimal implementation**

Criar o backend, uma vez. **A região é `us-east4`**: o App Hosting oferece apenas
`asia-east1`, `asia-southeast1`, `europe-west4`, `us-central1`, `us-east4` e
`us-east5`. A `us-east1` declarada nos documentos estratégicos até 2026-08-08 nunca
existiu para este serviço, e `us-east4` é a mais próxima disponível.

```bash
firebase apphosting:backends:create \
  --project nandomoreira-dev \
  --primary-region us-east4
```

Este projeto usa **deploy a partir do fonte local**, não de repositório GitHub
conectado (ver ADR-001). `firebase.json` declara `"alwaysDeployFromSource": true`, e o
deploy é:

```bash
firebase deploy --only apphosting --project nandomoreira-dev
```

O comando **bloqueia de 2 a 3 minutos** esperando o build no servidor. Rode sempre em
background, nunca em foreground com timeout curto: um timeout mata a CLI depois de o
build já ter sido criado, e um retry cego nesse estado devolve
`HTTP 409, unable to queue the operation`.

Se a CLI expirar, **não repita o comando**. Consulte o estado real antes:

```bash
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://firebaseapphosting.googleapis.com/v1beta/projects/nandomoreira-dev/locations/us-east4/backends/<backend-id>/traffic"
```

`firebase.json` e `.firebaserc` fazem parte do contrato de deploy e **precisam estar
versionados**: sem eles, um clone limpo não reproduz o deploy e REQ-005 não se sustenta.

Se algum dia o repositório GitHub for conectado ao backend, o rollout passa a aceitar
`firebase apphosting:rollouts:create <backend-id> --git-commit "$(git rev-parse HEAD)"`.
Esse comando **não funciona** sem repositório conectado, que é a configuração atual.

`traffic.current.splits[].build` é a autoridade sobre o que está servindo. A lista de
`rollouts` pode vir vazia mesmo com o deploy no ar.

`scripts/verify-deployed.sh`:

```bash
#!/usr/bin/env bash
# Closes the spike: REQ-005 and REQ-006 against the live App Hosting URL.
set -eo pipefail

BASE="${1:?usage: verify-deployed.sh <base-url>}"

echo "== REQ-006: / responds 200 =="
curl -s -o /dev/null -w '%{http_code}\n' "${BASE}/" | grep -qx 200

echo "== REQ-003: /api/health responds 200 as JSON =="
curl -s -D - -o /tmp/deployed-1.json "${BASE}/api/health" | grep -qi 'content-type: application/json'

echo "== REQ-003: the platform is not allowed to cache it =="
curl -s -D - -o /dev/null "${BASE}/api/health" | grep -qi 'cache-control: no-store'

echo "== REQ-004: a second call returns a different payload =="
sleep 2
curl -s -o /tmp/deployed-2.json "${BASE}/api/health"
if diff -q /tmp/deployed-1.json /tmp/deployed-2.json > /dev/null; then
  echo "FAIL: identical payloads in production. Either the route was prerendered" >&2
  echo "      or an edge cache is serving it. Plan A is NOT proven." >&2
  exit 1
fi

echo "SPIKE PASSED: Astro SSR is live on App Hosting"
```

**Step 4: Run test to verify it passes**

Run: `bash scripts/verify-deployed.sh https://<backend>.us-east4.hosted.app`
Expected: PASS, termina com `SPIKE PASSED: Astro SSR is live on App Hosting`.

Nunca declarar o spike verde pelo código de saída de um comando com pipe: o status de
um pipeline é o do último estágio. A evidência é a linha `SPIKE PASSED` na saída.

Falhou, e a causa não foi identificada dentro do tempo de caixa de 2 dias: parar e ir
para a Task 10 com plano B.

**Step 5: Commit**

Run: `/git commit`

---

### Task 10: Registrar o resultado em ADR

**Requirement:** REQ-007, REQ-008
**Files:**

- Create: `docs/adr/001-hosting-platform.md`

**Team:**

- Track: docs
- Implementer: `rpi-implementer`
- Reviewers: self-review
**Depends on:** Task 9

**Step 1: Write the failing test**

Portão documental: o ADR precisa existir e declarar uma das duas decisões.

**Step 2: Run test to verify it fails**

Run: `test -f docs/adr/001-hosting-platform.md`
Expected: FAIL, exit 1.

**Step 3: Write minimal implementation**

`docs/adr/001-hosting-platform.md`, seguindo `~/.claude/templates/template-adr.md`,
com estas seções obrigatórias:

- **Status:** `accepted` (plano A) ou `superseded-by-plan-b`.
- **Contexto:** RISK-001 e a razão de descartar `@apphosting/astro-adapter`.
- **Decisão:** uma das duas, sem hedge.
  - Plano A: Astro 7 SSR com `@astrojs/node` standalone no App Hosting. Anexar a saída de `verify-deployed.sh`, o `backend-id` e a URL.
  - Plano B: Firebase Hosting clássico para o site estático, `/api/*` em Cloud Functions. Anexar o erro observado e em qual REQ o spike parou.
- **Consequências:** se for plano B, listar o que muda no roadmap. `structured-resume`, `mcp-server`, `hire-endpoint` e `launch-hardening` passam a ter specs diferentes, e `content-data-layer`, `design-system-foundation`, `project-catalog` e `home-page` seguem inalteradas por serem de build.

**Step 4: Run test to verify it passes**

Run: `test -f docs/adr/001-hosting-platform.md && grep -qE "accepted|superseded-by-plan-b" docs/adr/001-hosting-platform.md && echo OK`
Expected: PASS, imprime `OK`.

**Step 5: Commit**

Run: `/git commit`

---

## Depois do plano

O ADR da Task 10 é o gate da sprint 2. Enquanto ele não existir com uma decisão
declarada, nenhuma outra feature começa (F8.1 do PRD).

Se o resultado for plano B, as specs de `structured-resume`, `mcp-server`,
`hire-endpoint` e `launch-hardening` precisam ser escritas contra Cloud Functions.
Elas ainda não existem exatamente por isso.
