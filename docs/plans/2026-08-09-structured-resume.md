# Plano: Currículo estruturado

> **Spec:** `docs/specs/structured-resume/SPEC.md`
> **Slug:** `structured-resume` · **Criado:** 2026-08-09
> **Profundidade:** Deep (13 requisitos) — três lotes com dependência declarada
> **Tarefas:** 12

## Defaults aplicados nas decisões pendentes da spec

| Pendente | Default do plano | Tarefa |
|---|---|---|
| Conteúdo de `work` e `education` | O schema entra com uma entrada mínima real (posição corrente, derivada de `availability` e `bio`); o histórico completo fica para o autor | T2 |
| Nome da chave de extensão | `x_agent` no root, prefixo que não colide com chave futura do padrão | T5 |

## Ordem e dependências

```
Lote 1 (fonte)      T1 → T2 → T3
        │
        └─ bloqueia T4 (o gerador lê os campos novos)
Lote 2 (gerador)    T4 → T5 → T6 → T7
Lote 3 (rotas)      T8, T9 → T10 → T11 → T12
```

**T2 bloqueia o lote 2**: sem `work` no schema, o gerador não tem o que mapear.
**T10 depende de T8 e T9**, porque só há o que validar quando as duas rotas existem.

---

## Lote 1 — Fonte de verdade

### T1 — Instalar e fixar o validador do schema

**REQ:** REQ-003
**Arquivos:** `package.json`

**Step 1 — Provar que ainda não existe**

```bash
node -e "require.resolve('@jsonresume/schema')" 2>&1 | grep -q "Cannot find" && echo RED
```

**Step 3 — Implementação**

```bash
npm install --save-dev @jsonresume/schema@1.3.1
```

Fica em `devDependencies`: a validação roda em teste, não em runtime (AD-003 da spec).

**Step 4 — Verde**

```bash
node -e "console.log(typeof require('@jsonresume/schema').validate)"   # espera: function
```

**Team:** track `config` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `consequences-reviewer`

---

### T2 — `work` e `education` no schema do perfil

**REQ:** REQ-006
**Arquivos:** `src/content/schemas/profile.ts` · `tests/content/profile-schema.test.ts`

**Step 1 — Teste vermelho**

```ts
describe('profile schema: histórico', () => {
  const base = { /* perfil válido mínimo já usado nos testes existentes */ };

  it('accepts a position with no end date, meaning current', () => {
    const parsed = profileSchema.parse({
      ...base,
      work: [{ name: 'Empresa', position: 'Cargo', startDate: '2024-01-01' }],
    });
    expect(parsed.work?.[0]?.endDate).toBeUndefined();
  });

  it('requires an ISO start date, because a resume without dates is unreadable', () => {
    expect(() =>
      profileSchema.parse({ ...base, work: [{ name: 'X', position: 'Y', startDate: '2024' }] }),
    ).toThrow();
  });

  it('keeps both fields optional, so the profile stays valid until they are written', () => {
    expect(profileSchema.parse(base).work).toBeUndefined();
  });
});
```

**Step 3 — Implementação**

```ts
const workSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  url: z.string().url().optional(),
  /** ISO-8601. Absent endDate means the position is current. */
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)).optional(),
});
```

`education` segue o mesmo desenho, com `institution`, `area`, `studyType`.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `type-safety-reviewer`, `business-logic-reviewer`

---

### T3 — Conteúdo mínimo do histórico

**REQ:** REQ-006
**Arquivos:** `src/content/profile/profile.md`
**Depende de:** T2

Uma entrada real de `work` para a posição corrente, coerente com `availability` e `bio`.
**Não inventar empregador, cargo ou data.** Se o autor não fornecer, a chave fica ausente
e T4 em diante trata `work` como opcional, conforme REQ-006.

**Verificação**

```bash
npm run build   # o schema reprova frontmatter inválido
```

**Team:** track `content` · implementador `backend-engineer` ·
skills `pt-br-accent-fix` · painel `business-logic-reviewer`

---

## Lote 2 — Gerador

### T4 — Mapear perfil para `basics` e `skills`

**REQ:** REQ-001, REQ-002
**Arquivos:** `src/lib/aeo/resume.ts` (criar) · `tests/aeo/resume.test.ts`
**Depende de:** T2

**Step 1 — Teste vermelho**

```ts
it('derives basics from the profile, never from a literal', () => {
  const resume = buildResume({ profile, projects: [] });

  expect(resume.basics.name).toBe(profile.name);
  expect(resume.basics.label).toBe(profile.headline);
  expect(resume.basics.summary).toContain(profile.bio.split('\n')[0]);
});

it('maps the stack to a single skills entry, not one per item', () => {
  const resume = buildResume({ profile, projects: [] });
  expect(resume.skills?.[0]?.keywords).toEqual(profile.stack);
});

it('never puts the e-mail in the payload', () => {
  // Machine routes carry no e-mail; /api/hire is the agent channel.
  expect(JSON.stringify(buildResume({ profile, projects: [] }))).not.toMatch(/@/);
});
```

**Step 3 — Implementação**

Função pura em `src/lib/aeo/`, ao lado de `llms-txt.ts`, recebendo `profile` e
`projects` já resolvidos. Não importa `astro:content`.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `business-logic-reviewer`, `security-reviewer`

---

### T5 — Bloco de extensão

**REQ:** REQ-004, REQ-011
**Arquivos:** `src/lib/aeo/resume.ts` · `tests/aeo/resume.test.ts`

**Step 1 — Teste vermelho**

```ts
it('isolates the non-standard part in its own top-level key', () => {
  const resume = buildResume({ profile, projects: [] });

  expect(resume.x_agent).toBeDefined();
  expect(resume.x_agent.availability.status).toBe(profile.availability.status);
  // The date is what lets an agent calibrate how stale the answer is.
  expect(resume.x_agent.availability.updatedAt).toBe(profile.availability.updatedAt);
  expect(resume.x_agent.positioning).toBe(profile.positioning);
});
```

**Step 3 — Implementação**

O schema declara `additionalProperties: true` no root, então a chave passa na validação
(verificado na spec). Fica no root e não em `meta` porque `meta` é metadado do documento.

**Team:** igual a T4

---

### T6 — Projetos, com redação e marcação de encerrado

**REQ:** REQ-007, REQ-010
**Arquivos:** `src/lib/aeo/resume.ts` · `tests/aeo/resume.test.ts`

**Step 1 — Teste vermelho**

```ts
it('never names the client of a confidential case', () => {
  const resume = buildResume({
    profile,
    projects: [project({ confidential: true, clientName: 'Acme', title: 'Plataforma da Acme' })],
  });

  expect(JSON.stringify(resume)).not.toMatch(/acme/i);
});

it('marks a discontinued case instead of presenting it as running', () => {
  const resume = buildResume({ profile, projects: [project({ discontinued: true })] });
  expect(resume.projects?.[0]?.endDate).toBeDefined();
});
```

**Step 3 — Implementação**

Reusar `src/lib/content/confidential.ts`, que já é o portão de redação do catálogo.
Reimplementar a redação aqui é como uma das cópias fica para trás.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `security-reviewer`, `consequences-reviewer`

---

### T7 — Portão de validação contra o schema oficial

**REQ:** REQ-003
**Arquivos:** `tests/aeo/resume-schema.test.ts` (criar)
**Depende de:** T1, T6

**Step 1 — Teste vermelho** (provar que morde antes de estar verde)

```ts
import { validate } from '@jsonresume/schema';

it('validates against the published JSON Resume schema', async () => {
  const resume = buildResume({ profile: await getProfile(), projects: await getAllProjects() });

  const result = await new Promise((resolve) => validate(resume, (err, valid) => resolve({ err, valid })));
  expect(result.valid, JSON.stringify(result.err)).toBe(true);
});
```

**Step 5 — Provar que morde**

```bash
# quebrar um campo obrigatório de basics temporariamente
npx vitest run tests/aeo/resume-schema.test.ts   # espera exit 1
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `test-reviewer`, `business-logic-reviewer`

---

## Lote 3 — Rotas

### T8 — `/api/resume.json`

**REQ:** REQ-001, REQ-008
**Arquivos:** `src/pages/api/resume.json.ts` (criar) · `tests/api/resume-json.test.ts`

**Step 1 — Teste vermelho**

```ts
it('responds 200 as application/json', async () => {
  const response = await GET({} as APIContext);

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toMatch(/application\/json/);
});

it('reads through the access layer, never through getCollection', () => {
  const source = readFileSync('src/pages/api/resume.json.ts', 'utf8');
  expect(source).not.toContain('getCollection(');
});
```

**Step 3 — Implementação**

Casca fina: chama a camada de acesso, passa a `buildResume`, serializa. Segue o
precedente de `src/pages/api/health.ts` para cabeçalhos.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `typescript-backend` · painel `security-reviewer`

---

### T9 — `/api/resume.txt`

**REQ:** REQ-005
**Arquivos:** `src/lib/aeo/resume-txt.ts` (criar) · `src/pages/api/resume.txt.ts` (criar) ·
`tests/aeo/resume-txt.test.ts`

**Step 1 — Teste vermelho**

```ts
it('renders the same facts as the JSON, without a parser', () => {
  const text = renderResumeText(buildResume({ profile, projects }));

  expect(text).toContain(profile.name);
  expect(text).toContain(profile.headline);
  for (const item of profile.stack) expect(text).toContain(item);
});

it('says a current position is current instead of leaving a blank', () => {
  const text = renderResumeText(buildResume({ profile: withCurrentJob, projects: [] }));
  expect(text).toMatch(/present|current/i);
});
```

**Step 3 — Implementação**

Deriva do **mesmo objeto** que a rota JSON serializa (AD-005). Duas fontes divergiriam na
primeira mudança.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `business-logic-reviewer`

---

### T10 — Portão de vazamento nas rotas novas

**REQ:** REQ-009
**Arquivos:** `tests/aeo/no-leak.test.ts` (estender)
**Depende de:** T8, T9

As duas rotas entram na lista que o portão já varre, procurando e-mail, chave, caminho
absoluto e IP privado.

**Step 5 — Provar que morde**

```bash
# injetar um e-mail no gerador temporariamente
npx vitest run tests/aeo/no-leak.test.ts   # espera exit 1
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `security-reviewer`, `test-reviewer`

---

### T11 — Sitemap e superfícies derivadas

**REQ:** REQ-012, REQ-013
**Arquivos:** `src/lib/aeo/sitemap.ts` · `src/lib/aeo/agents-md.ts` · testes correspondentes

**Step 1 — Teste vermelho**

```ts
it('lists both resume routes', () => {
  const xml = buildSitemap({ site, projects: [], posts: [] });
  expect(xml).toContain('/api/resume.json');
  expect(xml).toContain('/api/resume.txt');
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T12 — Verificação final

**REQ:** REQ-001 a REQ-013
**Depende de:** todas

```bash
npm run verify
bash scripts/verify-aeo-routes.sh
bash scripts/verify-schema-gate.sh
```

Conferir sobre o **build**, não sobre o fonte, com o servidor no ar:

- `/api/resume.json` responde 200 e valida contra o schema oficial.
- `/api/resume.txt` responde 200 em `text/plain`.
- Nenhum e-mail em nenhuma das duas.
- Nenhum nome de cliente confidencial em nenhuma das duas.
- `sitemap.xml` traz as duas rotas.

Acrescentar as duas rotas a `scripts/verify-aeo-routes.sh`, que já valida status e
`content-type` das rotas de máquina.

**A evidência é a linha de marca de cada script, nunca o código de saída.**

**Team:** track `qa` · implementador `code-reviewer` ·
painel `security-reviewer`, `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| O histórico profissional nunca é escrito | T3 aceita a ausência; `work` é opcional e o payload segue válido |
| A extensão quebra a validação | Verificado antes de planejar: `additionalProperties: true` no root |
| A redação de confidencialidade não cobre o currículo | T6 reusa `confidential.ts` e o teste procura o nome do cliente no payload inteiro |
| E-mail vaza numa rota de máquina | T4 já proíbe e T10 fecha com o portão existente |
| O `.txt` diverge do `.json` | T9 deriva do mesmo objeto, nunca de uma segunda montagem |
