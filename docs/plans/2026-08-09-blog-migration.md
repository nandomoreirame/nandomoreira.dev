# Plano: Migração do blog antigo

> **Spec:** `docs/specs/blog-migration/SPEC.md`
> **Slug:** `blog-migration` · **Criado:** 2026-08-09
> **Profundidade:** Deep (18 requisitos) — quatro lotes com dependência declarada
> **Tarefas:** 16

## Defaults aplicados nas decisões pendentes da spec

| Pendente | Default do plano | Tarefa |
|---|---|---|
| Versão do texto sobre o calendário | A do Notion (2024), revisão do autor. A de 2016 não é importada | T6 |
| Quais textos são correntes | Os 2 do Notion. Os 38 do Gatsby entram `archived: true` | T6 |

## Origem do material

| O quê | Onde |
|---|---|
| 38 posts do Gatsby | `~/dev/projects/blog-import-gatsby/<ano>/<slug>/index.md` |
| Imagens do Gatsby | tarball extraído, `content/assets/<ano>/<mês>/` |
| 2 posts do Notion | `~/Downloads/posts/*/ExportBlock-*/…md` |

Se o tarball já não estiver no scratchpad, rebaixar com
`gh api repos/nandomoreirame/gatsby-blog.nandomoreira.dev/tarball/master`.

## Ordem e dependências

```
Lote 1 (coleção)      T1 → T2 → T3
        │
        └─ bloqueia T4 (o script escreve no schema novo)
Lote 2 (importação)   T4 → T5 → T6 → T7
Lote 3 (rotas)        T8, T9, T10 → T11 → T12
Lote 4 (superfícies)  T13, T14 → T15 → T16
```

**T1 bloqueia tudo**: enquanto a coleção se chamar `notes`, o script grava no
lugar errado. **T11 depende de T10**, porque só há colisão quando a rota de raiz
existe.

---

## Lote 1 — Coleção e schema

### T1 — Renomear a coleção de `notes` para `posts`

**REQ:** REQ-012
**Arquivos:** `src/content/content.config.ts` · `src/content/schemas/note.ts` →
`post.ts` · `src/lib/content/notes.ts` → `posts.ts` · `src/lib/content/index.ts` ·
`src/content/notes/` → `src/content/posts/` · testes que importam esses caminhos

**Step 1 — Teste vermelho**

```ts
// tests/content/posts-collection.test.ts
import { describe, expect, it } from 'vitest';
import { collections } from '../../src/content.config';

describe('posts collection', () => {
  it('is named posts, matching the route it feeds', () => {
    // A collection called `notes` feeding /posts forces every future reader to
    // translate between the two names.
    expect(Object.keys(collections)).toContain('posts');
    expect(Object.keys(collections)).not.toContain('notes');
  });
});
```

**Step 3 — Implementação**

`git mv` dos arquivos e diretórios, ajuste dos imports. `getAllNotes` vira
`getAllPosts`; `Note` vira `Post`. A camada de acesso continua sendo o único
caminho para `getCollection` (`single-source.test.ts` cobre isso).

**Step 4 — Verde**

```bash
npx vitest run tests/content/ && node ./node_modules/typescript/bin/tsc --noEmit
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `consequences-reviewer`, `type-safety-reviewer`

---

### T2 — Campos de arquivamento e capa no schema

**REQ:** REQ-008, REQ-011, REQ-016
**Arquivos:** `src/content/schemas/post.ts` · `src/content.config.ts` ·
`tests/content/post-schema.test.ts`

**Step 1 — Teste vermelho**

```ts
describe('post schema', () => {
  const base = {
    slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2015-09-30',
  };

  it('defaults to current, so a new post needs no ceremony', () => {
    expect(postSchema.parse(base).archived).toBe(false);
  });

  it('accepts an archived post', () => {
    expect(postSchema.parse({ ...base, archived: true }).archived).toBe(true);
  });

  it('requires alt text whenever a cover image is declared', () => {
    // Same rule the case catalogue already applies: an image is content.
    expect(() =>
      postSchema.parse({ ...base, cover: { src: './x.png' } }),
    ).toThrow();
  });
});
```

**Step 3 — Implementação**

```ts
// A função image() só existe quando o schema é declarado como função em
// defineCollection, e é o que liga o frontmatter ao pipeline de otimização.
export const postSchema = ({ image }: { image: () => z.ZodType }) =>
  z.object({
    slug: z.string().min(1).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    title: z.string().min(1),
    summary: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date'),
    markers: z.array(z.string().min(1)).optional(),
    draft: z.boolean().default(false),
    /** Archived posts live under /posts/arquivo/<ano>; current ones under /posts. */
    archived: z.boolean().default(false),
    cover: z
      .object({
        src: image(),
        alt: z.string().min(1, 'A cover image is content, never decoration'),
      })
      .optional(),
  });
```

`content.config.ts` passa a declarar `schema: postSchema` como função.

**Team:** igual a T1

---

### T3 — Revogar a proibição de data

**REQ:** REQ-006, REQ-013
**Arquivos:** `tests/notes/no-date-leak.test.ts` (**apagar**) ·
`docs/specs/notes/SPEC.md` (emendar)

O portão é **apagado**, não afrouxado: um portão que não protege mais nada vira
ruído que o próximo leitor tenta satisfazer sem saber por quê (AD-001 da spec).

**Step 1 — Provar que ele é o único obstáculo**

```bash
npx vitest run tests/notes/no-date-leak.test.ts   # espera: passa hoje
```

**Step 3 — Implementação**

```bash
git rm tests/notes/no-date-leak.test.ts
```

Em `docs/specs/notes/SPEC.md`, marcar REQ-002 como revogado, com a data e o
motivo: o requisito servia a nota atemporal e se inverte diante de um acervo de
2015-2019, onde a ausência de data engana.

**Team:** track `tests` · implementador `backend-engineer` ·
painel `business-logic-reviewer`

---

## Lote 2 — Importação

### T4 — Script de migração

**REQ:** REQ-008, REQ-009, REQ-017
**Arquivos:** `scripts/migrate-blog.mjs` (criar)

Um script, não 40 edições à mão: a conversão é mecânica e precisa ser repetível
enquanto o mapeamento é ajustado.

**O que ele faz, por post:**

| Origem | Destino |
|---|---|
| `path: '/x'` | `slug: x` |
| `title` | `title` |
| `date` | `date` |
| `description` | `summary` |
| `tags` (até 3) | `markers` |
| `image: ../../../assets/<ano>/<mês>/<f>` | `cover.src: ../../assets/posts/<ano>/<f>` |
| `category`, `keywords`, `comments`, `datePublished` | descartados |

E no corpo: reescreve cada `![alt](../../../assets/…)` e cada imagem co-locada
para `../../assets/posts/<ano>/<arquivo>`, copiando o arquivo junto.

**Regras não-óbvias:**

- **Imagem ausente na origem** (`eu-ambiente-gulpjs.png`): remove a referência,
  registra em `MIGRATION-REPORT.md` e segue. REQ-017.
- **`alt` vazio** no markdown de origem: usa o título do post como alternativo,
  porque o schema exige e um alternativo vazio reprova.
- **Colisão de nome de imagem** entre meses do mesmo ano: prefixa com o mês.
- O script **não** reescreve o corpo além dos caminhos de imagem (constraint).

**Step 2 — Rodar em modo seco**

```bash
node scripts/migrate-blog.mjs --dry-run --source ~/dev/projects/blog-import-gatsby
# espera: relatório com 38 posts, 54 imagens copiadas, 1 ausente
```

**Team:** track `scripts` · implementador `backend-engineer` ·
skills `bash-linux` · painel `business-logic-reviewer`, `test-reviewer`

---

### T5 — Importar as imagens

**REQ:** REQ-009, REQ-010
**Arquivos:** `src/assets/posts/<ano>/*` (criar) · `.gitignore` (verificar)
**Depende de:** T4

```bash
node scripts/migrate-blog.mjs --images-only --source ~/dev/projects/blog-import-gatsby
```

**Verificação**

```bash
find src/assets/posts -type f | wc -l          # espera: 54 + co-locadas
du -sh src/assets/posts                        # espera: ~12 MB antes da otimização
```

O peso final é conferido em T16 sobre `dist/`, não aqui: `src/assets` guarda o
original, e o Astro emite as variantes otimizadas no build. REQ-010 é sobre o
que é **servido**, não sobre o que é versionado.

**Team:** track `scripts` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T6 — Importar os 40 textos

**REQ:** REQ-001, REQ-008
**Arquivos:** `src/content/posts/*.md` (criar) · `MIGRATION-REPORT.md`
**Depende de:** T5

```bash
node scripts/migrate-blog.mjs --source ~/dev/projects/blog-import-gatsby
node scripts/migrate-blog.mjs --source ~/Downloads/posts --notion --current
```

**Defaults desta tarefa**, conforme o topo do plano: os 38 do Gatsby entram com
`archived: true`; os 2 do Notion, com `archived: false`. O texto sobre o
calendário entra **apenas** na versão do Notion; o de 2016 é pulado por nome.

**Verificação**

```bash
ls src/content/posts/*.md | wc -l              # espera: 39 (38 + 1 exemplo) + 2 − 1 = 40
grep -l 'archived: true' src/content/posts/*.md | wc -l   # espera: 37
npm run build                                  # falha em qualquer frontmatter inválido
```

O `exemplo.md` de `notes` continua com `draft: true` e não conta como publicado.

**Team:** track `content` · implementador `backend-engineer` ·
skills `pt-br-accent-fix` · painel `business-logic-reviewer`

---

### T7 — Camada de acesso separa corrente de arquivo

**REQ:** REQ-001, REQ-003, REQ-016
**Arquivos:** `src/lib/content/posts.ts` · `tests/content/posts-access.test.ts`

**Step 1 — Teste vermelho**

```ts
describe('posts access layer', () => {
  it('separates current from archived', async () => {
    expect((await getCurrentPosts()).every((p) => !p.archived)).toBe(true);
    expect((await getArchivedPosts()).every((p) => p.archived)).toBe(true);
  });

  it('groups the archive by year, newest first', async () => {
    const years = await getArchiveYears();
    expect(years.map((y) => y.year)).toEqual([...years.map((y) => y.year)].sort().reverse());
    // A year with no post must not become a route (edge case in the spec).
    expect(years.every((y) => y.count > 0)).toBe(true);
  });

  it('never returns a draft on any surface', async () => {
    const all = [...(await getCurrentPosts()), ...(await getArchivedPosts())];
    expect(all.some((p) => p.draft)).toBe(false);
  });
});
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `business-logic-reviewer`, `test-reviewer`

---

## Lote 3 — Rotas

### T8 — `/posts` lista os correntes

**REQ:** REQ-001, REQ-006
**Arquivos:** `src/pages/posts/index.astro` (criar) ·
`src/pages/notas/` (**apagar** ao fim do lote) · `tests/posts/listing.test.ts`

**Step 1 — Teste vermelho**

```ts
it('lists current posts and links each to the root', async () => {
  const html = await render();
  expect(html).toMatch(/href="\/[a-z0-9-]+"/);
  expect(html).not.toMatch(/href="\/posts\/[a-z0-9-]+"/);
});

it('shows the date, which the old gate used to forbid', async () => {
  expect(await render()).toMatch(/\d{2}\/\d{4}/);
});

it('offers the archive without listing archived posts inline', async () => {
  const html = await render();
  expect(html).toContain('href="/posts/arquivo"');
});
```

**Step 3 — Implementação**

Reusa `ListRow` com `stamp={toCompactStamp(post.date)}`, que já existe e era
proibido aqui pelo portão removido em T3.

**Team:** track `frontend` · implementador `frontend-engineer` ·
skills `test-driven-development`, `accessibility-guardrails` ·
painel `business-logic-reviewer`

---

### T9 — `/posts/arquivo` indexa os anos

**REQ:** REQ-002, REQ-007
**Arquivos:** `src/pages/posts/arquivo/index.astro` (criar) ·
`tests/posts/archive-index.test.ts`

**Step 1 — Teste vermelho**

```ts
it('lists every year that has content, with its count', async () => {
  const html = await render();
  for (const year of ['2015', '2016', '2017', '2018', '2019']) {
    expect(html).toContain(`href="/posts/arquivo/${year}"`);
  }
  expect(html).toMatch(/\(1?\d\)/);
});

it('costs no client JavaScript, so the year split is routing not filtering', async () => {
  expect(await render()).not.toContain('client:');
});
```

**Team:** igual a T8

---

### T10 — `/posts/arquivo/<ano>` e `/<slug>`

**REQ:** REQ-003, REQ-004
**Arquivos:** `src/pages/posts/arquivo/[year].astro` (criar) ·
`src/pages/[slug].astro` (criar) · `tests/posts/archive-year.test.ts` ·
`tests/posts/post-page.test.ts`

**Step 1 — Teste vermelho**

```ts
it('generates one route per year that has posts, and none for empty years', async () => {
  const paths = await getStaticPaths();
  expect(paths.map((p) => p.params.year)).toEqual(
    expect.arrayContaining(['2015', '2016', '2017', '2018', '2019']),
  );
  expect(paths.every((p) => p.props.posts.length > 0)).toBe(true);
});

it('serves both current and archived posts from the root', async () => {
  const paths = await getStaticPaths();   // de [slug].astro
  expect(paths.length).toBe(40);
});
```

**Step 3 — Implementação**

`src/pages/[slug].astro` gera a partir de **todos** os posts, correntes e
arquivados (REQ-004). O `[slug]` fica na raiz, então é a última rota que o Astro
resolve, o que é exatamente o risco que T11 endereça.

**Team:** igual a T8

---

### T11 — Portão de colisão com rota de raiz

**REQ:** REQ-005
**Arquivos:** `tests/posts/root-slug-collision.test.ts` (criar)
**Depende de:** T10

**Step 1 — Teste vermelho** (provar que morde antes de estar verde)

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Names that resolve to a static route and would shadow a post. */
const rootRoutes = () => {
  const entries = readdirSync('src/pages', { withFileTypes: true });
  return entries
    .filter((e) => e.name !== '[slug].astro')
    .map((e) => e.name.replace(/\.(astro|ts)$/, ''))
    .filter((n) => n !== 'index');
};

describe('root slug collision', () => {
  it('no post slug is shadowed by a static root route', () => {
    const slugs = readdirSync('src/content/posts')
      .filter((f) => f.endsWith('.md'))
      .map((f) => readFileSync(`src/content/posts/${f}`, 'utf8').match(/^slug:\s*(\S+)$/m)?.[1]);

    // Astro resolves a static route before the dynamic [slug], so a collision
    // does not error: the post becomes unreachable in silence.
    const shadowed = slugs.filter((s) => s && rootRoutes().includes(s));
    expect(shadowed, `shadowed by a page in src/pages: ${shadowed.join(', ')}`).toEqual([]);
  });
});
```

**Step 5 — Provar que morde**

```bash
# criar src/content/posts/sobre.md temporariamente com slug: sobre
npx vitest run tests/posts/root-slug-collision.test.ts   # espera exit 1
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `consequences-reviewer`, `test-reviewer`

---

### T12 — `/notas` redireciona para `/posts`

**REQ:** REQ-014
**Arquivos:** `astro.config.mjs` · `tests/posts/redirect.test.ts`

A rota nunca foi indexada (o sitemap de produção não a tem), então o redirect é
cortesia para links locais e marcadores, não recuperação de SEO. Mesmo mecanismo
que `/projetos` já usa.

**Team:** track `frontend` · implementador `frontend-engineer` ·
painel `consequences-reviewer`

---

## Lote 4 — Superfícies derivadas

### T13 — Sitemap, `llms.txt` e RSS apontam para `/posts`

**REQ:** REQ-012
**Arquivos:** `src/lib/aeo/sitemap.ts` · `src/lib/aeo/llms-txt.ts` ·
`src/lib/notes/rss.ts` → `src/lib/posts/rss.ts` · testes correspondentes

**Step 1 — Teste vermelho**

```ts
it('lists posts at the root path, matching the real route', () => {
  const xml = buildSitemap({ site, projects: [], posts });
  expect(xml).toContain('<loc>https://nandomoreira.dev/como-instalar-o-gulp-4</loc>');
  expect(xml).not.toContain('/notas/');
});

it('includes the archive index and each year', () => {
  const xml = buildSitemap({ site, projects: [], posts });
  expect(xml).toContain('/posts/arquivo');
  expect(xml).toContain('/posts/arquivo/2015');
});
```

O RSS mantém `pubDate` a partir de `date`, que continua existindo: o que mudou é
que ele deixou de ser invisível na superfície humana.

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `consequences-reviewer`

---

### T14 — Navegação e JSON-LD

**REQ:** REQ-012, REQ-015
**Arquivos:** `src/components/layout/SiteNav.astro` ·
`src/lib/notes/note-ld.ts` → `src/lib/posts/post-ld.ts` · testes

O item do menu passa a ser **Posts**, apontando para `/posts`, e continua
condicional à existência de conteúdo publicado. O `TechArticle` JSON-LD volta a
declarar `datePublished`, que fazia falta e era omitido por causa do requisito
revogado.

REQ-015: o post arquivado indica que pertence ao acervo, com um selo do mesmo
tipo do `Descontinuado` que o catálogo já usa.

**Team:** track `frontend` · implementador `frontend-engineer` ·
skills `accessibility-guardrails` · painel `business-logic-reviewer`

---

### T15 — Limpar o que sobrou de `notas`

**REQ:** REQ-012
**Arquivos:** varredura em `src/`, `tests/`, `scripts/`, `docs/`

```bash
grep -rn "notas\|getAllNotes\|noteSchema\|Note\b" src/ tests/ scripts/ \
  | grep -v "posts/arquivo" | grep -v "^docs/"
# espera: nenhuma linha, fora referências históricas em docs/
```

Um teste garante que a string não volta:

```ts
it('keeps no reference to the old collection name in src', async () => {
  const files = [];
  for await (const f of glob('src/**/*.{astro,ts}')) files.push(f);
  const offenders = files.filter((f) => /\bnotas\b|getAllNotes/.test(readFileSync(f, 'utf8')));
  expect(offenders).toEqual([]);
});
```

**Team:** track `tests` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

### T16 — Verificação final

**REQ:** REQ-010, REQ-013
**Depende de:** todas

```bash
npm run verify
bash scripts/verify-schema-gate.sh
bash scripts/verify-unique-slug-gate.sh
bash scripts/verify-aeo-routes.sh
bash scripts/verify-repo-urls.sh
```

Conferir sobre o **build**, não sobre o fonte:

```bash
du -sh dist/client/_astro/*.{webp,avif,png,jpg} 2>/dev/null | tail -1
```

REQ-010 exige que o servido seja menor que os 12 MB de origem. Verificar também:

- `/posts` lista 2 correntes; `/posts/arquivo` lista 5 anos.
- `/posts/arquivo/2015` lista 17; `/<slug>` responde 200 para os 40.
- Nenhuma imagem quebrada: nenhum `src` apontando para caminho inexistente.
- `sitemap.xml` traz os 40 na raiz, mais o índice e os 5 anos.
- Zero `.js` em `dist/client/_astro`.

**A evidência é a linha de marca de cada script, nunca o código de saída.**

**Team:** track `qa` · implementador `code-reviewer` ·
painel `security-reviewer`, `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| Slug de post sombreado por rota de raiz | T11, portão provado vermelho antes de verde |
| Script de migração corrompe o corpo dos textos | T4 roda `--dry-run` primeiro; o script só toca caminhos de imagem |
| Imagem perdida bloqueia a migração | REQ-017: registra em `MIGRATION-REPORT.md` e segue |
| 12 MB entram no bundle sem otimização | T5 versiona o original em `src/assets`; T16 mede o servido |
| Data volta a vazar onde não deve | Não se aplica: REQ-006 revoga a proibição em todas as superfícies |
| Rename deixa referência órfã | T15 varre e trava com teste |
| 40 posts de 2015-2019 diluem o posicionamento | Fora do escopo desta migração, mas é a razão de `/posts` separar corrente de arquivo |
