# ADR-002: Encerramento em SIGTERM do servidor standalone

> **Status:** accepted
> **Deciders:** nandomoreira
> **Date:** 2026-08-08
> **Spec:** [infra-deploy-spike](../specs/infra-deploy-spike/SPEC.md) — REQ-009

---

## Context

REQ-009 (P2) pede que o processo encerre conexões em curso ao receber `SIGTERM`,
para que o Cloud Run não derrube requisição em voo no rollout. O spike usa
`@astrojs/node` em `mode: 'standalone'`. Antes de escrever um handler próprio ou
migrar para middleware, era preciso observar o comportamento real do entrypoint
gerado.

---

## Decision Drivers

- Evitar servidor HTTP próprio só por causa do shutdown (decisão de arquitetura 2 da spec)
- Cloud Run envia `SIGTERM` e concede período de graça no rollout
- Volume esperado de um site pessoal é baixo
- Observar o fato, não inferir a partir da documentação

---

## Considered Options

### Option 1: Confiar no shutdown nativo do standalone

**Description:** Aceitar o comportamento do `dist/server/entry.mjs` se ele já sair em `SIGTERM`.

**Pros:**

- Zero código extra
- Alinhado à decisão de não manter um servidor Express próprio

**Cons:**

- Não controlamos o drain de conexões in-flight; dependemos do adapter

**Estimated Effort:** Low

---

### Option 2: Migrar para `mode: 'middleware'` com handler de SIGTERM

**Description:** Escrever um servidor Node mínimo que registra `process.on('SIGTERM')` e encerra o HTTP server com `close()`.

**Pros:**

- Controle explícito do graceful shutdown

**Cons:**

- Reintroduz um servidor para manter, contra a decisão de arquitetura 2 da spec
- Fora do escopo mínimo do spike

**Estimated Effort:** Medium

---

### Option 3: Aceitar falha de REQ-009 no MVP

**Description:** Documentar que o processo não encerra em `SIGTERM` e seguir sem correção.

**Pros:**

- Não atrasa o spike se o nativo falhar

**Cons:**

- Risco residual em rollouts (mitigado pelo grace period do Cloud Run)

**Estimated Effort:** Low

---

## Observation (2026-08-08)

Comando executado após `npm run build`:

```bash
PORT=8080 HOST=0.0.0.0 node ./dist/server/entry.mjs &
SERVER_PID=$!
sleep 2
kill -TERM "$SERVER_PID"
sleep 2
```

**OBSERVED: process exits on SIGTERM**

O processo do entrypoint standalone encerrou sozinho após `SIGTERM` (pid
`2822484`). Não sobreviveu aos 2 segundos de espera; `kill -0` falhou, o que
confirma saída.

---

## Decision

**Option 1.** REQ-009 está atendido pelo comportamento nativo do
`@astrojs/node` standalone em `astro@7.2.0` / `@astrojs/node@11.1.0`. Nenhuma
camada extra de shutdown é adicionada no spike.

Se uma major futura do adapter deixar de sair em `SIGTERM`, reabrir este ADR e
reavaliar Option 2 ou 3.

---

## Consequences

### Positive

- REQ-009 fechado com evidência observada, sem código de infraestrutura extra
- Mantém o escopo mínimo do spike

### Negative

- Não há teste automatizado de drain de conexões in-flight; só a saída do
  processo foi observada

### Neutral

- Cloud Run continua responsável pelo grace period no rollout

---

## Links

- Spec: `docs/specs/infra-deploy-spike/SPEC.md` (REQ-009)
- Plano: `docs/plans/2026-08-08-infra-deploy-spike.md` (Task 8)
