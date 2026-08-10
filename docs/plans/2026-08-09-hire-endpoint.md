# Plano: Canal de contratação por agente

> **Spec:** `docs/specs/hire-endpoint/SPEC.md`
> **Slug:** `hire-endpoint` · **Criado:** 2026-08-09
> **Profundidade:** Deep (14 requisitos) — quatro lotes com dependência declarada
> **Tarefas:** 14

## Defaults aplicados nas decisões pendentes da spec

| Pendente | Default do plano | Tarefa |
|---|---|---|
| Endereço de destino e domínio verificado | Variáveis de ambiente `HIRE_NOTIFY_TO` e `RESEND_API_KEY`; nenhum valor no repositório | T3 |
| Janela do rate limit | 5 requisições por 10 minutos, por IP | T8 |
| Limite de tamanho do corpo | 16 KB | T6 |

## Ordem e dependências

```
Lote 1 (infra)      T1 → T2 → T3
Lote 2 (validação)  T4 → T5 → T6 → T7 → T8
Lote 3 (efeitos)    T9 → T10 → T11
Lote 4 (contrato)   T12 → T13 → T14
```

**T2 bloqueia o lote 3**: sem cliente do Firestore não há persistência.
**T9 antes de T10**, porque persistir precede notificar (AD-001 da spec).

---

## Lote 1 — Infraestrutura

### T1 — Firestore criado e regras negando leitura pública

**REQ:** REQ-008
**Arquivos:** `firestore.rules` (criar) · `firebase.json`

Criar o Firestore em `us-east4`, co-locado com o backend conforme o PRD.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Written only by the backend through the Admin SDK, which bypasses rules.
    // No client path may ever read a briefing.
    match /hire_requests/{doc} {
      allow read, write: if false;
    }
  }
}
```

**Step 5 — Provar que morde**

```bash
firebase emulators:exec --only firestore "npx vitest run tests/api/firestore-rules.test.ts"
# uma leitura anônima de hire_requests deve ser NEGADA
```

**Team:** track `infra` · implementador `infra-engineer` ·
skills `cloud-cli` · painel `security-reviewer`

---

### T2 — Cliente do Firestore com credencial do ambiente

**REQ:** REQ-001
**Arquivos:** `src/lib/hire/firestore.ts` (criar) · `package.json`

```bash
npm install firebase-admin@14.2.0
```

O App Hosting roda com identidade de serviço, então a credencial padrão do ambiente
basta: chave em arquivo seria segredo desnecessário no repositório.

**Step 1 — Teste vermelho**

```ts
it('initialises the app once, never per request', async () => {
  const a = getFirestoreClient();
  const b = getFirestoreClient();
  expect(a).toBe(b);   // ao contrário do MCP, aqui o singleton é o certo
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend`, `cloud-cli` · painel `security-reviewer`

---

### T3 — Configuração obrigatória, falhando alto

**REQ:** REQ-010
**Arquivos:** `src/lib/hire/config.ts` (criar) · `tests/api/hire-config.test.ts` ·
`apphosting.yaml`

**Step 1 — Teste vermelho**

```ts
it('throws when the mail key is missing, instead of never notifying in silence', () => {
  // The silent failure mode is the worst one: persisted, never notified, and
  // the author only finds out by losing a contact.
  expect(() => readHireConfig({})).toThrow(/RESEND_API_KEY/);
});

it('throws when the destination address is missing', () => {
  expect(() => readHireConfig({ RESEND_API_KEY: 'x' })).toThrow(/HIRE_NOTIFY_TO/);
});
```

**Step 3 — Implementação**

`apphosting.yaml` declara as duas variáveis com `availability: [RUNTIME]`, e o valor real
vai no Secret Manager, nunca no repositório.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `security-reviewer`, `consequences-reviewer`

---

## Lote 2 — Validação e defesas

### T4 — Schema do briefing

**REQ:** REQ-002
**Arquivos:** `src/lib/hire/schema.ts` (criar) · `tests/api/hire-schema.test.ts`

**Step 1 — Teste vermelho**

```ts
it('rejects a brief that is only whitespace', () => {
  expect(hireSchema.safeParse({ ...valid, brief: '   ' }).success).toBe(false);
});

it('rejects unknown keys instead of storing whatever arrives', () => {
  expect(hireSchema.safeParse({ ...valid, extra: 'x' }).success).toBe(false);
});

it('accepts the shape the PRD data model declares', () => {
  expect(hireSchema.safeParse(valid).success).toBe(true);
});
```

Campos conforme o modelo do PRD: `from`, `contact`, `brief`, mais o honeypot.
`.strict()` para recusar chave desconhecida.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `security-reviewer`, `business-logic-reviewer`

---

### T5 — Método aceito

**REQ:** REQ-009
**Arquivos:** `src/pages/api/hire.ts` (criar) · `tests/api/hire-method.test.ts`

```ts
it('answers 405 to anything that is not POST', async () => {
  expect((await GET({} as APIContext)).status).toBe(405);
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
painel `security-reviewer`

---

### T6 — Limite de tamanho antes do parse

**REQ:** REQ-003
**Arquivos:** `src/lib/hire/read-body.ts` (criar) · `tests/api/hire-size.test.ts`

**Step 1 — Teste vermelho**

```ts
it('rejects an oversized body with 413 before parsing it', async () => {
  const response = await POST(contextWithRawBody('x'.repeat(20_000)));
  expect(response.status).toBe(413);
});

it('does not trust Content-Length, which a hostile client controls', async () => {
  // Header says 10 bytes, body is 20 KB. The read is what must cut.
  const response = await POST(contextWithLyingLength('x'.repeat(20_000)));
  expect(response.status).toBe(413);
});
```

**Step 3 — Implementação**

Ler o corpo em pedaços e cortar ao ultrapassar 16 KB, em vez de confiar no cabeçalho
declarado.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `security-reviewer`, `test-reviewer`

---

### T7 — Honeypot com descarte silencioso

**REQ:** REQ-004
**Arquivos:** `src/pages/api/hire.ts` · `tests/api/hire-honeypot.test.ts`

**Step 1 — Teste vermelho**

```ts
it('answers as if accepted, so the attacker cannot learn which field is the trap', async () => {
  const response = await POST(contextWithJson({ ...valid, website: 'http://spam' }));
  expect(response.status).toBe(202);
});

it('persists nothing and sends nothing', async () => {
  await POST(contextWithJson({ ...valid, website: 'http://spam' }));
  expect(firestoreSpy).not.toHaveBeenCalled();
  expect(mailSpy).not.toHaveBeenCalled();
});
```

O campo tem nome que nenhum cliente legítimo preencheria e **não** é obrigatório.

**Team:** track `backend` · implementador `backend-engineer` ·
painel `security-reviewer`, `business-logic-reviewer`

---

### T8 — Rate limit por instância

**REQ:** REQ-005
**Arquivos:** `src/lib/hire/rate-limit.ts` (criar) · `tests/api/hire-rate-limit.test.ts`

**Step 1 — Teste vermelho**

```ts
it('answers 429 after the window budget is spent', () => {
  const limiter = createLimiter({ max: 5, windowMs: 600_000 });
  for (let i = 0; i < 5; i += 1) expect(limiter.check('1.2.3.4')).toBe(true);
  expect(limiter.check('1.2.3.4')).toBe(false);
});

it('reads the client IP from x-forwarded-for, not from the socket', () => {
  // App Hosting proxies every request; the socket IP would count all callers
  // as a single origin and the limit would never trigger per client.
  expect(clientIpOf(headersWith('x-forwarded-for', '9.9.9.9, 10.0.0.1'))).toBe('9.9.9.9');
});
```

**Step 3 — Implementação**

Contador em memória, com o comentário que RISK-002 exige:

```ts
/**
 * In-memory and per instance. With maxInstances: 2 the effective limit is up to
 * twice `max`, and a recycled instance resets the window. RISK-002 accepts this
 * as approximate; Cloud Armor is the escalation, out of MVP scope.
 */
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `security-reviewer`, `consequences-reviewer`

---

## Lote 3 — Efeitos

### T9 — Persistir

**REQ:** REQ-001, REQ-011
**Arquivos:** `src/lib/hire/store.ts` (criar) · `tests/api/hire-store.test.ts`
**Depende de:** T2

**Step 1 — Teste vermelho**

```ts
it('stores the fields the PRD data model declares', async () => {
  const id = await storeBriefing({ ...valid, sourceIp: '9.9.9.9' });

  expect(saved).toMatchObject({ from, contact, brief, sourceIp: '9.9.9.9', notified: false });
  expect(saved.receivedAt).toBeDefined();
  expect(id).toEqual(expect.any(String));
});
```

`notified` nasce falso: só vira verdadeiro depois da entrega confirmada.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `business-logic-reviewer`

---

### T10 — Notificar, depois de persistir

**REQ:** REQ-001, REQ-006, REQ-012
**Arquivos:** `src/lib/hire/notify.ts` (criar) · `package.json` ·
`tests/api/hire-notify.test.ts`
**Depende de:** T9

```bash
npm install resend@6.18.1
```

**Step 1 — Teste vermelho**

```ts
it('keeps the record and answers success when the mail provider fails', async () => {
  mailSpy.mockRejectedValueOnce(new Error('provider down'));

  const response = await POST(contextWithJson(valid));

  expect(response.status).toBe(202);          // the caller is not punished
  expect(firestoreSpy).toHaveBeenCalled();    // the briefing survived
  expect(saved.notified).toBe(false);         // and says so
});

it('sends the brief in full, so the inbox is enough', async () => {
  await POST(contextWithJson(valid));
  expect(mailSpy.mock.calls[0][0].text).toContain(valid.brief);
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `business-logic-reviewer`, `consequences-reviewer`

---

### T11 — Firestore indisponível

**REQ:** REQ-002, REQ-007
**Arquivos:** `src/pages/api/hire.ts` · `tests/api/hire-failures.test.ts`

```ts
it('answers 503 and sends no mail when persistence is down', async () => {
  firestoreSpy.mockRejectedValueOnce(new Error('unavailable'));

  const response = await POST(contextWithJson(valid));

  expect(response.status).toBe(503);
  expect(mailSpy).not.toHaveBeenCalled();   // nothing to notify about
});
```

Sem persistência não há o que salvar, então aqui o erro é honesto, ao contrário de T10.

**Team:** track `backend` · implementador `backend-engineer` ·
painel `business-logic-reviewer`, `security-reviewer`

---

## Lote 4 — Contrato

### T12 — Nenhuma resposta vaza detalhe interno

**REQ:** REQ-007
**Arquivos:** `tests/api/hire-no-leak.test.ts` (criar)

**Step 1 — Teste vermelho**

```ts
it.each([
  ['malformed json', '{ not json'],
  ['oversized', 'x'.repeat(20_000)],
  ['invalid payload', JSON.stringify({ brief: '' })],
])('%s leaks nothing', async (_name, body) => {
  const text = await (await POST(contextWithRawBody(body))).text();

  expect(text).not.toMatch(/at .+\(.+:\d+:\d+\)/);   // stack
  expect(text).not.toMatch(/\/home\/|src\/lib\//);   // path
  expect(text).not.toMatch(/hire_requests|firestore/i); // collection, driver
});
```

**Step 5 — Provar que morde**

```bash
# devolver err.message cru numa das respostas
npx vitest run tests/api/hire-no-leak.test.ts   # espera exit 1
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `security-reviewer`, `test-reviewer`

---

### T13 — Documentar em `AGENTS.md`

**REQ:** REQ-013
**Arquivos:** `src/lib/aeo/agents-md.ts` · `tests/aeo/agents-md.test.ts`

`AGENTS.md` passa a descrever `/api/hire`: método, formato aceito, limite de tamanho e
comportamento de rate limit. Em inglês. É a única superfície de escrita, então precisa
ser descobrível sem tentativa e erro.

**Team:** track `backend` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T14 — Verificação final

**REQ:** REQ-001 a REQ-014
**Depende de:** todas

```bash
npm run verify
bash scripts/verify-aeo-routes.sh
```

Contra o build rodando, com as variáveis de ambiente presentes:

- POST válido responde 202, grava e notifica.
- POST inválido responde 400 e não grava.
- Corpo de 20 KB responde 413.
- Honeypot preenchido responde 202 sem gravar nem enviar.
- Sexta requisição do mesmo IP na janela responde 429.
- GET responde 405.
- Nenhuma resposta contém stack, caminho ou nome de coleção.

E, na console do Firebase, confirmar que uma leitura anônima de `hire_requests` é negada.

**A evidência é a linha de marca de cada script, nunca o código de saída.**

**Team:** track `qa` · implementador `code-reviewer` ·
painel `security-reviewer`, `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| Notificar antes de persistir, perdendo o briefing quando o provedor cai | T9 antes de T10, e o teste de T10 exige registro salvo com `notified: false` |
| Falha silenciosa por chave ausente | T3 falha alto; o teste exige a exceção |
| Rate limit inútil por ler o IP do socket | T8 testa a leitura de `x-forwarded-for` |
| Limite de tamanho burlado por `Content-Length` mentiroso | T6 testa exatamente esse caso |
| Honeypot revelando qual campo é a armadilha | T7 exige resposta de sucesso |
| Leitura pública dos briefings | T1 nega por regra, com teste no emulador |
| Segredo no repositório | T3 usa variável de ambiente e Secret Manager; nenhum valor versionado |
