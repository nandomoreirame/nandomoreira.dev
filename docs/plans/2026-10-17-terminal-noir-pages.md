# Plano: terminal-noir-pages

> **Spec:** docs/specs/terminal-noir-pages/SPEC.md

**Objetivo:** levar o visual das telas internas do Stitch para Setup, Agora, Sobre, Contato,
Blog, Portfólio, Lab, post e case, com tempo de leitura e `PostRow` no blog.
**Arquitetura:** lógica em funções puras sob `src/lib/` (tempo de leitura, domínio do
case); componentes de UI pequenos e reutilizáveis (`SectionHeader` com `step`,
`UpdatedAt`, `SectionRule`, `PostRow`); páginas como cascas finas. Sem JavaScript novo.
**Stack:** Astro 7 SSR, Tailwind 4 (tokens em `@theme`), Zod, Vitest com
`experimental_AstroContainer`.
**Total de tarefas:** 18 em 4 lotes.
**Complexidade estimada:** large.
**Depends on:** a fase 6 da feature mãe (`AgentBrief` com realce, sem commit no início
deste plano) precisa estar commitada antes da tarefa 13, que muda o mesmo arquivo.

---

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD obrigatório: o passo 1 de cada tarefa é o teste vermelho, e ele precisa falhar pelo motivo certo.
- Texto visível não muda, exceto o que a spec aprova (CTAs, card da página Agora, "N artigos", "No ar", "N min de leitura").
- Nenhum hex, nenhum valor arbitrário novo do Tailwind, nenhum `client:*`, nenhum `<script>` novo.
- Comentários e identificadores em inglês, sem travessão.
- Comando de um teste: `npx vitest run <arquivo>`. Suíte: `npx vitest run`. Tipos: `npm run check`.

## Lotes

| Lote | Tarefas | Depende de |
|---|---|---|
| 1. Fundação | 1 a 7 | nada |
| 2. Blog | 8 e 9 | 1, 2, 3 |
| 3. Páginas | 10 a 17 | 4, 5, 6, 7 |
| 4. Fechamento | 18 | todos |

---

## Lote 1: fundação

### Tarefa 1: tempo de leitura como função pura

**Requisito:** REQ-008
**Arquivos:**
- Criar: `src/lib/posts/reading-time.ts`
- Teste: `tests/posts/reading-time.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: type-safety-reviewer, test-reviewer

**Passo 1: teste vermelho**
```ts
import { describe, expect, it } from 'vitest';
import { readingMinutes } from '../../src/lib/posts/reading-time';

const words = (n: number) => Array.from({ length: n }, () => 'palavra').join(' ');

describe('readingMinutes', () => {
  it('reads 200 words a minute, rounding up', () => {
    expect(readingMinutes(words(400))).toBe(2);
    expect(readingMinutes(words(401))).toBe(3);
  });

  it('never goes below one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('Oi.')).toBe(1);
  });

  it('skips fenced code blocks', () => {
    expect(readingMinutes(`${words(200)}\n\n\`\`\`ts\n${words(1000)}\n\`\`\`\n`)).toBe(1);
  });

  it('skips the frontmatter', () => {
    expect(readingMinutes(`---\ntitle: x\nsummary: ${words(1000)}\n---\n${words(200)}`)).toBe(1);
  });

  it('counts link text but not the URL, and ignores images', () => {
    const link = '[texto do link](https://exemplo.com/um/caminho/muito/longo) ';
    expect(readingMinutes(link.repeat(100))).toBe(2);
    expect(readingMinutes('![alt](/img.png) '.repeat(500))).toBe(1);
  });

  it('keeps hyphenated and accented words whole', () => {
    expect(readingMinutes('pré-normalização ação é '.repeat(67))).toBe(2);
  });
});
```

**Passo 2:** `npx vitest run tests/posts/reading-time.test.ts`. Esperado: FAIL, módulo inexistente.

**Passo 3: implementação**
```ts
/**
 * Minutes to read a post body (REQ-008): words at 200 per minute, rounded
 * up, never below one. Code blocks, images, URLs, HTML tags, the frontmatter
 * and markdown syntax do not count.
 */
const WORDS_PER_MINUTE = 200;

export const readingMinutes = (markdown: string): number => {
  const text = markdown
    .replace(/^---\n[\s\S]*?\n---\n?/, ' ')
    .replace(/(```|~~~)[\s\S]*?\1/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, ' ')
    .replace(/[*_`~|]/g, ' ');
  const count = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return Math.max(1, Math.ceil(count / WORDS_PER_MINUTE));
};
```

**Passo 4:** mesmo comando. Esperado: PASS (6 testes).

**Passo 5:** `/git commit`

### Tarefa 2: `readingMinutes` na camada de acesso

**Requisito:** REQ-008
**Arquivos:**
- Modificar: `src/lib/content/posts.ts` (helpers genéricos e `load`)
- Modificar: `src/lib/content/index.ts` (exportar o tipo `PostSummary`)
- Teste: `tests/content/reading-minutes.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: type-safety-reviewer, test-reviewer, consequences-reviewer

**Passo 1: teste vermelho**
```ts
import { describe, expect, it } from 'vitest';
import { getAllPosts, getCurrentPosts, getPost } from '../../src/lib/content';

describe('readingMinutes on loaded posts', () => {
  it('attaches at least one minute to every visible post', async () => {
    const posts = await getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) expect(post.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('keeps it through the current listing and the single lookup', async () => {
    const [first] = await getCurrentPosts();
    expect(first?.readingMinutes).toBeGreaterThanOrEqual(1);
    expect((await getPost(first!.slug))?.readingMinutes).toBe(first!.readingMinutes);
  });
});
```

**Passo 2:** `npx vitest run tests/content/reading-minutes.test.ts`. Esperado: FAIL, `readingMinutes` indefinido.

**Passo 3: implementação**

Em `src/lib/content/posts.ts`:
- importar `import { readingMinutes } from '../posts/reading-time';`
- declarar `export type PostSummary = Post & { readingMinutes: number };`
- tornar genéricos, sem mudar o corpo, os helpers que filtram e ordenam: `publishedPosts`, `sortPosts`, `currentOf`, `archivedOf`, `draftsFirst` passam a ter a assinatura `<T extends Post>(posts: readonly T[], ...) : T[]`;
- trocar `load`:
```ts
const toSummary = (entry: PostEntry): PostSummary => ({
  ...entry.data,
  readingMinutes: readingMinutes(entry.body ?? ''),
});

const load = async (): Promise<PostSummary[]> => (await loadEntries()).map(toSummary);
```
- trocar o tipo de retorno de `getAllPosts`, `getCurrentPosts`, `getArchivedPosts`, `getArchivedPostsByYear` e `getPost` de `Post` para `PostSummary`. `getUpcomingPosts` continua `Post[]`.

Em `src/lib/content/index.ts`: `export type { ArchiveYear, PostEntry, PostSummary } from './posts';`

**Passo 4:** `npx vitest run tests/content` e `npm run check`. Esperado: PASS e 0 erros. Se o Vitest não enxergar os posts, o store de conteúdo é o do dev server (ver `CLAUDE.md`, armadilhas do Astro).

**Passo 5:** `/git commit`

### Tarefa 3: campo `extras` no schema de post

**Requisito:** REQ-010
**Arquivos:**
- Modificar: `src/content/schemas/post.ts` (objeto do schema, depois de `cover`)
- Teste: `tests/content/post-extras.test.ts`

**Team:**
- Track: data
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer, consequences-reviewer

**Passo 1: teste vermelho**
```ts
import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };

describe('post extras', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('takes one or two short lines', () => {
    expect(post.safeParse({ ...base, extras: ['5 dias → 30 min'] }).success).toBe(true);
    expect(post.safeParse({ ...base, extras: ['5 dias → 30 min', 'Python · Polars'] }).success).toBe(true);
  });

  it('rejects an empty list, a third line and a line over 60 characters', () => {
    expect(post.safeParse({ ...base, extras: [] }).success).toBe(false);
    expect(post.safeParse({ ...base, extras: ['a', 'b', 'c'] }).success).toBe(false);
    expect(post.safeParse({ ...base, extras: ['x'.repeat(61)] }).success).toBe(false);
  });
});
```

**Passo 2:** `npx vitest run tests/content/post-extras.test.ts`. Esperado: FAIL nos casos de rejeição (a chave desconhecida é descartada e o parse passa).

**Passo 3: implementação**, dentro do `z.object` de `postSchema`, depois de `cover`:
```ts
      /**
       * Up to two short lines shown under the summary in the blog listing
       * (REQ-010): a measured result first, then a detail. Written by the
       * author per post; absent means no line.
       */
      extras: z.array(z.string().min(1).max(60)).min(1).max(2).optional(),
```

**Passo 4:** mesmo comando. Esperado: PASS. Antes de rodar o dev server de novo, pare-o e apague `.astro/data-store.json` só se a suíte de conteúdo acusar o campo novo descartado (armadilha do `CLAUDE.md`).

**Passo 5:** `/git commit`

### Tarefa 4: domínio do case (`liveHost`)

**Requisito:** REQ-012
**Arquivos:**
- Criar: `src/lib/catalog/live-host.ts`
- Teste: `tests/catalog/live-host.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho**
```ts
import { describe, expect, it } from 'vitest';
import { liveHost } from '../../src/lib/catalog/live-host';

describe('liveHost', () => {
  it('drops the protocol, www and the path', () => {
    expect(liveHost('https://www.bragstack.app/')).toBe('bragstack.app');
    expect(liveHost('https://mousai.gallery/g/abc')).toBe('mousai.gallery');
  });

  it('keeps any other subdomain', () => {
    expect(liveHost('https://app.exemplo.com')).toBe('app.exemplo.com');
  });

  it('returns undefined for no URL or an invalid one', () => {
    expect(liveHost(undefined)).toBeUndefined();
    expect(liveHost(null)).toBeUndefined();
    expect(liveHost('not a url')).toBeUndefined();
  });
});
```

**Passo 2:** `npx vitest run tests/catalog/live-host.test.ts`. Esperado: FAIL, módulo inexistente.

**Passo 3: implementação**
```ts
/** The host a case is live on, as shown in the listing (REQ-012). */
export const liveHost = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 5: `SectionHeader` numerado (`step`)

**Requisito:** REQ-001
**Arquivos:**
- Modificar: `src/components/ui/SectionHeader.astro`
- Teste: `tests/components/section-header-step.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionHeader from '../../src/components/ui/SectionHeader.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(SectionHeader, { props: { title: 'Desktop e sistema', ...props } });
};

describe('SectionHeader step', () => {
  it('prefixes the title with a two-digit step and //, hidden from screen readers', async () => {
    const html = await render({ step: 1 });
    const heading = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/)?.[0] ?? '';

    expect(heading).toMatch(/<span aria-hidden="true" class="[^"]*\bfont-mono\b[^"]*\btext-primary\b[^"]*">01 \/\/<\/span>/);
    expect(heading.indexOf('01 //')).toBeLessThan(heading.indexOf('Desktop e sistema'));
  });

  it('sets a numbered title in the sans at h3 size, not as an eyebrow', async () => {
    const heading = (await render({ step: 3 })).match(/<h2[^>]*>/)?.[0] ?? '';

    expect(heading).toContain('text-h3');
    expect(heading).toContain('font-medium');
    expect(heading).not.toContain('tracking-eyebrow');
  });

  it('keeps the eyebrow header when no step is given, even with an index', async () => {
    const html = await render({ index: 2 });

    expect(html).not.toContain('//');
    expect(html).toContain('tracking-eyebrow');
  });
});
```

**Passo 2:** `npx vitest run tests/components/section-header-step.test.ts`. Esperado: FAIL.

**Passo 3: implementação** (`SectionHeader.astro`)
```astro
---
interface Props {
  title: string;
  level?: 2 | 3;
  count?: number;
  description?: string;
  index?: number;
  /** Shows "01 //" before the title and sets it in the sans, as on the Stitch Setup and Now screens. */
  step?: number;
  id?: string;
}

const { title, level = 2, count, description, step, id } = Astro.props;
const Heading = `h${level}` as 'h2' | 'h3';
const numbered = typeof step === 'number';
const headingClass = numbered
  ? 'flex items-baseline gap-sm text-h3 font-medium text-foreground'
  : 'font-mono text-small uppercase tracking-eyebrow text-muted-foreground';
---

<header class="mb-xl">
  <div class="flex items-baseline justify-between border-b border-border pb-sm">
    <Heading id={id} class={headingClass}>
      {numbered && (
        <span aria-hidden="true" class="font-mono text-small text-primary">{String(step).padStart(2, '0')} //</span>
      )}
      {title}
    </Heading>
    {typeof count === 'number' && (
      <span class="font-mono text-small text-muted-foreground">
        ({String(count).padStart(2, '0')})
      </span>
    )}
  </div>
  {description && <p class="mt-md text-body text-muted-foreground">{description}</p>}
</header>
```

**Passo 4:** `npx vitest run tests/components`. Esperado: PASS, incluindo `badge-and-header.test.ts`.

**Passo 5:** `/git commit`

### Tarefa 6: faixa "Atualizada em" (`UpdatedAt`)

**Requisito:** REQ-013
**Arquivos:**
- Criar: `src/components/ui/UpdatedAt.astro`
- Modificar: `src/pages/setup.astro:20-22`, `src/pages/now.astro:31-33`, `src/pages/privacidade.astro:26-28`
- Teste: `tests/components/updated-at.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import UpdatedAt from '../../src/components/ui/UpdatedAt.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(UpdatedAt, { props: { date: '2026-10-16' } });
};

describe('UpdatedAt', () => {
  it('states the date in words, with a machine-readable time', async () => {
    const html = await render();
    expect(html).toMatch(/Atualizada em <time datetime="2026-10-16">16 de outubro de 2026<\/time>\./);
  });

  it('is a mono strip with a clock icon and an amber rule on the left', async () => {
    const html = await render();
    const root = html.match(/^\s*<p[^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(root).toEqual(expect.stringContaining('font-mono'));
    expect(root).toEqual(expect.stringContaining('border-l-2'));
    expect(root).toEqual(expect.stringContaining('border-primary'));
    expect(html).toMatch(/data-icon="lucide:clock"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-icon="lucide:clock"/);
  });

  it.each(['src/pages/setup.astro', 'src/pages/now.astro', 'src/pages/privacidade.astro'])('%s uses it', (file) => {
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('<UpdatedAt');
    expect(source).not.toContain('Atualizada em <time');
  });
});
```

**Passo 2:** `npx vitest run tests/components/updated-at.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
```astro
---
import { Icon } from 'astro-icon/components';
import { formatPolicyDate } from '../../lib/privacy/policy';

interface Props {
  /** ISO date, YYYY-MM-DD. */
  date: string;
}

const { date } = Astro.props;
---

<p class="flex items-center gap-sm border-l-2 border-primary pl-md font-mono text-small text-muted-foreground">
  <Icon name="lucide:clock" aria-hidden="true" class="size-4 shrink-0" />
  <span>Atualizada em <time datetime={date}>{formatPolicyDate(date)}</time>.</span>
</p>
```
Nas três páginas, trocar o `<p class="font-mono text-small text-muted-foreground">Atualizada em ...</p>` por `<UpdatedAt date={SETUP_UPDATED_AT} />` (e `NOW_UPDATED_AT`, `POLICY_UPDATED_AT`), importando `UpdatedAt` de `../components/ui/UpdatedAt.astro` e removendo o import de `formatPolicyDate` onde ele ficar sem uso.

**Passo 4:** `npx vitest run tests/components tests/now tests/pages`. Esperado: PASS. Se `now-page.test.ts` procurar a linha antiga, ajuste a asserção para o texto, nunca a remova.

**Passo 5:** `/git commit`

### Tarefa 7: fio de largura total (`SectionRule`)

**Requisito:** REQ-016
**Arquivos:**
- Criar: `src/components/ui/SectionRule.astro`
- Teste: `tests/components/section-rule.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionRule from '../../src/components/ui/SectionRule.astro';

describe('SectionRule', () => {
  it('is a decorative full-bleed hairline', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionRule);
    const classes = (html.match(/<hr[^>]*class="([^"]*)"/)?.[1] ?? '').split(/\s+/);

    expect(html).toMatch(/<hr[^>]*aria-hidden="true"/);
    expect(classes).toEqual(expect.arrayContaining(['relative', 'left-1/2', 'w-screen', '-translate-x-1/2', 'border-t', 'border-border']));
  });
});
```

**Passo 2:** `npx vitest run tests/components/section-rule.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
```astro
---
/**
 * Full-bleed hairline between home sections (Terminal Noir). Breaks out of
 * the page container with transforms only; body clips the overflow on x.
 * Decorative: the sections carry their own headings.
 */
---

<hr aria-hidden="true" class="relative left-1/2 w-screen -translate-x-1/2 border-0 border-t border-border" />
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

---

## Lote 2: blog

### Tarefa 8: componente `PostRow`

**Requisito:** REQ-009, REQ-010
**Arquivos:**
- Criar: `src/components/posts/PostRow.astro`
- Teste: `tests/posts/post-row.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, type-safety-reviewer

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostRow from '../../src/components/posts/PostRow.astro';

const base = {
  href: '/espanso',
  title: 'espanso: a substituição de texto do iPhone, agora no meu Linux',
  summary: 'Usei a Substituição de texto do macOS por anos.',
  date: '2026-10-16',
  readingMinutes: 4,
  markers: ['linux', 'espanso', 'wayland', 'niri'],
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(PostRow, { props: { ...base, ...props } });
};

describe('PostRow', () => {
  it('is one link to the post, with no trailing arrow', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/espanso"');
    expect(html).not.toContain('lucide:arrow-right');
    expect(html).not.toContain('→');
  });

  it('opens with the date and the reading time in mono, with a clock icon', async () => {
    const meta = (await render()).match(/<span[^>]*data-post-meta[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(meta).toContain('16 out. 2026');
    expect(meta).toContain('4 min de leitura');
    expect(meta).toContain('lucide:clock');
  });

  it('shows at most three markers as chips', async () => {
    const chips = (await render()).match(/<span[^>]*data-marker[^s>]/g) ?? [];
    expect(chips).toHaveLength(3);
  });

  it('sets the title large in the editorial serif, amber on hover', async () => {
    const title = (await render()).match(/<span[^>]*data-title[^>]*>/)?.[0] ?? '';
    expect(title).toContain('font-serif');
    expect(title).toContain('font-normal');
    expect(title).toContain('sm:text-h1');
    expect(title).toContain('group-hover:text-primary');
  });

  it('shows the whole summary, unclamped', async () => {
    const summary = (await render()).match(/<span[^>]*data-summary[^>]*>/)?.[0] ?? '';
    expect(summary).not.toContain('line-clamp');
  });

  it('shows the extras line only when given, the first one in the accent', async () => {
    expect(await render()).not.toContain('data-extras');
    const extras = (await render({ extras: ['5 dias → 30 min', 'Python'] })).match(/<span[^>]*data-extras[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(extras).toMatch(/<span class="text-primary">5 dias → 30 min<\/span>/);
    expect(extras).toContain('•');
    expect(extras).toContain('Python');
  });

  it('puts the draft chip before the date', async () => {
    const html = await render({ draft: true });
    expect(html.indexOf('Rascunho')).toBeLessThan(html.indexOf('16 out. 2026'));
  });
});
```

**Passo 2:** `npx vitest run tests/posts/post-row.test.ts`. Esperado: FAIL, componente inexistente.

**Passo 3: implementação**
```astro
---
import { Icon } from 'astro-icon/components';
import { toShortDate } from '../../lib/format/date';

interface Props {
  href: string;
  title: string;
  summary: string;
  date: string;
  readingMinutes: number;
  markers?: string[];
  extras?: string[];
  draft?: boolean;
}

const { href, title, summary, date, readingMinutes, markers = [], extras, draft = false } = Astro.props;
const chip = 'inline-flex items-center rounded-sm border border-border bg-surface px-sm py-xs font-mono text-micro leading-none text-muted-foreground';
---

{/* Blog listing row (Terminal Noir, REQ-009): the whole row is the link, so
    there is one tab stop and no trailing arrow. */}
<a
  href={href}
  class="group flex flex-col gap-sm border-b border-border py-xl transition-[border-color] duration-(--duration-fast) ease-out hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  <span class="flex flex-wrap items-center justify-between gap-sm">
    <span data-post-meta class="flex flex-wrap items-center gap-sm font-mono text-small text-muted-foreground">
      {draft && (
        <span class="inline-flex items-center rounded-sm bg-muted-foreground px-sm py-xs uppercase leading-none text-primary-foreground">Rascunho</span>
      )}
      <time datetime={date}>{toShortDate(date)}</time>
      <span aria-hidden="true">/</span>
      <span class="inline-flex items-center gap-xs">
        <Icon name="lucide:clock" aria-hidden="true" class="size-4 shrink-0" />
        {readingMinutes} min de leitura
      </span>
    </span>
    {markers.length > 0 && (
      <span class="flex flex-wrap gap-xs">
        {markers.slice(0, 3).map((marker) => <span data-marker class={chip}>{marker}</span>)}
      </span>
    )}
  </span>

  <span data-title class="font-serif text-h2 font-normal tracking-tight text-pretty text-foreground transition-colors group-hover:text-primary sm:text-h1">
    {title}
  </span>

  <span data-summary class="max-w-[68ch] text-body text-muted-foreground">{summary}</span>

  {extras && extras.length > 0 && (
    <span data-extras class="flex flex-wrap items-center gap-sm font-mono text-small text-muted-foreground">
      {extras.map((extra, index) => (
        <>
          {index > 0 && <span aria-hidden="true">•</span>}
          <span class={index === 0 ? 'text-primary' : undefined}>{extra}</span>
        </>
      ))}
    </span>
  )}
</a>
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 9: `/posts` e arquivo por ano com `PostRow`, RSS e total

**Requisito:** REQ-009, REQ-011
**Arquivos:**
- Modificar: `src/pages/posts/index.astro` (lista e cabeçalho)
- Modificar: `src/pages/posts/arquivo/[year].astro` (lista)
- Teste: `tests/posts/listing-row.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Posts from '../../src/pages/posts/index.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Posts);
};

describe('/posts listing', () => {
  it('renders every post with PostRow, reading time included', async () => {
    const html = await render();
    expect(html).toContain('data-post-meta');
    expect(html).toMatch(/\d+ min de leitura/);
  });

  it('links the RSS feed and shows the count of published current posts next to the lead', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/rss\.xml"[^>]*>[\s\S]*?RSS[\s\S]*?<\/a>/);
    expect(html).toMatch(/data-post-count[^>]*>\s*\d+ artigos?\s*</);
  });

  it.each(['src/pages/posts/index.astro', 'src/pages/posts/arquivo/[year].astro'])('%s uses PostRow, not ListRow', (file) => {
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('<PostRow');
    expect(source).not.toContain('<ListRow');
  });
});
```

**Passo 2:** `npx vitest run tests/posts/listing-row.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

Nas duas páginas, trocar o import de `ListRow` por `import PostRow from '../../components/posts/PostRow.astro';` (no arquivo por ano, `../../../components/posts/PostRow.astro`) e cada `<ListRow ... />` por:
```astro
<PostRow
  href={`/${post.slug}`}
  title={post.title}
  summary={post.summary}
  date={post.date}
  readingMinutes={post.readingMinutes}
  markers={post.markers}
  extras={post.extras}
  draft={post.draft}
/>
```
Em `src/pages/posts/index.astro`, logo depois do `PageHeader` e dentro do mesmo contêiner `max-w-list`:
```astro
<p class="-mt-md mb-xl flex flex-wrap items-center gap-sm font-mono text-small">
  <a
    href="/rss.xml"
    class="inline-flex min-h-11 items-center gap-xs rounded-sm border border-border-strong px-sm text-foreground transition-[border-color,color] duration-(--duration-fast) ease-out hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <Icon name="lucide:rss" aria-hidden="true" class="size-4 shrink-0 text-primary" />
    RSS
  </a>
  <span data-post-count class="inline-flex min-h-11 items-center rounded-sm bg-surface px-sm text-muted-foreground">
    {publishedCount} {publishedCount === 1 ? 'artigo' : 'artigos'}
  </span>
</p>
```
com `import { Icon } from 'astro-icon/components';` e, no frontmatter, `const publishedCount = posts.filter((post) => !post.draft).length;`.

**Passo 4:** `npx vitest run tests/posts tests/pages`. Esperado: PASS. Ajustar, sem enfraquecer, testes antigos que procuravam `ListRow` nessas páginas (`archive-year.test.ts`, `listing.test.ts`).

**Passo 5:** `/git commit`

---

## Lote 3: páginas

### Tarefa 10: Setup com seções numeradas

**Requisito:** REQ-002
**Arquivos:**
- Modificar: `src/pages/setup.astro` (bloco `<Prose>` com o `map` das seções)
- Teste: `tests/pages/setup-steps.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Setup from '../../src/pages/setup.astro';
import { SETUP_SECTIONS } from '../../src/lib/setup/setup';

describe('/setup sections', () => {
  it('numbers each section in SETUP_SECTIONS order', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Setup);

    SETUP_SECTIONS.forEach((section, index) => {
      const heading = html.match(new RegExp(`<h2[^>]*id="${section.id}"[^>]*>[\\s\\S]*?</h2>`))?.[0] ?? '';
      expect(heading).toContain(`${String(index + 1).padStart(2, '0')} //`);
      expect(heading).toContain(section.title);
    });
  });
});
```

**Passo 2:** `npx vitest run tests/pages/setup-steps.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Tirar o cabeçalho de dentro do `Prose` e manter só o corpo nele (os seletores `[&_h2]` do `Prose` ganhariam do `SectionHeader`):
```astro
{
  SETUP_SECTIONS.map((section, index) => (
    <section aria-labelledby={section.id}>
      <SectionHeader id={section.id} title={section.title} step={index + 1} />
      <Prose>
        {section.intro && <p>{section.intro}</p>}
        <ul>
          {/* the existing items map, unchanged */}
        </ul>
        {/* the existing "Veja também" paragraph, unchanged */}
      </Prose>
    </section>
  ))
}
```
Importar `SectionHeader` de `../components/ui/SectionHeader.astro`. O conteúdo dos itens (nome, motivo, `kbd`) é copiado sem mudança.

**Passo 4:** `npx vitest run tests/pages tests/setup`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 11: Agora com seções numeradas, Foco em Card e card final

**Requisito:** REQ-003, REQ-014
**Arquivos:**
- Modificar: `src/components/now/NowSection.astro`
- Modificar: `src/pages/now.astro` (seções e fim da página)
- Teste: `tests/now/now-steps.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Now from '../../src/pages/now.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Now);
};

describe('/now sections', () => {
  it('numbers the sections in page order', async () => {
    const html = await render();
    const ids = ['foco', 'projetos', 'escrevendo', 'estudando', 'ouvindo', 'jogando'];
    ids.forEach((id, index) => {
      const heading = html.match(new RegExp(`<h2[^>]*id="${id}"[^>]*>[\\s\\S]*?</h2>`))?.[0] ?? '';
      expect(heading).toContain(`${String(index + 1).padStart(2, '0')} //`);
    });
  });

  it('puts the focus block inside a card', async () => {
    const html = await render();
    const focus = html.slice(html.indexOf('id="foco"'), html.indexOf('id="projetos"'));
    expect(focus).toMatch(/rounded-md border border-border bg-surface/);
  });

  it('closes with what a now page is, linking nownownow.com', async () => {
    const html = await render();
    expect(html).toContain('O que é uma página Agora?');
    expect(html).toContain('A ideia é do Derek Sivers');
    expect(html).toMatch(/<a[^>]*href="https:\/\/nownownow\.com"[^>]*rel="[^"]*noopener/);
  });
});
```

**Passo 2:** `npx vitest run tests/now/now-steps.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`NowSection.astro`:
```astro
---
import SectionHeader from '../ui/SectionHeader.astro';
import Prose from '../ui/Prose.astro';

interface Props {
  id: string;
  title: string;
  step: number;
  /** Wraps the body in Prose; off for the media sections that bring their own layout. */
  prose?: boolean;
}

const { id, title, step, prose = true } = Astro.props;
---

<section aria-labelledby={id} class="flex flex-col">
  <SectionHeader id={id} title={title} step={step} />
  {prose ? <Prose><slot /></Prose> : <slot />}
</section>
```
`now.astro`: remover o `<Prose>` que envolvia as quatro primeiras seções; passar `step={1}` a `step={6}` na ordem (`foco`, `projetos`, `escrevendo`, `estudando`, `ouvindo`, `jogando`), com `prose={false}` em `ouvindo` e `jogando`. Envolver o corpo de "Foco" num `Card` (`import Card from '../components/ui/Card.astro'`). No fim do `article`:
```astro
<Card as="aside" class="flex flex-col gap-sm">
  <h2 class="font-mono text-small uppercase tracking-eyebrow text-foreground">O que é uma página Agora?</h2>
  <p class="text-body text-muted-foreground">
    Uma página Agora diz no que a pessoa está focada neste momento, e não tudo o que já fez. A ideia é do Derek
    Sivers, e o <a href="https://nownownow.com" target="_blank" rel="nofollow noopener noreferrer" class="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">nownownow.com</a> reúne as que existem.
  </p>
</Card>
```

**Passo 4:** `npx vitest run tests/now tests/aeo/no-leak.test.ts`. Esperado: PASS. O `now.md` (visão IA) não muda: confira `now-markdown.test.ts`.

**Passo 5:** `/git commit`

### Tarefa 12: Sobre (título, linha do tempo, resultados em Card)

**Requisito:** REQ-004
**Arquivos:**
- Modificar: `src/pages/sobre.astro:46` (h1) e a lista de resultados
- Modificar: `src/components/about/Experience.astro`
- Teste: `tests/about/timeline.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Experience from '../../src/components/about/Experience.astro';
import Sobre from '../../src/pages/sobre.astro';

const work = [
  { name: 'Atual', position: 'AI Engineer', startDate: '2025-11', summary: 's' },
  { name: 'Antiga', position: 'Dev', startDate: '2020-01', endDate: '2024-06' },
];

describe('/sobre', () => {
  it('sets the h1 in the editorial serif at its regular weight', async () => {
    const container = await AstroContainer.create();
    const h1 = (await container.renderToString(Sobre)).match(/<h1[^>]*>/)?.[0] ?? '';
    expect(h1).toContain('font-serif');
    expect(h1).toContain('font-normal');
    expect(h1).not.toContain('font-semibold');
  });

  it('lays the results out in Cards', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Sobre);
    const results = html.slice(html.indexOf('id="resultados"'), html.indexOf('id="frentes"'));
    expect(results.match(/<li class="rounded-md border border-border bg-surface p-lg/g)?.length).toBeGreaterThan(0);
  });
});

describe('Experience timeline', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Experience, { props: { work } });
  };

  it('draws a vertical rule with one marker per role', async () => {
    const html = await render();
    expect(html).toMatch(/<ol[^>]*class="[^"]*\bborder-l\b[^"]*\bborder-border\b/);
    expect(html.match(/data-timeline-marker/g)).toHaveLength(2);
  });

  it('marks the current role in the accent, the past ones muted', async () => {
    const markers = (await render()).match(/<span[^>]*data-timeline-marker[^>]*>/g) ?? [];
    expect(markers[0]).toContain('bg-primary');
    expect(markers[1]).toContain('bg-border-strong');
  });

  it('shows the period in a mono chip', async () => {
    expect(await render()).toMatch(/<span[^>]*data-period[^>]*class="[^"]*\bfont-mono\b[^"]*\brounded-sm\b/);
  });
});
```

**Passo 2:** `npx vitest run tests/about/timeline.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
- `sobre.astro:46`: `class="mt-sm font-serif text-h1 font-normal tracking-tight text-balance text-foreground sm:text-display lg:w-4/5"`.
- Resultados: trocar o `<li class="rounded-md border border-border bg-surface p-lg">` por `<Card as="li">` (importar `Card`).
- `Experience.astro`:
```astro
<section id="experiencia" class="mt-2xl" aria-labelledby="experiencia-heading">
  <SectionHeader id="experiencia-heading" title="Experiência" level={2} count={work.length} />
  <ol class="ml-xs flex flex-col gap-xl border-l border-border pl-lg">
    {
      work.map((job) => (
        <li class="relative flex flex-col gap-sm">
          {/* Marker on the rule; the current role (no end date) in the accent. */}
          <span
            data-timeline-marker
            aria-hidden="true"
            class={`absolute top-sm -left-lg size-2 -translate-x-1/2 rounded-full ${job.endDate ? 'bg-border-strong' : 'bg-primary'}`}
          ></span>
          <p class="flex flex-wrap items-center gap-sm">
            <span data-period class="inline-flex items-center rounded-sm border border-border bg-surface px-sm py-xs font-mono text-small leading-none text-muted-foreground">
              {formatPeriod(job.startDate, job.endDate)}
            </span>
            <span class="text-h3 font-semibold text-foreground">{job.position}</span>
          </p>
          <p class="text-body text-muted-foreground">{job.name}</p>
          {job.summary && <p class="max-w-[68ch] text-body text-foreground">{job.summary}</p>}
          {job.highlights && job.highlights.length > 0 && (
            <ul class="flex max-w-[68ch] list-disc flex-col gap-xs pl-lg text-body text-muted-foreground">
              {job.highlights.map((highlight) => <li>{highlight}</li>)}
            </ul>
          )}
        </li>
      ))
    }
  </ol>
</section>
```
Cuidado: o cargo deixa de ser `h3` aqui se o teste atual da `/sobre` exigir `h3` por cargo; nesse caso mantenha `<h3 class="text-h3 font-semibold text-foreground">` dentro do `p`, trocando o `p` por `div`.

**Passo 4:** `npx vitest run tests/about tests/pages/sobre.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 13: Contato em duas colunas, AgentBrief `panel` e card do MCP

**Requisito:** REQ-005, REQ-015
**Arquivos:**
- Modificar: `src/components/contact/AgentBrief.astro` (prop `variant`)
- Modificar: `src/pages/contato.astro` (layout, card do formulário, caixa de disponibilidade, coluna direita)
- Teste: `tests/contact/contact-layout.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, security-reviewer

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AgentBrief from '../../src/components/contact/AgentBrief.astro';
import Contato from '../../src/pages/contato.astro';

describe('AgentBrief panel variant', () => {
  it('renders only the terminal window, without the pitch column', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AgentBrief, { props: { brief: '# AGENTS.md', variant: 'panel' } });
    expect(html).not.toContain('agents-heading');
    expect(html).toContain('data-terminal-bar');
    expect(html).toContain('id="agent-brief"');
  });
});

describe('/contato layout', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Contato);
  };

  it('splits form and machine contact into two columns from lg, form first', async () => {
    const html = await render();
    expect(html).toMatch(/class="[^"]*\bgrid\b[^"]*\blg:grid-cols-5\b/);
    expect(html.indexOf('<form')).toBeLessThan(html.indexOf('id="agent-brief"'));
  });

  it('offers the MCP URL with a Copy button wired to it', async () => {
    const html = await render();
    expect(html).toMatch(/<code[^>]*id="mcp-url"[^>]*>https:\/\/nandomoreira\.dev\/api\/mcp<\/code>/);
    expect(html).toMatch(/<button[^>]*data-copy="mcp-url"/);
  });

  it('shows the availability with its dot and detail inside the form card', async () => {
    const html = await render();
    const box = html.match(/<div[^>]*data-contact-availability[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(box).toContain('data-status-dot');
    expect(box).toMatch(/Disponível para novos projetos|Disponibilidade limitada|Indisponível no momento/);
  });
});
```

**Passo 2:** `npx vitest run tests/contact/contact-layout.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`AgentBrief.astro`: prop `variant?: 'section' | 'panel'` (padrão `section`). Com `panel`, renderiza só o `TerminalWindow` (com o `CopyButton` e o `<pre>` realçado), sem `<section>` nem a coluna do pitch.

`contato.astro`: depois do `PageHeader`, um contêiner `grid grid-cols-1 gap-xl lg:grid-cols-5`:
- à esquerda (`lg:col-span-3`): o `<section>` do formulário vira `<Card as="section" class="flex flex-col gap-lg">` com os mesmos atributos `aria-*`; dentro, depois do cabeçalho "Iniciar uma conversa" e antes do `outcome`:
```astro
<div data-contact-availability class="flex items-start gap-sm rounded-md border border-border bg-background p-md">
  <span class="pt-sm"><StatusDot status={profile.availability.status} /></span>
  <span class="flex flex-col">
    <span class="text-body text-foreground">{AVAILABILITY_LABEL[profile.availability.status]}</span>
    <span class="text-small text-muted-foreground">{profile.availability.detail}</span>
  </span>
</div>
```
- à direita (`lg:col-span-2 flex flex-col gap-lg`): `<AgentBrief brief={hireBrief} variant="panel" />` e o card do MCP:
```astro
<Card class="flex flex-col gap-sm">
  <h2 class="font-mono text-small uppercase tracking-eyebrow text-foreground">MCP</h2>
  <p class="text-small text-muted-foreground">Conecte seu cliente MCP ao servidor deste site.</p>
  <div class="flex items-center justify-between gap-sm rounded-md border border-border bg-background px-md py-sm">
    <code id="mcp-url" class="min-w-0 truncate font-mono text-small text-foreground">{mcpUrl}</code>
    <CopyButton target="mcp-url" label="Copiar a URL do servidor MCP" iconOnly />
  </div>
  <a href="/mcp" class="font-mono text-small text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Como conectar</a>
</Card>
```
com `const mcpUrl = absoluteUrl(requireSite(Astro.site ?? new URL('https://nandomoreira.dev')), '/api/mcp');` (importar `absoluteUrl` de `../lib/aeo/urls`) e imports de `Card`, `CopyButton`, `StatusDot` e `AVAILABILITY_LABEL`. Remover o `<AgentBrief brief={hireBrief} />` antigo do fim da página. O formulário, os nomes dos campos e o `action="/api/hire"` não mudam. O texto do card do MCP ("Conecte seu cliente MCP ao servidor deste site." e "Como conectar") é cópia nova da UI, curta e factual: o autor revisa no PR.

**Passo 4:** `npx vitest run tests/contact tests/pages/contato.test.ts tests/aeo/no-leak.test.ts`. Esperado: PASS. A rota de máquina não muda; o e-mail não aparece na coluna nova.

**Passo 5:** `/git commit`

### Tarefa 14: título de post e de case em Newsreader 400

**Requisito:** REQ-006
**Arquivos:**
- Modificar: `src/pages/[slug].astro:93`
- Modificar: `src/components/catalog/CaseArticle.astro:36`
- Teste: `tests/posts/title-weight.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('post and case titles', () => {
  it.each(['src/pages/[slug].astro', 'src/components/catalog/CaseArticle.astro'])('%s sets the h1 in Newsreader 400', (file) => {
    const h1 = readFileSync(file, 'utf8').match(/<h1 class="([^"]*)"/)?.[1] ?? '';
    expect(h1).toContain('font-serif');
    expect(h1).toContain('font-normal');
    expect(h1).toContain('tracking-tight');
    expect(h1).not.toContain('font-semibold');
  });
});
```

**Passo 2:** `npx vitest run tests/posts/title-weight.test.ts`. Esperado: FAIL.

**Passo 3: implementação:** nas duas linhas, `font-semibold` vira `font-normal tracking-tight`.

**Passo 4:** `npx vitest run tests/posts tests/catalog`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 15: "No ar" nos cases com `liveUrl`

**Requisito:** REQ-012
**Arquivos:**
- Modificar: `src/components/catalog/ArtRow.astro` (prop `live`)
- Modificar: `src/components/catalog/CollectionListing.astro:45` (passar `live`)
- Teste: `tests/catalog/art-row-live.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArtRow from '../../src/components/catalog/ArtRow.astro';
import { generateArt } from '../../src/lib/art';

const base = {
  href: '/portfolio/bragstack',
  title: 'BragStack',
  stamp: '02/2026',
  summary: 's',
  art: generateArt({ slug: 'bragstack', block: 'saas', art: 'bars', aspect: 'card' }),
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ArtRow, { props: { ...base, ...props } });
};

describe('ArtRow live status', () => {
  it('shows "No ar · host" with the open status dot as text, keeping one link', async () => {
    const html = await render({ live: 'bragstack.app' });
    const status = html.match(/<span[^>]*data-live[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(status).toContain('data-status-dot');
    expect(status).toContain('text-success');
    expect(status).toContain('No ar · bragstack.app');
    expect(html.match(/<a\b/g)).toHaveLength(1);
  });

  it('shows nothing without a live host', async () => {
    expect(await render()).not.toContain('data-live');
  });
});
```
Se `block: 'saas'` ou `art: 'bars'` não existirem, copie os valores válidos de `tests/catalog/art-row.test.ts`.

**Passo 2:** `npx vitest run tests/catalog/art-row-live.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
- `ArtRow.astro`: prop `live?: string`; logo abaixo da linha de título e data:
```astro
{live && (
  <span data-live class={`inline-flex items-center gap-sm font-mono text-small text-success ${mirror.heading}`}>
    <StatusDot status="open" />
    <span>No ar · {live}</span>
  </span>
)}
```
importando `StatusDot` de `../ui/StatusDot.astro`.
- `CollectionListing.astro`: `live={liveHost(project.liveUrl)}`, importando `liveHost` de `../../lib/catalog/live-host`.

**Passo 4:** `npx vitest run tests/catalog`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 16: CTA final em Portfólio e Lab

**Requisito:** REQ-007
**Arquivos:**
- Criar: `src/lib/catalog/closing-cta.ts`
- Criar: `src/components/catalog/ClosingCta.astro`
- Modificar: `src/pages/portfolio/index.astro`, `src/pages/lab/index.astro` (fim da página)
- Teste: `tests/catalog/closing-cta.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ClosingCta from '../../src/components/catalog/ClosingCta.astro';
import { CLOSING_CTA } from '../../src/lib/catalog/closing-cta';
import Lab from '../../src/pages/lab/index.astro';
import Portfolio from '../../src/pages/portfolio/index.astro';

describe('closing CTA', () => {
  it('carries the approved copy per collection', () => {
    expect(CLOSING_CTA.portfolio.title).toBe('Precisa de algo assim no seu produto?');
    expect(CLOSING_CTA.lab.title).toBe('Tem um problema parecido no seu fluxo?');
    expect(CLOSING_CTA.portfolio.button).toBe('Vamos conversar');
  });

  it('is a card with an eyebrow, a serif title and one primary button to /contato with an arrow', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, { props: { collection: 'portfolio' } });
    expect(html).toContain('Próximo passo');
    expect(html).toMatch(/<h2[^>]*class="[^"]*\bfont-serif\b[^"]*\bfont-normal\b/);
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?lucide:arrow-right/);
  });

  it.each([
    ['portfolio', Portfolio, 'Precisa de algo assim no seu produto?'],
    ['lab', Lab, 'Tem um problema parecido no seu fluxo?'],
  ])('closes /%s', async (_name, Page, title) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page);
    expect(html).toContain(title);
  });
});
```

**Passo 2:** `npx vitest run tests/catalog/closing-cta.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`src/lib/catalog/closing-cta.ts`:
```ts
import type { CatalogCollection } from './groups';

/** Closing call to action on the listing pages (REQ-007); copy approved in the spec. */
export const CLOSING_CTA: Record<CatalogCollection, { eyebrow: string; title: string; text: string; button: string }> = {
  portfolio: {
    eyebrow: 'Próximo passo',
    title: 'Precisa de algo assim no seu produto?',
    text: 'Conte o problema e o prazo. Respondo com o que dá para fazer e o que não dá.',
    button: 'Vamos conversar',
  },
  lab: {
    eyebrow: 'Próximo passo',
    title: 'Tem um problema parecido no seu fluxo?',
    text: 'Boa parte destas ferramentas nasceu de uma dor minha. Se a sua é parecida, me conta.',
    button: 'Vamos conversar',
  },
};
```
`ClosingCta.astro`:
```astro
---
import Button from '../ui/Button.astro';
import Card from '../ui/Card.astro';
import type { CatalogCollection } from '../../lib/catalog/groups';
import { CLOSING_CTA } from '../../lib/catalog/closing-cta';

interface Props {
  collection: CatalogCollection;
}

const copy = CLOSING_CTA[Astro.props.collection];
---

<Card as="section" class="my-3xl flex flex-col gap-lg p-xl lg:flex-row lg:items-center lg:justify-between">
  <div class="flex flex-col gap-sm">
    <p class="font-mono text-small uppercase tracking-eyebrow text-primary">{copy.eyebrow}</p>
    <h2 class="font-serif text-h1 font-normal tracking-tight text-balance text-foreground">{copy.title}</h2>
    <p class="max-w-[60ch] text-body text-muted-foreground">{copy.text}</p>
  </div>
  <Button href="/contato" variant="primary" arrow>{copy.button}</Button>
</Card>
```
Nas duas páginas, `<ClosingCta collection="portfolio" />` e `<ClosingCta collection="lab" />` no fim do conteúdo.

**Passo 4:** `npx vitest run tests/catalog tests/pages`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 17: fios entre as seções da home

**Requisito:** REQ-016
**Arquivos:**
- Modificar: `src/pages/index.astro` (entre as seções, depois do `Hero`)
- Teste: `tests/home/section-rules.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home section rules', () => {
  it('separates each section after the hero with a full-bleed SectionRule', () => {
    const source = readFileSync('src/pages/index.astro', 'utf8');
    const body = source.slice(source.indexOf('<Hero'));
    const sections = ['<LatestPosts', '<CollectionSection\n    collection="portfolio"', '<CollectionSection collection="lab"', '<Trajectory', '<Services', '<AgentBrief'];
    expect(body.match(/<SectionRule \/>/g)).toHaveLength(sections.length);
    for (const section of sections) {
      const before = body.slice(0, body.indexOf(section)).trimEnd();
      expect(before.endsWith('<SectionRule />')).toBe(true);
    }
  });
});
```

**Passo 2:** `npx vitest run tests/home/section-rules.test.ts`. Esperado: FAIL.

**Passo 3: implementação:** importar `SectionRule` de `../components/ui/SectionRule.astro` e pôr `<SectionRule />` imediatamente antes de cada uma das seis seções que vêm depois do `Hero`.

**Passo 4:** `npx vitest run tests/home`. Esperado: PASS, inclusive `single-primary-cta.test.ts`.

**Passo 5:** `/git commit`

---

## Lote 4: fechamento

### Tarefa 18: documentação, portão completo e conferência visual

**Requisito:** todos
**Arquivos:**
- Modificar: `docs/DESIGN-GUIDELINES.md` (tabela de componentes: `SectionHeader` com `step`, `PostRow`, `UpdatedAt`, `SectionRule`, `ClosingCta`; seção Terminal Noir: páginas internas)
- Modificar: `docs/specs/terminal-noir-redesign/STATE.md` (fase 7 feita)
- Modificar: `docs/specs/terminal-noir-pages/STATE.md` (`phase: implemented`)

**Team:**
- Track: docs
- Implementer: rpi-implementer (direto)
- Reviewers: self-review

**Passo 1:** `npm run verify`. Esperado: `check` com 0 erros, suíte unitária e `test:build` verdes.
**Passo 2:** com o dev server no ar, capturar `/setup`, `/now`, `/sobre`, `/contato`, `/posts`, `/portfolio`, `/lab`, um post e um case em 1280 e 390px e comparar com as telas do Stitch.
**Passo 3:** atualizar os três documentos.
**Passo 4:** `npx vitest run tests/design-system`. Esperado: PASS.
**Passo 5:** `/git commit`
