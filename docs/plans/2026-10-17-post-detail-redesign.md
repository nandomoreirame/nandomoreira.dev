# Plano: post-detail-redesign

> **Spec:** docs/specs/post-detail-redesign/SPEC.md

**Objetivo:** levar a página de detalhe do post (`src/pages/[slug].astro`) ao visual da tela "Scratchpad no Niri" do Stitch: meta enxuta acima do título, caixa de controles, índice em card, card `// stack snapshot`, linha entre as seções (sem números), caixa do autor e posts relacionados em grade.
**Arquitetura:** o schema ganha `snapshot` opcional. Componentes novos em `src/components/posts/` (`PostSnapshot`, `AuthorBox`, `RelatedPostCard`); `PostToc`, `Prose`, `AiSummaryLink` e `CopyButton` ganham uma variante cada, sem mudar o uso atual. A página monta tudo; a linha entre as seções é CSS em `global.css`.
**Stack:** Astro 7, Tailwind 4, Zod, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 9.
**Complexidade estimada:** large.
**Depende de:** `home-latest-post` (em `implement`, não commitada): mexe em `PostCard.astro` e no schema de posts (`keyPoints`). Sem arquivo de produção em comum além de `src/content/schemas/post.ts` e dos 11 `.md` publicados; feche e commite aquela feature antes, ou implemente esta por cima sabendo que a árvore já está suja.

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho, que precisa falhar pelo motivo certo.
- Texto visível novo só o da spec. Nenhum hex, nenhum valor arbitrário novo do Tailwind fora dos que a página já usa (`grid-cols-[...]` do layout), nenhum `<script>` novo, nenhum `onclick`. CSS novo vai em `src/styles/global.css` com tokens (`var(--...)`).
- Antes da Tarefa 1: `./node_modules/.bin/astro dev stop` (campo novo no schema; ver "store congelado" no `CLAUDE.md`). Depois da Tarefa 2: `rm -f .astro/data-store.json` antes de subir o dev de novo.
- Rode só os testes da tarefa (`npx vitest run <arquivo>`). No fim: `npm run verify` termina sem erro (check + test + build + test:build).

---

### Tarefa 1: campo `snapshot` no schema de posts

**Requisito:** REQ-004
**Arquivos:**
- Modificar: `src/content/schemas/post.ts` (dentro do `z.object`, depois de `keyPoints`)
- Criar: `tests/content/post-snapshot.test.ts`

**Team:**
- Track: data
- Implementer: backend-engineer (skills: -)
- Reviewers: consequences-reviewer, business-logic-reviewer

**Passo 1: teste que falha**
```ts
import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };
const item = (label = 'OS', value = 'CachyOS Linux') => ({ label, value });

describe('post snapshot', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('keeps one to six label/value pairs and an optional version', () => {
    const parsed = post.safeParse({ ...base, snapshot: { version: 'v0.1.9', items: [item(), item('Compositor', 'Niri')] } });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.snapshot).toEqual({
      version: 'v0.1.9',
      items: [item(), item('Compositor', 'Niri')],
    });
    expect(post.safeParse({ ...base, snapshot: { items: [item()] } }).success).toBe(true);
  });

  it('rejects no items, a seventh item, empty or long labels and values, and a long version', () => {
    expect(post.safeParse({ ...base, snapshot: { items: [] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: Array.from({ length: 7 }, () => item()) } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('', 'x')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x'.repeat(21), 'x')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x', '')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x', 'x'.repeat(33))] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { version: 'x'.repeat(17), items: [item()] } }).success).toBe(false);
  });
});
```

**Passo 2:** `npx vitest run tests/content/post-snapshot.test.ts` → FAIL (o Zod descarta `snapshot`: `toEqual` recebe `undefined`, e as rejeições passam como sucesso).

**Passo 3: implementação**
```ts
      /**
       * The "// stack snapshot" card beside the post index (post-detail-redesign
       * REQ-004): what the post ran on, taken from its own text. Absent means
       * no card.
       */
      snapshot: z
        .object({
          version: z.string().min(1).max(16).optional(),
          items: z
            .array(z.object({ label: z.string().min(1).max(20), value: z.string().min(1).max(32) }))
            .min(1)
            .max(6),
        })
        .optional(),
```

**Passo 4:** o mesmo comando → PASS.

**Passo 5: commit** — `/git commit` (só o orquestrador, com consentimento).

---

### Tarefa 2: `snapshot` nos 11 posts publicados correntes

**Requisito:** REQ-004
**Depende de:** Tarefa 1
**Arquivos:**
- Modificar: os 11 `src/content/posts/*.md` com `draft` ausente/`false` e `archived` ausente/`false` (os mesmos que ganharam `extras`/`keyPoints` em `home-latest-post`)
- Criar: `tests/content/post-snapshot-filled.test.ts`

**Team:**
- Track: docs
- Implementer: rpi-implementer (skills: -)
- Reviewers: self-review (conferir cada valor no texto do post)

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { getCurrentPosts } from '../../src/lib/content';

describe('snapshot on the published current posts', () => {
  it('every published current post carries a snapshot', async () => {
    const missing = (await getCurrentPosts()).filter((post) => !post.draft && !post.snapshot).map((post) => post.slug);
    expect(missing).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/content/post-snapshot-filled.test.ts` → FAIL listando os 11 slugs.

**Passo 3: implementação.** Em cada post, depois de `keyPoints`, um bloco como:
```yaml
snapshot:
  version: "v0.1.9"
  items:
    - label: "OS"
      value: "CachyOS Linux"
    - label: "Compositor"
      value: "Niri (scrollable)"
    - label: "Testes"
      value: "BATS (15 testes)"
```
Regras: 3 a 5 pares por post; rótulo até 20 caracteres, valor até 32; **todo valor tem de estar no texto do post** (nada inventado, nada de cliente). `version` só quando o post cita uma versão; sem ela, omita a chave. Rótulos em pt-BR quando houver palavra natural ("Linguagem", "Testes", "Deploy"); nomes de ferramenta ficam como são. Não toque em rascunhos nem arquivados.

**Passo 4:** `rm -f .astro/data-store.json && npx vitest run tests/content/post-snapshot-filled.test.ts tests/content/post-snapshot.test.ts` → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 3: índice em card

**Requisito:** REQ-006
**Arquivos:**
- Modificar: `src/components/posts/PostToc.astro` (arquivo inteiro)
- Modificar: `src/styles/global.css` (bloco "Post index", `@media (width >= 48rem) { [data-toc][popover] {`)
- Teste: `tests/posts/toc.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: testes que falham.** Em `tests/posts/toc.test.ts`, no `describe('PostToc')`:
```ts
  it('heads the card with the label and the number of sections', async () => {
    const html = await render();
    expect(html).toContain('Índice de conteúdo');
    expect(html).toMatch(/>\s*2 seções\s*</);
    expect(html).toContain('data-icon="lucide:list"');
  });

  it('never numbers the items (author, 2026-10-17)', async () => {
    expect(await render()).not.toMatch(/>\s*\d{2}\.?\s*</);
  });
```
e, no `describe('index styles')`, troque o teste "turns the popover into a sticky column" por:
```ts
  it('turns the popover into a card in the side column from 768px', () => {
    const at = css.indexOf('@media (width >= 48rem) {\n  [data-toc][popover] {');
    expect(at).toBeGreaterThan(-1);
    const block = css.slice(at, css.indexOf('}', at));
    expect(block).toMatch(/position:\s*static/);
    expect(block).toMatch(/display:\s*block/);
    expect(block).toMatch(/border:\s*1px solid var\(--color-border\)/);
    expect(block).toMatch(/background-color:\s*var\(--color-surface\)/);
  });
```
(A coluna inteira fica `sticky` na Tarefa 9, com o snapshot junto.)

**Passo 2:** `npx vitest run tests/posts/toc.test.ts` → FAIL (sem cabeçalho; CSS ainda `sticky`).

**Passo 3: implementação.** `src/components/posts/PostToc.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { POST_TOC_ID, type TocItem } from '../../lib/posts/toc';

interface Props {
  items: TocItem[];
}

const { items } = Astro.props;
const sections = items.filter((item) => item.depth === 2).length;
---

{/* A native popover below 768px, opened by PostTocToggle; from md the stylesheet
    turns the same element into a card in the side column ("Post index" in global.css). */}
<nav id={POST_TOC_ID} popover aria-label="Índice" data-toc data-reader-hide>
  <div class="flex items-center justify-between gap-sm border-b border-border pb-sm">
    <p class="flex items-center gap-xs font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">
      <Icon name="lucide:list" class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      Índice de conteúdo
    </p>
    <span class="font-mono text-micro text-muted-foreground">{sections} seções</span>
  </div>
  <ul class="mt-sm flex list-none flex-col gap-xs p-0">
    {
      items.map((item) => (
        <li data-depth={item.depth} class={item.depth === 3 ? 'pl-md' : ''}>
          <a
            href={`#${item.slug}`}
            class="toc-underline inline-block py-xs text-small leading-snug text-muted-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {item.text}
          </a>
        </li>
      ))
    }
  </ul>
</nav>
```
Em `global.css`, o bloco de `md` vira:
```css
@media (width >= 48rem) {
  [data-toc][popover] {
    /* inset before the rest: the shorthand would reset what follows. */
    inset: auto;
    position: static;
    display: block;
    width: auto;
    max-height: none;
    overflow: visible;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface);
  }
}
```
Atualize o comentário de "Post index" (a coluna sticky passa a ser o `<aside>` da página).

**Passo 4:** o mesmo comando → PASS. O teste "puts the index in a column left of the text..." quebra só na Tarefa 9, que o reescreve.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 4: `Prose` com linha entre as seções

**Requisito:** REQ-007
**Arquivos:**
- Modificar: `src/components/ui/Prose.astro` (Props e o `<div data-prose>`)
- Modificar: `src/styles/global.css` (bloco novo depois de "Post index")
- Criar: `tests/components/prose-ruled.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Prose from '../../src/components/ui/Prose.astro';

const css = readFileSync('src/styles/global.css', 'utf8');
const render = async (props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(Prose, { props, slots: { default: '<h2>A</h2><p>x</p>' } });

describe('Prose ruled', () => {
  it('marks the body for ruled sections only when asked', async () => {
    expect(await render({ ruled: true })).toMatch(/<div[^>]*data-prose-ruled/);
    expect(await render()).not.toContain('data-prose-ruled');
  });

  it('rules every section after the first', () => {
    expect(css).toMatch(/\[data-prose-ruled\] h2 ~ h2 \{[^}]*border-top: 1px solid var\(--color-border\);/);
  });

  it('never numbers the sections (author, 2026-10-17)', () => {
    expect(css).not.toMatch(/\[data-prose-ruled\][^{]*\{[^}]*counter/);
  });
});
```

**Passo 2:** `npx vitest run tests/components/prose-ruled.test.ts` → FAIL.

**Passo 3: implementação.** Em `Prose.astro`, acrescente a prop e o atributo:
```astro
interface Props {
  /** Fill the container instead of the 68ch reading measure (the AI view). */
  wide?: boolean;
  /** A hairline between the h2 sections (the post page). */
  ruled?: boolean;
}

const { wide = false, ruled = false } = Astro.props;
```
```astro
<div
  data-prose
  data-prose-ruled={ruled ? '' : undefined}
  class={`${measure} font-sans text-prose text-foreground ${flow.join(' ')} ${code.join(' ')}`}
>
```
Em `global.css`:
```css
/* Sections of a post (post-detail-redesign REQ-007): a hairline above every
   h2 but the first. No numbers, by the author's call. */
[data-prose-ruled] h2 ~ h2 {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-xl);
}
```

**Passo 4:** o mesmo comando → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 5: links de IA rotulados e `CopyButton` compacto

**Requisito:** REQ-003
**Arquivos:**
- Modificar: `src/lib/posts/ai-summary.ts` (`AiSummaryTarget` e `AI_SUMMARY_TARGETS`)
- Modificar: `src/components/posts/AiSummaryLink.astro` (arquivo inteiro)
- Modificar: `src/components/ui/CopyButton.astro` (Props, `shape` e o texto)
- Teste: `tests/posts/ai-summary.test.ts`, `tests/components/copy-button.test.ts` (criar)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: testes que falham.** Em `tests/posts/ai-summary.test.ts`, no `describe('AiSummaryLink')`:
```ts
  it('shows the short name as text when labelled, the accessible name starting with it', async () => {
    const html = await (await AstroContainer.create()).renderToString(AiSummaryLink, {
      props: { markdownUrl: MARKDOWN, labelled: true },
    });
    expect(AI_SUMMARY_TARGETS.map((target) => target.short)).toEqual(['Resumir com Claude', 'Google AI', 'ChatGPT']);
    for (const { short } of AI_SUMMARY_TARGETS) {
      expect(html).toMatch(new RegExp(`<span[^>]*aria-hidden="true"[^>]*>✨</span>\\s*${short}\\s*<span class="sr-only">, abre em nova aba</span>`));
    }
    expect(html).not.toContain('aria-label=');
    expect(html).not.toContain('group-hover/ai:opacity-100');
    expect(html).toContain('data-reader-hide');
  });
```
Criar `tests/components/copy-button.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CopyButton from '../../src/components/ui/CopyButton.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(CopyButton, { props: { target: 'post-url', ...props } });

describe('CopyButton', () => {
  it('takes its own visible text, kept in the span the script swaps', async () => {
    expect(await render({ text: 'Copiar link' })).toMatch(/<span[^>]*>Copiar link<\/span>/);
  });

  it('has a compact size for toolbars, the default staying 44px', async () => {
    const compact = await render({ compact: true });
    expect(compact).toContain('min-h-8');
    expect(compact).toContain('text-caption');
    expect(await render({})).toContain('min-h-11');
  });

  it('still ships hidden, for the site script to reveal', async () => {
    expect(await render({ compact: true })).toMatch(/<button[^>]*hidden/);
  });
});
```

**Passo 2:** `npx vitest run tests/posts/ai-summary.test.ts tests/components/copy-button.test.ts` → FAIL.

**Passo 3: implementação.** Em `ai-summary.ts`, acrescente ao `AiSummaryTarget`:
```ts
  /** Visible text on the post page toolbar (post-detail-redesign REQ-003). */
  short: string;
```
e nos alvos: Claude `short: 'Resumir com Claude'`, Gemini `short: 'Google AI'`, ChatGPT `short: 'ChatGPT'`.

`AiSummaryLink.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { AI_SUMMARY_TARGETS, aiSummaryUrl } from '../../lib/posts/ai-summary';

interface Props {
  /** Absolute URL of the post's markdown view (/<slug>.md). */
  markdownUrl: string;
  /** Text buttons (post toolbar) instead of icons with a tooltip (cards). */
  labelled?: boolean;
}

const { markdownUrl, labelled = false } = Astro.props;
---

{/* Icon only by default, same height as the reading mode switch, the label as a
    tooltip. Labelled, the visible text starts the accessible name (WCAG 2.5.3).
    Hidden in reading mode either way. */}
<div data-reader-hide class="flex flex-wrap gap-xs">
  {
    AI_SUMMARY_TARGETS.map((target) =>
      labelled ? (
        <a
          href={aiSummaryUrl(target, markdownUrl)}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-8 items-center gap-xs rounded-md border border-border-strong bg-surface px-sm font-mono text-caption text-foreground transition-[color,border-color] duration-(--duration-fast) ease-out hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden="true">✨</span>
          {target.short}
          <span class="sr-only">, abre em nova aba</span>
        </a>
      ) : (
        <a
          href={aiSummaryUrl(target, markdownUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${target.label}, abre em nova aba`}
          class="group/ai relative inline-flex size-8 items-center justify-center rounded-md border border-border-strong bg-surface text-muted-foreground transition-[color,border-color] duration-(--duration-fast) ease-out hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name={target.icon} class="size-3.5" aria-hidden="true" />
          <span
            aria-hidden="true"
            class="pointer-events-none absolute top-full left-1/2 z-10 mt-xs -translate-x-1/2 whitespace-nowrap rounded-md border border-border-strong bg-surface-elevated px-sm py-xs font-mono text-caption text-foreground opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover/ai:opacity-100 group-focus-visible/ai:opacity-100"
          >
            ✨ {target.label}
          </span>
        </a>
      ),
    )
  }
</div>
```
`CopyButton.astro`: props novas e uso:
```ts
interface Props {
  /** id of the element whose text is copied. */
  target: string;
  /** Accessible name when the visible label alone is ambiguous on the page. */
  label?: string;
  /** A 44px square with the icon alone; the label stays for screen readers. */
  iconOnly?: boolean;
  /** Visible text; defaults to the AI view's "Copiar". */
  text?: string;
  /** 32px high, caption text: a toolbar beside the reading mode switch. */
  compact?: boolean;
}

const { target, label, iconOnly = false, text = AI_VIEW_LABELS.copy, compact = false } = Astro.props;

const shape = iconOnly
  ? 'size-11 justify-center text-small'
  : compact
    ? 'min-h-8 gap-xs px-sm text-caption'
    : 'min-h-11 gap-xs px-md text-small';
```
Tire `text-small` da string fixa de classes do `<button>` (agora vem de `shape`) e troque `{AI_VIEW_LABELS.copy}` por `{text}` no `<span>`. No compacto, ícone `size-3.5` (`compact ? 'size-3.5' : 'size-4'` nos dois `Icon`).

**Passo 4:** o mesmo comando, mais `npx vitest run tests/ai-view` (usos atuais do `CopyButton`) → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 6: card `PostSnapshot`

**Requisito:** REQ-005
**Depende de:** Tarefa 1
**Arquivos:**
- Criar: `src/components/posts/PostSnapshot.astro`
- Criar: `tests/posts/post-snapshot-card.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostSnapshot from '../../src/components/posts/PostSnapshot.astro';

const snapshot = { version: 'v0.1.9', items: [{ label: 'OS', value: 'CachyOS Linux' }, { label: 'Compositor', value: 'Niri' }] };
const render = async (props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(PostSnapshot, { props });

describe('PostSnapshot', () => {
  it('heads the card with the accent label and the version', async () => {
    const html = await render({ snapshot });
    expect(html).toMatch(/<span[^>]*text-primary[^>]*>\s*<span aria-hidden="true">\/\/ <\/span>stack snapshot\s*<\/span>/);
    expect(html).toContain('v0.1.9');
  });

  it('lists every pair as a description list, in order', async () => {
    const html = await render({ snapshot });
    expect(html).toMatch(/<dl[\s\S]*<dt[^>]*>OS:<\/dt>\s*<dd[^>]*>CachyOS Linux<\/dd>[\s\S]*<dt[^>]*>Compositor:<\/dt>\s*<dd[^>]*>Niri<\/dd>/);
  });

  it('omits the version when there is none, and leaves the page in reading mode', async () => {
    const html = await render({ snapshot: { items: snapshot.items } });
    expect(html).not.toContain('v0.1.9');
    expect(html).toContain('data-reader-hide');
  });
});
```

**Passo 2:** `npx vitest run tests/posts/post-snapshot-card.test.ts` → FAIL (arquivo não existe).

**Passo 3: implementação**
```astro
---
import type { Post } from '../../content/schemas/post';

interface Props {
  snapshot: NonNullable<Post['snapshot']>;
}

const { snapshot } = Astro.props;
---

{/* What the post ran on (post-detail-redesign REQ-005), under the index from md
    and after the text below it. */}
<section
  data-post-snapshot
  data-reader-hide
  aria-label="Stack do post"
  class="flex flex-col gap-sm rounded-lg border border-border bg-surface p-md font-mono text-caption"
>
  <div class="flex items-center justify-between gap-sm border-b border-border pb-sm">
    <span class="text-primary"><span aria-hidden="true">// </span>stack snapshot</span>
    {snapshot.version && <span class="text-muted-foreground">{snapshot.version}</span>}
  </div>
  <dl class="m-0 flex flex-col gap-xs">
    {
      snapshot.items.map((item) => (
        <div class="flex items-baseline justify-between gap-sm">
          <dt class="text-muted-foreground">{item.label}:</dt>
          <dd class="m-0 text-right text-foreground">{item.value}</dd>
        </div>
      ))
    }
  </dl>
</section>
```

**Passo 4:** o mesmo comando → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 7: caixa `AuthorBox`

**Requisito:** REQ-008
**Arquivos:**
- Criar: `src/components/posts/AuthorBox.astro`
- Criar: `tests/posts/author-box.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AuthorBox from '../../src/components/posts/AuthorBox.astro';

const SITE = 'https://nandomoreira.dev';
const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(AuthorBox, { props: { site: SITE, ...props } });

describe('AuthorBox', () => {
  it('asks the reader in, with the fixed copy', async () => {
    const html = await render({ email: 'oi@nandomoreira.dev' });
    expect(html).toMatch(/<h2[^>]*>\s*Conversar com o autor\s*<\/h2>/);
    expect(html).toContain(
      'Ficou alguma dúvida, achou um erro ou quer propor uma melhoria? Me chama por e-mail ou entrega este site para o seu agente.',
    );
    expect(html).toContain('data-icon="lucide:square-terminal"');
  });

  it('links the e-mail and the agent brief, both secondary', async () => {
    const html = await render({ email: 'oi@nandomoreira.dev' });
    expect(html).toMatch(/<a[^>]*href="mailto:oi@nandomoreira\.dev"[^>]*>[\s\S]*?oi@nandomoreira\.dev[\s\S]*?<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/AGENTS\.md"[^>]*>[\s\S]*?\$ curl https:\/\/nandomoreira\.dev\/AGENTS\.md[\s\S]*?<\/a>/);
    expect(html).not.toContain('bg-primary');
  });

  it('drops the e-mail link without an e-mail, and leaves the page in reading mode', async () => {
    const html = await render({});
    expect(html).not.toContain('mailto:');
    expect(html).toContain('href="/AGENTS.md"');
    expect(html).toContain('data-reader-hide');
  });
});
```

**Passo 2:** `npx vitest run tests/posts/author-box.test.ts` → FAIL (arquivo não existe).

**Passo 3: implementação**
```astro
---
import { Icon } from 'astro-icon/components';

interface Props {
  /** Site origin, shown in the curl line. */
  site: string;
  /** The profile's e-mail contact; absent, the link is left out. */
  email?: string;
}

const { site, email } = Astro.props;
const link =
  'inline-flex min-h-11 items-center gap-xs rounded-md border border-border-strong bg-background px-md font-mono text-caption transition-[color,border-color] duration-(--duration-fast) ease-out hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
---

{/* The post's closing invitation (post-detail-redesign REQ-008): the same copy on
    every post, two secondary links, never a second primary CTA. */}
<aside
  data-author-box
  data-reader-hide
  aria-labelledby="author-box-title"
  class="mt-2xl flex flex-col gap-md rounded-lg border border-border bg-surface p-lg"
>
  <div class="flex items-center gap-sm">
    <Icon name="lucide:square-terminal" class="size-5 shrink-0 text-primary" aria-hidden="true" />
    <h2 id="author-box-title" class="font-sans text-body font-semibold text-foreground">Conversar com o autor</h2>
  </div>
  <p class="text-small text-muted-foreground">
    Ficou alguma dúvida, achou um erro ou quer propor uma melhoria? Me chama por e-mail ou entrega este site para o seu agente.
  </p>
  <div class="flex flex-wrap gap-sm">
    {
      email && (
        <a href={`mailto:${email}`} class={`${link} text-foreground hover:text-primary`}>
          {email}
          <span aria-hidden="true">↗</span>
        </a>
      )
    }
    <a href="/AGENTS.md" class={`${link} text-success`}>$ curl {site}/AGENTS.md</a>
  </div>
</aside>
```

**Passo 4:** o mesmo comando → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 8: `RelatedPostCard`

**Requisito:** REQ-009
**Arquivos:**
- Criar: `src/components/posts/RelatedPostCard.astro`
- Criar: `tests/posts/related-post-card.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import RelatedPostCard from '../../src/components/posts/RelatedPostCard.astro';
import type { Post } from '../../src/content/schemas/post';

const post: Post = {
  slug: 'espanso',
  title: 'espanso no Linux',
  summary: 'Um resumo.',
  date: '2026-10-16',
  markers: ['linux', 'cli', 'produtividade'],
  draft: false,
  archived: false,
};
const render = async () => (await AstroContainer.create()).renderToString(RelatedPostCard, { props: { post } });

describe('RelatedPostCard', () => {
  it('shows the short date, the first marker, the title and the summary', async () => {
    const html = await render();
    expect(html).toContain('<time datetime="2026-10-16">16 out. 2026</time>');
    expect(html).toContain('#linux');
    expect(html).not.toContain('#cli');
    expect(html).toMatch(/<h3[^>]*>[\s\S]*espanso no Linux[\s\S]*<\/h3>/);
    expect(html).toMatch(/<p[^>]*line-clamp-3[^>]*>\s*Um resumo\.\s*<\/p>/);
  });

  it('has one link, the title, stretched over the card', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    const link = html.match(/<a[^>]*href="\/espanso"[^>]*>/)?.[0] ?? '';
    expect(link).toContain('after:absolute');
    expect(link).toContain('after:inset-0');
    expect(html).toMatch(/<article[^>]*class="[^"]*\brelative\b/);
  });

  it('cues "Ler artigo" visually, never as a second tab stop', async () => {
    const html = await render();
    expect(html).toMatch(/<span[^>]*data-read-cue[^>]*aria-hidden="true"[^>]*>[\s\S]*?Ler artigo/);
  });
});
```

**Passo 2:** `npx vitest run tests/posts/related-post-card.test.ts` → FAIL (arquivo não existe).

**Passo 3: implementação**
```astro
---
import { Icon } from 'astro-icon/components';
import type { Post } from '../../content/schemas/post';
import { toShortDate } from '../../lib/format/date';
import { toHashtag } from '../../lib/posts/tags';

interface Props {
  post: Post;
}

const { post } = Astro.props;
const marker = post.markers[0];
---

{/* Same stretched-link pattern as PostCard: the title is the only link, so the
    whole card clicks with one tab stop. */}
<article
  data-related-post
  class="group relative flex h-full flex-col gap-sm rounded-lg border border-border bg-surface p-lg transition-[border-color] duration-(--duration-fast) ease-out hover:border-border-strong"
>
  <p class="flex items-center justify-between gap-sm font-mono text-caption text-muted-foreground">
    <time datetime={post.date}>{toShortDate(post.date)}</time>
    {marker && <span class="text-primary">{toHashtag(marker)}</span>}
  </p>
  <h3 class="font-sans text-body font-medium text-pretty text-foreground transition-colors group-hover:text-primary">
    <a
      href={`/${post.slug}`}
      class="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
    >
      {post.title}
    </a>
  </h3>
  <p class="line-clamp-3 text-small text-muted-foreground">{post.summary}</p>
  <span
    data-read-cue
    aria-hidden="true"
    class="mt-auto flex items-center justify-between border-t border-border pt-sm font-mono text-caption text-muted-foreground group-hover:text-primary"
  >
    Ler artigo
    <Icon name="lucide:arrow-right" class="size-3.5 shrink-0" />
  </span>
</article>
```
(Se `toShortDate('2026-10-16')` não devolver `16 out. 2026`, ajuste o teste ao formato real que o `PostCard` já usa.)

**Passo 4:** o mesmo comando → PASS.

**Passo 5: commit** — `/git commit`.

---

### Tarefa 9: montar a página

**Requisitos:** REQ-001, REQ-002, REQ-003, REQ-005, REQ-007, REQ-008, REQ-009, REQ-010
**Depende de:** Tarefas 1 a 8
**Arquivos:**
- Modificar: `src/pages/[slug].astro` (frontmatter e template inteiros, abaixo de `<script type="application/ld+json">`)
- Teste: `tests/posts/post-page.test.ts`, `tests/posts/toc.test.ts`, `tests/posts/ai-summary.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: testes que falham.** Em `tests/posts/post-page.test.ts`:

- Troque "shows the full publication date on the post, labelled" e "follows the date with the post tags..." por:
```ts
  it('opens with date, tags and reading time, no prompt and no "publicado:"', async () => {
    const post = (await getAllPostEntries()).find((entry) => entry.data.slug === 'rdo-solo-red-dead-online-sozinho-pelo-gateway')!;
    const html = await renderEntry(post);
    const meta = html.match(/<p[^>]*data-post-meta[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(meta).toMatch(/<time[^>]*datetime="2026-10-11"[^>]*>\s*11 de outubro de 2026\s*<\/time>/);
    expect([...meta.matchAll(/>(#[^<]+)</g)].map((m) => m[1])).toEqual(['#linux', '#redes', '#open-source']);
    expect(meta).toMatch(/data-icon="lucide:clock"[\s\S]*\d+ min de leitura/);
    expect(meta.match(/<span[^>]*aria-hidden="true"[^>]*>•<\/span>/g)).toHaveLength(2);
    expect(html).not.toContain('publicado:');
    expect(html).not.toContain('&lt;!--');
    expect(html.indexOf('data-post-meta')).toBeLessThan(html.search(/<h1\b/));
  });

  it('has no back trail: the menu already marks the blog', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    expect(html).not.toContain('Voltar aos posts');
    expect(html).not.toContain('Trilha de navegação');
  });

  it('puts the summary under the title as the lead', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    const lead = html.match(/<p[^>]*data-post-lead[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
    expect(lead.trim()).toBe(entry.data.summary);
    expect(html.search(/<h1\b/)).toBeLessThan(html.indexOf('data-post-lead'));
  });

  it('groups the reader switch, the labelled AI links, copy link and .md in one toolbar', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    const bar = html.slice(html.indexOf('data-post-toolbar'), html.indexOf('data-post-toolbar-end'));
    expect(bar).toContain('id="reader-on"');
    expect(bar).toContain('Resumir com Claude');
    expect(bar).toMatch(/<button[^>]*data-copy="post-url"[^>]*hidden/);
    expect(bar).toContain('Copiar link');
    expect(bar).toMatch(/<a[^>]*href="\/fluxo-rpi-claude-code-grok-codex\.md"/);
    expect(html).toMatch(/<span id="post-url" hidden>https:\/\/nandomoreira\.dev\/fluxo-rpi-claude-code-grok-codex<\/span>/);
  });

  it('rules the body sections and closes with the author box before the related posts', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    expect(html).toContain('data-prose-ruled');
    const box = html.indexOf('data-author-box');
    expect(box).toBeGreaterThan(html.indexOf('data-prose'));
    expect(box).toBeLessThan(html.search(/aria-labelledby="related-heading"/));
  });

  it('shows the snapshot card in the side column when the post has one', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'scratchpad-no-niri-janelas-que-somem-com-um-atalho')!;
    expect(entry.data.snapshot).toBeDefined();
    const html = await renderEntry(entry);
    const aside = html.match(/<aside[^>]*data-post-aside[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? '';
    expect(aside).toContain('data-toc');
    expect(aside).toContain('data-post-snapshot');
  });
```
- Em "closes with three related posts...", acrescente:
```ts
    expect(section).toContain('LEITURA COMPLEMENTAR');
    expect(section.match(/data-related-post/g)).toHaveLength(3);
    expect(section).toMatch(/<a[^>]*href="\/posts"[^>]*>[\s\S]*?Ver todos no blog/);
```
  e troque o regex de links para ignorar `/posts`: `[...section.matchAll(/<a[^>]*href="\/([^"#/]+)"/g)].map((m) => m[1]).filter((slug) => slug !== 'posts')`.
- Em "puts the title and date above the cover", inverta para a meta vir antes do título e acrescente a capa depois da caixa:
```ts
    expect(time).toBeLessThan(heading);
    expect(figure).toBeGreaterThan(html.indexOf('data-post-toolbar-end'));
```
- Em "draws the declared art...", acrescente `expect(html.search(/data-art/)).toBeGreaterThan(html.indexOf('data-post-toolbar-end'));`.

Em `tests/posts/toc.test.ts`, troque "puts the index in a column left of the text..." por:
```ts
  it('puts a sticky side column left of the text from md when there is an index or a snapshot', () => {
    expect(page).toContain('const hasAside = toc.length > 0 || Boolean(post.snapshot);');
    expect(page).toContain("'flex flex-col gap-xl md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-xl lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-2xl'");
    expect(page).toMatch(/<aside[^>]*data-post-aside[^>]*md:sticky md:top-3xl md:self-start/);
    expect(page).toMatch(/<Prose ruled>/);
  });
```
Em `tests/posts/ai-summary.test.ts`, troque o teste do `describe('post page')` por:
```ts
  it('puts the labelled links in the toolbar, beside the reading mode switch, with the post markdown', () => {
    const page = readFileSync('src/pages/[slug].astro', 'utf8');
    expect(page).toMatch(/<ReaderMode \/>[\s\S]*?<AiSummaryLink labelled markdownUrl=\{markdownUrl\} \/>/);
  });
```

**Passo 2:** `npx vitest run tests/posts/post-page.test.ts tests/posts/toc.test.ts tests/posts/ai-summary.test.ts` → FAIL nos testes novos.

**Passo 3: implementação.** No frontmatter de `src/pages/[slug].astro`:

- Imports: tire `ListRow`; acrescente `Icon` (`astro-icon/components`), `CopyButton` (`../components/ui/CopyButton.astro`), `PostSnapshot`, `AuthorBox`, `RelatedPostCard` (`../components/posts/...`) e `readingMinutes` (`../lib/posts/reading-time`). `toShortDate` sai se ficar sem uso.
- Troque `tocLayout`, `published` e acrescente:
```ts
const hasAside = toc.length > 0 || Boolean(post.snapshot);
// A side column left of the text from md (index, snapshot), wider from lg;
// below md the column comes after the text. Without either, the text keeps the width.
const layout = hasAside
  ? 'flex flex-col gap-xl md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-xl lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-2xl'
  : '';
const profile = await getProfile();
const email = profile.contacts.find((contact) => contact.kind === 'email')?.value;
const minutes = readingMinutes(live.body ?? '');
const markdownUrl = `${site}/${post.slug}.md`;
const canonical = `${site}/${post.slug}`;
```
  (reuse `profile` em `jsonLdForPost` e `displayNameOf` no lugar das outras chamadas a `getProfile()`).

Template (substitui o `<nav>` da trilha, o `<article>` e a `<section>` de relacionados):
```astro
  <article class="mt-2xl flex flex-col gap-xl" data-reader-article>
    <header class="flex flex-col gap-md">
      {/* "Rascunho" and "Arquivo" badges exactly as today */}
      <p data-post-meta class="flex flex-wrap items-center gap-x-sm gap-y-xs font-mono text-small text-muted-foreground">
        <time datetime={post.date}>{toLongDate(post.date)}</time>
        {
          post.markers.length > 0 && (
            <Fragment>
              <span aria-hidden="true">•</span>
              {post.markers.map((marker) => (
                <span>{toHashtag(marker)}</span>
              ))}
            </Fragment>
          )
        }
        <span aria-hidden="true">•</span>
        <span class="inline-flex items-center gap-xs">
          <Icon name="lucide:clock" class="size-3.5 shrink-0" aria-hidden="true" />
          {minutes} min de leitura
        </span>
      </p>
      <h1 class="max-w-list font-serif text-h1 font-normal tracking-tight text-balance text-foreground sm:text-display">{post.title}</h1>
      <p data-post-lead class="max-w-list text-h3 text-muted-foreground">{post.summary}</p>

      <div
        data-post-toolbar
        class="mt-md flex flex-col gap-md rounded-lg border border-border bg-surface p-md md:flex-row md:items-start md:justify-between md:p-lg"
      >
        <ReaderMode />
        <div class="flex flex-wrap items-center gap-sm md:border-l md:border-border md:pl-lg">
          <AiSummaryLink labelled markdownUrl={markdownUrl} />
          <div data-reader-hide class="flex flex-wrap gap-xs">
            <span id="post-url" hidden>{canonical}</span>
            <CopyButton target="post-url" text="Copiar link" compact />
            <a
              href={`/${post.slug}.md`}
              class="inline-flex min-h-8 items-center rounded-md border border-border-strong bg-surface px-sm font-mono text-caption text-muted-foreground transition-[color,border-color] duration-(--duration-fast) ease-out hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              .md
            </a>
          </div>
        </div>
      </div>
      <span data-post-toolbar-end hidden></span>
      <hr class="m-0 border-border" />

      {/* cover <figure> and art <div> exactly as today (same attributes) */}
    </header>
    <div data-toc-layout class={layout}>
      {
        hasAside && (
          <aside
            data-post-aside
            class={`order-last flex flex-col gap-md md:order-none md:sticky md:top-3xl md:self-start ${post.snapshot ? '' : 'hidden md:flex'}`}
          >
            {toc.length > 0 && <PostToc items={toc} />}
            {post.snapshot && <PostSnapshot snapshot={post.snapshot} />}
          </aside>
        )
      }
      <div>
        <Prose ruled>
          <Content />
        </Prose>
        <AuthorBox site={site} email={email} />
      </div>
    </div>
    {toc.length > 0 && <PostTocToggle />}
  </article>

  {
    related.length > 0 && (
      <section aria-labelledby="related-heading" class="mt-3xl mb-3xl border-t border-border pt-2xl" data-reader-hide>
        <div class="flex flex-wrap items-end justify-between gap-md">
          <div>
            <p class="font-mono text-small uppercase tracking-eyebrow text-primary">
              <span aria-hidden="true">{'// '}</span>Leitura complementar
            </p>
            <h2 id="related-heading" class="mt-xs font-serif text-h2 font-normal text-foreground">Posts relacionados</h2>
          </div>
          <a
            href="/posts"
            class="group/more inline-flex min-h-11 items-center gap-xs font-mono text-small text-muted-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Ver todos no blog
            <Icon name="lucide:arrow-right" aria-hidden="true" class="size-4 shrink-0" />
          </a>
        </div>
        <ul class="mt-lg grid list-none grid-cols-1 gap-md p-0 md:grid-cols-3">
          {related.map((item) => (
            <li>
              <RelatedPostCard post={item} />
            </li>
          ))}
        </ul>
      </section>
    )
  }
```
Notas:
- O rótulo "LEITURA COMPLEMENTAR" vem do `uppercase`; o teste procura o texto renderizado, então escreva `LEITURA COMPLEMENTAR` no template se o teste comparar maiúsculas (a fonte decide; mantenha o teste e o template coerentes).
- O `<span data-post-toolbar-end hidden>` é só âncora de teste; se preferir, troque por um `data-` no `<hr>` e ajuste os testes.
- Modo leitura: `:root:has(#reader-on:checked) [data-toc-layout] { display: block; }` continua valendo; o `<aside>` some porque os filhos têm `data-reader-hide`; acrescente `data-reader-hide` também no `<aside>` para não sobrar o `gap`.
- O `<hr>` e o `<AuthorBox>` precisam sumir no modo leitura: `data-reader-hide` no `<hr>`.

**Passo 4:** o mesmo comando → PASS. Depois, `curl -s localhost:4321/scratchpad-no-niri-janelas-que-somem-com-um-atalho | grep -c 'data-post-snapshot\|data-author-box\|data-related-post'` com o dev no ar (1 + 1 + 3).

**Passo 5: commit** — `/git commit`.

---

## Fecho

`npm run verify` sem erro. Conferência visual no dev (`/scratchpad-no-niri-janelas-que-somem-com-um-atalho`, um post arquivado com capa e um sem `h2`) em 1280px e 390px, com e sem modo leitura.
