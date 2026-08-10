# Plano: Servidor MCP

> **Spec:** `docs/specs/mcp-server/SPEC.md`
> **Slug:** `mcp-server` · **Criado:** 2026-08-09
> **Profundidade:** Deep (13 requisitos) — três lotes com dependência declarada
> **Tarefas:** 12
> **Depende de:** `structured-resume` (T7 reusa o gerador do currículo)

## Defaults aplicados nas decisões pendentes da spec

| Pendente | Default do plano | Tarefa |
|---|---|---|
| Nome e versão declarados pelo servidor | `nandomoreira-dev` e a versão do `package.json` | T3 |

## Ordem e dependências

```
Lote 1 (base)       T1 → T2 → T3 → T4
Lote 2 (tools)      T5, T6, T7, T8 (T7 depende de structured-resume)
Lote 3 (contrato)   T9 → T10 → T11 → T12
```

**T2 bloqueia tudo**: sem a fábrica por requisição, as tools não têm onde ser
registradas. **T7 depende da feature `structured-resume`**; se ela não estiver
implementada, `get_resume` fica fora e REQ-002 não fecha.

---

## Lote 1 — Base do servidor

### T1 — Instalar o SDK

**REQ:** REQ-001
**Arquivos:** `package.json`

```bash
npm install @modelcontextprotocol/sdk@1.30.0
```

Entra em `dependencies`, não em dev: o servidor roda em produção.

**Step 4 — Verde**

```bash
node -e "import('@modelcontextprotocol/sdk/server/mcp.js').then(m => console.log(typeof m.McpServer))"
# espera: function
```

**Team:** track `config` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `consequences-reviewer`

---

### T2 — Fábrica de servidor por requisição

**REQ:** REQ-006, REQ-011
**Arquivos:** `src/lib/mcp/server.ts` (criar) · `tests/mcp/server-factory.test.ts`

**Step 1 — Teste vermelho**

```ts
it('returns a new server on every call, never a shared singleton', async () => {
  const a = await createMcpServer();
  const b = await createMcpServer();

  // Stateless mode collides request IDs across concurrent clients when the
  // server instance is shared. The SDK docs require one per request.
  expect(a).not.toBe(b);
});

it('declares its own name and version', async () => {
  const server = await createMcpServer();
  expect(server.server.getVersion?.()).toMatchObject({ name: 'nandomoreira-dev' });
});
```

**Step 3 — Implementação**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * One server per request. In stateless mode a shared instance collides request
 * IDs between concurrent clients, and this backend serves with concurrency 80.
 */
export const createMcpServer = async (): Promise<McpServer> => { /* ... */ };
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `consequences-reviewer`, `type-safety-reviewer`

---

### T3 — Rota `/api/mcp` com o transporte Web Standard

**REQ:** REQ-001, REQ-006
**Arquivos:** `src/pages/api/mcp.ts` (criar) · `tests/mcp/route.test.ts`
**Depende de:** T2

**Step 1 — Teste vermelho**

```ts
it('answers an initialize request over POST', async () => {
  const response = await POST(contextWith(initializeRequest));

  expect(response.status).toBe(200);
});

it('creates a fresh transport per request', () => {
  const source = readFileSync('src/pages/api/mcp.ts', 'utf8');
  // A module-level transport is the natural shape and the wrong one here.
  expect(source).not.toMatch(/^const transport = new/m);
});
```

**Step 3 — Implementação**

```ts
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

// handleRequest takes a Web Request and returns a Web Response, which is
// exactly what an Astro SSR route already has. No Node req/res bridge.
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // stateless
});
```

A rota encaminha o `Request` cru, sem consumir o corpo antes: ler o body na rota
deixaria o transporte sem nada para parsear.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `consequences-reviewer`, `security-reviewer`

---

### T4 — Métodos aceitos e erro sem vazamento

**REQ:** REQ-004
**Arquivos:** `src/pages/api/mcp.ts` · `tests/mcp/errors.test.ts`

**Step 1 — Teste vermelho**

```ts
it('answers a malformed body with a JSON-RPC error, not a 500', async () => {
  const response = await POST(contextWithRawBody('{ not json'));
  const body = await response.json();

  expect(body.error).toBeDefined();
  expect(body.error.code).toEqual(expect.any(Number));
});

it('never leaks a stack trace, a file path or an internal message', async () => {
  const text = await (await POST(contextWithRawBody('{ not json'))).text();

  expect(text).not.toMatch(/at .+\(.+:\d+:\d+\)/);
  expect(text).not.toMatch(/\/home\/|src\/lib\//);
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
painel `security-reviewer`, `test-reviewer`

---

## Lote 2 — As cinco tools

### T5 — `get_profile` e `check_availability`

**REQ:** REQ-002, REQ-003, REQ-005
**Arquivos:** `src/lib/mcp/tools/profile.ts` (criar) · `tests/mcp/tools-profile.test.ts`

**Step 1 — Teste vermelho**

```ts
it('returns the same profile the site publishes', async () => {
  const result = await callTool('get_profile');
  const profile = await getProfile();

  expect(result.headline).toBe(profile.headline);
});

it('returns availability with the date that lets an agent calibrate it', async () => {
  const result = await callTool('check_availability');

  expect(result.status).toBe((await getProfile()).availability.status);
  expect(result.updatedAt).toBe((await getProfile()).availability.updatedAt);
});

it('never exposes the e-mail through a tool', async () => {
  expect(JSON.stringify(await callTool('get_profile'))).not.toMatch(/@/);
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `business-logic-reviewer`, `security-reviewer`

---

### T6 — `list_projects` e `get_project`

**REQ:** REQ-002, REQ-003, REQ-007, REQ-008, REQ-010
**Arquivos:** `src/lib/mcp/tools/projects.ts` (criar) · `tests/mcp/tools-projects.test.ts`

**Step 1 — Teste vermelho**

```ts
it('filters by collection and rejects anything else', async () => {
  expect((await callTool('list_projects', { collection: 'lab' })).length).toBeGreaterThan(0);
  await expect(callTool('list_projects', { collection: 'nope' })).rejects.toThrow();
});

it('answers an unknown slug with a tool error, never an unhandled throw', async () => {
  const result = await callTool('get_project', { slug: 'nao-existe' });
  expect(result.isError).toBe(true);
});

it('never names the client of a confidential case', async () => {
  const all = JSON.stringify(await callTool('list_projects', {}));
  expect(all).not.toMatch(/acme/i);   // fixture com clientName: 'Acme'
});

it('returns an empty list, not an error, when nothing matches', async () => {
  expect(await callTool('list_projects', { collection: 'portfolio' })).toBeInstanceOf(Array);
});
```

**Step 3 — Implementação**

O schema declarado na tool valida `collection` antes de o handler rodar, então slug e
coleção inválidos não chegam à camada de acesso.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `business-logic-reviewer`, `security-reviewer`

---

### T7 — `get_resume`

**REQ:** REQ-002, REQ-003
**Arquivos:** `src/lib/mcp/tools/resume.ts` (criar) · `tests/mcp/tools-resume.test.ts`
**Depende de:** feature `structured-resume`

**Step 1 — Teste vermelho**

```ts
it('returns exactly what /api/resume.json serves', async () => {
  const viaTool = await callTool('get_resume');
  const viaRoute = buildResume({ profile: await getProfile(), projects: await getAllProjects() });

  // Two implementations of the resume would diverge on the first change.
  expect(viaTool).toEqual(viaRoute);
});
```

**Step 3 — Implementação**

Importa `buildResume` de `src/lib/aeo/resume.ts`. Se `structured-resume` ainda não
existir, **parar e reportar**, em vez de reimplementar o currículo aqui.

**Team:** track `backend` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T8 — Registro das cinco tools

**REQ:** REQ-002, REQ-013
**Arquivos:** `src/lib/mcp/server.ts` · `tests/mcp/tool-list.test.ts`

**Step 1 — Teste vermelho**

```ts
it('exposes exactly the five tools the PRD names', async () => {
  const names = (await listTools()).map((t) => t.name).sort();

  expect(names).toEqual([
    'check_availability', 'get_profile', 'get_project', 'get_resume', 'list_projects',
  ]);
});

it('describes each tool well enough to be used without external docs', async () => {
  for (const tool of await listTools()) {
    expect(tool.description ?? '', tool.name).not.toHaveLength(0);
  }
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
painel `business-logic-reviewer`

---

## Lote 3 — Contrato e verificação

### T9 — Portão de divergência com o site

**REQ:** REQ-003
**Arquivos:** `tests/mcp/no-divergence.test.ts` (criar)

O portão que dá sentido a REQ-003: para cada tool, comparar a resposta com a mesma
consulta feita pela camada de acesso. Não é redundante com T5-T7, porque roda sobre o
conteúdo **real**, não sobre fixture.

**Step 5 — Provar que morde**

```bash
# fazer uma tool retornar um literal em vez da camada de acesso
npx vitest run tests/mcp/no-divergence.test.ts   # espera exit 1
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `test-reviewer`, `business-logic-reviewer`

---

### T10 — Portão de vazamento na rota

**REQ:** REQ-004, REQ-009
**Arquivos:** `tests/aeo/no-leak.test.ts` (estender)

A rota entra na varredura existente. Como a resposta é JSON-RPC e não texto corrido, o
portão precisa exercitar uma chamada real de tool e varrer o corpo.

**Team:** track `tests` · implementador `backend-engineer` ·
painel `security-reviewer`

---

### T11 — Documentar em `AGENTS.md`

**REQ:** REQ-012
**Arquivos:** `src/lib/aeo/agents-md.ts` · `tests/aeo/agents-md.test.ts`

`AGENTS.md` passa a citar `/api/mcp` e as cinco tools, em inglês, derivado da mesma
lista que o servidor registra: uma lista escrita à mão diverge.

**Team:** track `backend` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T12 — Validação com cliente MCP real

**REQ:** REQ-001 · **critério de aceite de F6**
**Depende de:** todas

O critério do PRD é explícito: "conexão validada com um cliente MCP real, não apenas por
teste unitário". Teste unitário não prova negociação de protocolo.

```bash
npm run build
PORT=8080 node ./dist/server/entry.mjs &
```

Conectar com um cliente real apontando para `http://127.0.0.1:8080/api/mcp` e registrar:

- a revisão de protocolo negociada;
- a lista de tools devolvida;
- uma chamada de cada tool, com a resposta.

Registrar o resultado em `docs/adr/` ou no `STATE.md` da feature. **Sem essa evidência, a
feature não fecha** e o cutover da sprint 6 permanece bloqueado.

**Team:** track `qa` · implementador `code-reviewer` ·
painel `security-reviewer`, `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| Servidor único no módulo, colidindo IDs entre clientes | T2 e T3 testam a ausência do singleton, e o comentário no código explica o porquê |
| A rota consome o corpo antes do transporte | T3 encaminha o `Request` cru; o teste de `initialize` falha se o corpo for lido antes |
| Opt-in acidental para a revisão em release candidate | Nada no plano habilita a revisão 2026-07-28; o padrão do SDK é a de 2025 |
| `get_resume` divergir de `/api/resume.json` | T7 compara os dois objetos, e a dependência de `structured-resume` é declarada |
| Fechar a feature só com teste unitário | T12 exige cliente real, conforme o critério de aceite do PRD |
