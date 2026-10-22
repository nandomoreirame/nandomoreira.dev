# Plan: Revisor de texto dos posts

> **Spec:** docs/specs/post-review/SPEC.md

**Goal:** Grifar trechos de um post no `astro dev`, anotar o pedido ou o texto novo e gravar `docs/post-reviews/<slug>.md` para o Claude aplicar.
**Architecture:** Toda a lógica é de funções puras em `src/lib/post-review/` (schema, ancoragem, localização da linha, renderização, arquivos, gravação, DOM e painel). Uma integração em `src/integrations/post-review.ts` registra o app da Dev Toolbar só no comando `dev` e liga o evento `post-review:save` à gravação em disco. O app (`src/integrations/post-review-app.ts`) é casca sobre `mountPanel`.
**Tech Stack:** Astro 7.2 (Dev Toolbar API, hooks de integração), Zod 4, Vitest (node e happy-dom), CSS Custom Highlight API.
**Total Tasks:** 12
**Estimated Complexity:** large

---

## Decisões tomadas no plano

| Ponto | Decisão |
|---|---|
| Ordem e marcação | Cada anotação guarda também `start` e `end` (offsets no texto do artigo). O REQ-004 não os listava, mas sem eles não dá para ordenar "na ordem do texto" (REQ-005) nem remarcar depois de recarregar |
| Citação de vários parágrafos | `locateLine` procura o primeiro parágrafo da citação: no fonte, parágrafos ficam em linhas diferentes |
| Controles do painel | Elementos nativos (`button`, `textarea`, `label`) dentro de `astro-dev-toolbar-window`. A spec citava os botões da toolbar, mas os nativos têm rótulo e foco de graça (REQ-010) e são testáveis no happy-dom |
| `generatedAt` | `Date.toISOString()` (offset `Z`) |
| Portão de vazamento | `reviewerLeaks(dir)` testado com diretório temporário (fica vermelho de verdade) e usado pelo teste de build |

## Ordem e dependências

```
T1 schema ─┬─ T2 anchor ─┬─ T8 dom ── T9 panel ── T10 app + integração
           ├─ T3 locate ─┤
           ├─ T4 render ─┼─ T6 save ── T7 integração (servidor)
           └─ T5 files ──┘
T11 data-post-slug (independente)
T12 portão de vazamento + docs (depois de T10)
```

Comandos de teste: `npx vitest run <arquivo>`. Portão completo no fim: `npm run verify`.

---

### Task 1: Schema do payload e constantes

**Requirement:** REQ-004, REQ-006
**Files:**
- Create: `src/lib/post-review/schema.ts`
- Test: `tests/post-review/schema.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_CHARS,
  LIMITS,
  REVIEW_APP_ID,
  REVIEW_EVENTS,
  SLUG_PATTERN,
  annotationSchema,
  reviewPayloadSchema,
  storageKey,
} from '../../src/lib/post-review/schema';

const annotation = {
  quote: 'um trecho',
  prefix: 'antes ',
  suffix: ' depois',
  section: 'Contexto',
  request: 'deixa mais curto',
  replacement: '',
  start: 10,
  end: 19,
};

describe('post-review schema', () => {
  it('names the app, the events and the storage key', () => {
    expect(REVIEW_APP_ID).toBe('post-review');
    expect(REVIEW_EVENTS).toEqual({
      save: 'post-review:save',
      saved: 'post-review:saved',
      failed: 'post-review:failed',
    });
    expect(storageKey('meu-post')).toBe('post-review:meu-post');
    expect(CONTEXT_CHARS).toBe(32);
    expect(LIMITS).toEqual({ quote: 2000, request: 2000, replacement: 4000, annotations: 100 });
  });

  it('accepts every existing post file name as a slug', () => {
    const slugs = readdirSync('src/content/posts').map(name => name.replace(/\.md$/, ''));
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) expect(SLUG_PATTERN.test(slug), slug).toBe(true);
  });

  it('refuses a slug that could become a path', () => {
    for (const slug of ['../etc/passwd', 'a/b', 'A', '', 'x.md']) {
      expect(reviewPayloadSchema.safeParse({ slug, annotations: [annotation] }).success, slug).toBe(false);
    }
  });

  it('accepts a request alone or a replacement alone', () => {
    expect(annotationSchema.safeParse(annotation).success).toBe(true);
    expect(annotationSchema.safeParse({ ...annotation, request: '', replacement: 'novo' }).success).toBe(true);
  });

  it('refuses an annotation with neither request nor replacement', () => {
    const result = annotationSchema.safeParse({ ...annotation, request: '  ', replacement: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Escreva o pedido ou o texto novo');
  });

  it('enforces the limits and a non-empty range', () => {
    expect(annotationSchema.safeParse({ ...annotation, quote: '' }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, quote: 'x'.repeat(2001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, request: 'x'.repeat(2001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, replacement: 'x'.repeat(4001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, prefix: 'x'.repeat(33) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, end: 10 }).success).toBe(false);
    const many = Array.from({ length: 101 }, () => annotation);
    expect(reviewPayloadSchema.safeParse({ slug: 'meu-post', annotations: many }).success).toBe(false);
    expect(reviewPayloadSchema.safeParse({ slug: 'meu-post', annotations: [] }).success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/schema.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/schema""

**Step 3: Write minimal implementation**
```ts
import { z } from 'zod';

/** Dev toolbar app id. Also what the build gate looks for in dist/. */
export const REVIEW_APP_ID = 'post-review';

export const REVIEW_EVENTS = {
  save: 'post-review:save',
  saved: 'post-review:saved',
  failed: 'post-review:failed',
} as const;

/** Characters of context kept on each side of a quote (W3C TextQuoteSelector). */
export const CONTEXT_CHARS = 32;

export const LIMITS = { quote: 2000, request: 2000, replacement: 4000, annotations: 100 } as const;

/** Same pattern as the posts schema: the slug becomes a file name, never a path. */
export const SLUG_PATTERN = /^[a-z0-9]+([_-][a-z0-9]+)*$/;

export const annotationSchema = z
  .object({
    quote: z.string().min(1).max(LIMITS.quote),
    prefix: z.string().max(CONTEXT_CHARS),
    suffix: z.string().max(CONTEXT_CHARS),
    section: z.string().nullable(),
    request: z.string().max(LIMITS.request),
    replacement: z.string().max(LIMITS.replacement),
    /** Offsets in the article text: order in the panel and the highlight after a reload. */
    start: z.number().int().min(0),
    end: z.number().int().min(1),
  })
  .refine(a => a.end > a.start, { message: 'Trecho vazio' })
  .refine(a => a.request.trim() !== '' || a.replacement.trim() !== '', {
    message: 'Escreva o pedido ou o texto novo',
  });

export const reviewPayloadSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  annotations: z.array(annotationSchema).min(1).max(LIMITS.annotations),
});

export type Annotation = z.infer<typeof annotationSchema>;
export type ReviewPayload = z.infer<typeof reviewPayloadSchema>;

export const storageKey = (slug: string): string => `${REVIEW_APP_ID}:${slug}`;
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/schema.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 2: Ancoragem da citação e seção

**Requirement:** REQ-004
**Depends on:** Task 1
**Files:**
- Create: `src/lib/post-review/anchor.ts`
- Test: `tests/post-review/anchor.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { anchorFrom, sectionFor } from '../../src/lib/post-review/anchor';

const text = 'a'.repeat(40) + 'TRECHO' + 'b'.repeat(40);

describe('anchorFrom', () => {
  it('keeps the quote and 32 characters of context on each side', () => {
    const anchor = anchorFrom(text, 40, 46);
    expect(anchor).toEqual({ quote: 'TRECHO', prefix: 'a'.repeat(32), suffix: 'b'.repeat(32), start: 40, end: 46 });
  });

  it('cuts the context at the edges of the text', () => {
    expect(anchorFrom('abc TRECHO def', 4, 10)).toEqual({
      quote: 'TRECHO',
      prefix: 'abc ',
      suffix: ' def',
      start: 4,
      end: 10,
    });
  });

  it('trims whitespace the selection caught at either end', () => {
    expect(anchorFrom('abc  TRECHO\n def', 3, 13)).toEqual({
      quote: 'TRECHO',
      prefix: 'abc  ',
      suffix: '\n def',
      start: 5,
      end: 11,
    });
  });

  it('returns an empty quote for a whitespace-only selection', () => {
    expect(anchorFrom('a   b', 1, 4).quote).toBe('');
  });
});

describe('sectionFor', () => {
  const headings = [
    { offset: 100, text: 'Contexto' },
    { offset: 300, text: 'Solução' },
  ];

  it('is null before the first heading', () => {
    expect(sectionFor(headings, 50)).toBeNull();
  });

  it('is the last heading at or before the start', () => {
    expect(sectionFor(headings, 100)).toBe('Contexto');
    expect(sectionFor(headings, 299)).toBe('Contexto');
    expect(sectionFor(headings, 900)).toBe('Solução');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/anchor.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/anchor""

**Step 3: Write minimal implementation**
```ts
import { CONTEXT_CHARS } from './schema';

export type Anchor = { quote: string; prefix: string; suffix: string; start: number; end: number };

export type HeadingMark = { offset: number; text: string };

const isSpace = (char: string | undefined): boolean => char !== undefined && /\s/.test(char);

/** The quote at [start, end) of the article text, trimmed, with its context. */
export const anchorFrom = (text: string, start: number, end: number): Anchor => {
  let from = start;
  let to = end;
  while (from < to && isSpace(text[from])) from += 1;
  while (to > from && isSpace(text[to - 1])) to -= 1;
  return {
    quote: text.slice(from, to),
    prefix: text.slice(Math.max(0, from - CONTEXT_CHARS), from),
    suffix: text.slice(to, to + CONTEXT_CHARS),
    start: from,
    end: to,
  };
};

/** The last h2/h3 that starts at or before `start`; null in the opening. */
export const sectionFor = (headings: readonly HeadingMark[], start: number): string | null =>
  headings.filter(heading => heading.offset <= start).at(-1)?.text ?? null;
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/anchor.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 3: Linha provável no fonte

**Requirement:** REQ-008
**Files:**
- Create: `src/lib/post-review/locate.ts`
- Test: `tests/post-review/locate.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { locateLine, plainText } from '../../src/lib/post-review/locate';

const source = [
  '---',
  'title: "Meu post sobre o Niri"',
  '---',
  '',
  'Um parágrafo com **negrito**, `código` e [um link](https://x.dev).',
  '',
  '## Contexto',
  '',
  'Outro   parágrafo',
  'quebrado em duas linhas.',
].join('\n');

describe('plainText', () => {
  it('drops inline marks, keeps link text and collapses spaces', () => {
    expect(plainText('Um **negrito**, `código` e [um link](https://x.dev).')).toBe('Um negrito, código e um link.');
    expect(plainText('a   b\tc')).toBe('a b c');
  });
});

describe('locateLine', () => {
  it('finds a quote whose source carries inline marks', () => {
    expect(locateLine(source, 'negrito, código e um link')).toBe(5);
  });

  it('finds the frontmatter title and a heading', () => {
    expect(locateLine(source, 'Meu post sobre o Niri')).toBe(2);
    expect(locateLine(source, 'Contexto')).toBe(7);
  });

  it('normalises spaces in the source line', () => {
    expect(locateLine(source, 'Outro parágrafo')).toBe(9);
  });

  it('uses the first paragraph of a quote that spans paragraphs', () => {
    expect(locateLine(source, 'Contexto\n\nOutro parágrafo')).toBe(7);
  });

  it('is null when nothing matches', () => {
    expect(locateLine(source, 'frase que não existe')).toBeNull();
    expect(locateLine(source, '   ')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/locate.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/locate""

**Step 3: Write minimal implementation**
```ts
/** A Markdown line as it reads rendered: link text kept, inline marks gone, spaces collapsed. */
export const plainText = (markdown: string): string =>
  markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 1-based line of the first source line that contains the quote, or null.
 * A quote spanning paragraphs is looked up by its first one, since the source
 * keeps each paragraph on its own lines.
 */
export const locateLine = (source: string, quote: string): number | null => {
  const firstParagraph = quote.split(/\n\s*\n/).find(part => part.trim() !== '') ?? '';
  const needle = plainText(firstParagraph);
  if (needle === '') return null;
  const index = source.split('\n').findIndex(line => plainText(line).includes(needle));
  return index === -1 ? null : index + 1;
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/locate.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 4: Renderização do arquivo de revisão

**Requirement:** REQ-007 (formato da saída)
**Depends on:** Task 1
**Files:**
- Create: `src/lib/post-review/render.ts`
- Test: `tests/post-review/render.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { renderReview } from '../../src/lib/post-review/render';

const base = { prefix: 'antes\ndo ', suffix: ' e depois', start: 0, end: 1 };

const markdown = renderReview({
  title: 'Meu post',
  slug: 'meu-post',
  generatedAt: '2026-10-21T15:00:00.000Z',
  annotations: [
    { ...base, quote: 'primeiro trecho', section: null, request: 'mais curto', replacement: '', line: 12 },
    { ...base, quote: 'linha 1\nlinha 2', section: 'Contexto', request: '', replacement: 'novo texto', line: null },
  ],
});

describe('renderReview', () => {
  it('opens with the title, the post path, the time, the count and the instructions', () => {
    expect(markdown.startsWith('# Revisão: Meu post\n\n- Post: src/content/posts/meu-post.md\n')).toBe(true);
    expect(markdown).toContain('- Gerada em: 2026-10-21T15:00:00.000Z');
    expect(markdown).toContain('- Anotações: 2');
    expect(markdown).toContain('Não mude nada fora dos trechos anotados.');
  });

  it('heads each annotation with its number, section and line', () => {
    expect(markdown).toContain('## 1. Abertura, linha 12');
    expect(markdown).toContain('## 2. Contexto, linha não localizada');
  });

  it('quotes every line of the quote and of the replacement', () => {
    expect(markdown).toContain('> linha 1\n> linha 2');
    expect(markdown).toContain('**Texto novo:**\n\n> novo texto');
  });

  it('collapses the context to one line and marks empty fields', () => {
    expect(markdown).toContain('Contexto: «…antes do» [citação] «e depois…»');
    expect(markdown).toContain('**Pedido:** mais curto');
    expect(markdown).toContain('**Pedido:** (nenhum)');
    expect(markdown).toContain('**Texto novo:**\n\n> (nenhum)');
  });

  it('ends with exactly one newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/render.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/render""

**Step 3: Write minimal implementation**
```ts
import type { Annotation } from './schema';

export type LocatedAnnotation = Annotation & { line: number | null };

export type ReviewDocument = {
  title: string;
  slug: string;
  generatedAt: string;
  annotations: readonly LocatedAnnotation[];
};

const INSTRUCTIONS = [
  'Aplique cada anotação no arquivo do post. A citação é o texto renderizado; no',
  'fonte ela pode ter marcação Markdown. Use o contexto antes/depois para achar o',
  'trecho certo quando ele se repetir. Não mude nada fora dos trechos anotados.',
];

const quoted = (text: string): string =>
  text
    .split('\n')
    .map(line => `> ${line}`.trimEnd())
    .join('\n');

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

const block = (annotation: LocatedAnnotation, index: number): string =>
  [
    `## ${index + 1}. ${annotation.section ?? 'Abertura'}, ${
      annotation.line === null ? 'linha não localizada' : `linha ${annotation.line}`
    }`,
    '',
    quoted(annotation.quote),
    '',
    `Contexto: «…${oneLine(annotation.prefix)}» [citação] «${oneLine(annotation.suffix)}…»`,
    '',
    `**Pedido:** ${annotation.request.trim() || '(nenhum)'}`,
    '',
    '**Texto novo:**',
    '',
    quoted(annotation.replacement.trim() || '(nenhum)'),
  ].join('\n');

/** The review file Claude reads to edit the post (spec post-review, "Formato da saída"). */
export const renderReview = (review: ReviewDocument): string => {
  const head = [
    `# Revisão: ${review.title}`,
    '',
    `- Post: src/content/posts/${review.slug}.md`,
    `- Gerada em: ${review.generatedAt}`,
    `- Anotações: ${review.annotations.length}`,
    '',
    ...INSTRUCTIONS,
  ].join('\n');
  return `${[head, ...review.annotations.map(block)].join('\n\n')}\n`;
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/render.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 5: Arquivos do post e da revisão

**Requirement:** REQ-006, REQ-007
**Depends on:** Task 1
**Files:**
- Create: `src/lib/post-review/files.ts`
- Test: `tests/post-review/files.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: security-reviewer, business-logic-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { POSTS_DIR, REVIEW_DIR, postFileFor, reviewFileFor, titleOf } from '../../src/lib/post-review/files';

let root = '';

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'post-review-'));
  mkdirSync(join(root, POSTS_DIR), { recursive: true });
  writeFileSync(join(root, POSTS_DIR, 'meu-post.md'), '---\ntitle: x\n---\n');
});

describe('post-review files', () => {
  it('resolves an existing post to its relative path', () => {
    expect(postFileFor(root, 'meu-post')).toBe('src/content/posts/meu-post.md');
  });

  it('is null for a missing post or a malformed slug', () => {
    expect(postFileFor(root, 'outro-post')).toBeNull();
    expect(postFileFor(root, '../meu-post')).toBeNull();
  });

  it('puts the review under docs/post-reviews', () => {
    expect(REVIEW_DIR).toBe('docs/post-reviews');
    expect(reviewFileFor('meu-post')).toBe('docs/post-reviews/meu-post.md');
  });

  it('reads the frontmatter title, quoted or not', () => {
    expect(titleOf('---\ntitle: "Com aspas: sim"\nslug: x\n---\nCorpo', 'x')).toBe('Com aspas: sim');
    expect(titleOf("---\ntitle: 'Simples'\n---\n", 'x')).toBe('Simples');
    expect(titleOf('---\ntitle: Sem aspas\n---\n', 'x')).toBe('Sem aspas');
  });

  it('falls back to the slug without a title', () => {
    expect(titleOf('Sem frontmatter\ntitle: falso', 'meu-post')).toBe('meu-post');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/files.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/files""

**Step 3: Write minimal implementation**
```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SLUG_PATTERN } from './schema';

export const POSTS_DIR = 'src/content/posts';
/** Its own folder: docs/reviews belongs to /rpi-review. */
export const REVIEW_DIR = 'docs/post-reviews';

/** Relative path of the post's source; null for a malformed slug or a missing file. */
export const postFileFor = (root: string, slug: string): string | null => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const relative = `${POSTS_DIR}/${slug}.md`;
  return existsSync(join(root, relative)) ? relative : null;
};

export const reviewFileFor = (slug: string): string => `${REVIEW_DIR}/${slug}.md`;

/** The frontmatter title without its quotes; the slug when there is none. */
export const titleOf = (source: string, slug: string): string => {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
  const raw = /^title:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim();
  return raw ? raw.replace(/^(['"])(.*)\1$/, '$2') : slug;
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/files.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 6: Gravar a revisão

**Requirement:** REQ-006, REQ-007, REQ-008
**Depends on:** Tasks 1, 3, 4, 5
**Files:**
- Create: `src/lib/post-review/save.ts`
- Test: `tests/post-review/save.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: security-reviewer, business-logic-reviewer, type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveReview } from '../../src/lib/post-review/save';

let root = '';
const now = () => new Date('2026-10-21T15:00:00.000Z');

const annotation = (quote: string, start: number) => ({
  quote,
  prefix: '',
  suffix: '',
  section: null,
  request: 'troca',
  replacement: '',
  start,
  end: start + quote.length,
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'post-review-save-'));
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/posts/meu-post.md'),
    '---\ntitle: "Meu post"\n---\n\nPrimeira frase.\n\nSegunda frase.\n',
  );
});

describe('saveReview', () => {
  it('writes the review in text order, with the probable lines', () => {
    const result = saveReview(
      { slug: 'meu-post', annotations: [annotation('Segunda frase', 40), annotation('Primeira frase', 5)] },
      root,
      now,
    );

    expect(result).toEqual({ ok: true, path: 'docs/post-reviews/meu-post.md' });
    const written = readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8');
    expect(written).toContain('# Revisão: Meu post');
    expect(written).toContain('- Gerada em: 2026-10-21T15:00:00.000Z');
    expect(written.indexOf('## 1. Abertura, linha 5')).toBeGreaterThan(-1);
    expect(written.indexOf('## 2. Abertura, linha 7')).toBeGreaterThan(written.indexOf('## 1.'));
  });

  it('overwrites the previous review', () => {
    saveReview({ slug: 'meu-post', annotations: [annotation('Primeira frase', 5)] }, root, now);
    saveReview({ slug: 'meu-post', annotations: [annotation('Segunda frase', 40)] }, root, now);
    const written = readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8');
    expect(written).toContain('- Anotações: 1');
    expect(written).not.toContain('Primeira frase');
  });

  it('refuses an invalid payload without writing', () => {
    const result = saveReview({ slug: 'meu-post', annotations: [] }, root, now);
    expect(result.ok).toBe(false);
    expect(existsSync(join(root, 'docs/post-reviews'))).toBe(false);
  });

  it('refuses a slug without a post file', () => {
    const result = saveReview({ slug: 'outro-post', annotations: [annotation('x', 0)] }, root, now);
    expect(result).toEqual({ ok: false, reason: 'Post não encontrado: outro-post' });
    expect(existsSync(join(root, 'docs/post-reviews'))).toBe(false);
  });

  it('explains which field failed', () => {
    const result = saveReview(
      { slug: 'meu-post', annotations: [{ ...annotation('x', 0), request: '', replacement: '' }] },
      root,
      now,
    );
    expect(result).toEqual({ ok: false, reason: 'Escreva o pedido ou o texto novo' });
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/save.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/save""

**Step 3: Write minimal implementation**
```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { postFileFor, reviewFileFor, titleOf } from './files';
import { locateLine } from './locate';
import { renderReview } from './render';
import { reviewPayloadSchema } from './schema';

export type SaveResult = { ok: true; path: string } | { ok: false; reason: string };

/**
 * Validates what the toolbar app sent and writes docs/post-reviews/<slug>.md.
 * The path comes from the validated slug only, never from the client.
 */
export const saveReview = (payload: unknown, root: string, now: () => Date): SaveResult => {
  const parsed = reviewPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue && issue.path.length > 0 && issue.code !== 'custom' ? ` (${issue.path.join('.')})` : '';
    return { ok: false, reason: `${issue?.message ?? 'Revisão inválida'}${where}` };
  }

  const { slug, annotations } = parsed.data;
  const postFile = postFileFor(root, slug);
  if (!postFile) return { ok: false, reason: `Post não encontrado: ${slug}` };

  const source = readFileSync(join(root, postFile), 'utf8');
  const path = reviewFileFor(slug);
  const markdown = renderReview({
    title: titleOf(source, slug),
    slug,
    generatedAt: now().toISOString(),
    annotations: [...annotations]
      .sort((a, b) => a.start - b.start)
      .map(annotation => ({ ...annotation, line: locateLine(source, annotation.quote) })),
  });

  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), markdown);
  return { ok: true, path };
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/save.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 7: Integração (servidor) e `.gitignore`

**Requirement:** REQ-001, REQ-006, REQ-007
**Depends on:** Task 6
**Files:**
- Create: `src/integrations/post-review.ts`
- Create: `src/integrations/post-review-app.ts` (stub nesta tarefa; o app de verdade vem na Task 10)
- Modify: `astro.config.mjs:1-18` (import e `integrations`)
- Modify: `.gitignore:1-10` (acrescenta `docs/post-reviews/`)
- Test: `tests/post-review/integration.test.ts`

**Team:**
- Track: infra
- Implementer: infra-engineer (skills: bash-linux)
- Reviewers: security-reviewer, consequences-reviewer

**Step 1: Write the failing test**
```ts
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { postReview } from '../../src/integrations/post-review';

type Handler = (data: unknown) => void;

const setup = (command: 'dev' | 'build' | 'preview' | 'sync', root = '/tmp/x/') => {
  const apps: { id: string; name: string; entrypoint: string | URL }[] = [];
  const integration = postReview();
  integration.hooks['astro:config:setup']?.({
    command,
    config: { root: pathToFileURL(root.endsWith('/') ? root : `${root}/`) },
    addDevToolbarApp: (app: (typeof apps)[number]) => apps.push(app),
  } as never);
  return { integration, apps };
};

describe('post-review integration', () => {
  it('adds the toolbar app on astro dev only', () => {
    expect(setup('dev').apps.map(app => [app.id, app.name])).toEqual([['post-review', 'Revisar texto']]);
    expect(setup('build').apps).toEqual([]);
    expect(setup('preview').apps).toEqual([]);
    expect(setup('sync').apps).toEqual([]);
  });

  it('saves on post-review:save and answers saved or failed', () => {
    const root = mkdtempSync(join(tmpdir(), 'post-review-int-'));
    mkdirSync(join(root, 'src/content/posts'), { recursive: true });
    writeFileSync(join(root, 'src/content/posts/meu-post.md'), '---\ntitle: Meu post\n---\n\nUma frase.\n');
    const { integration } = setup('dev', root);

    const handlers = new Map<string, Handler>();
    const sent: [string, unknown][] = [];
    integration.hooks['astro:server:setup']?.({
      toolbar: {
        on: (event: string, handler: Handler) => handlers.set(event, handler),
        send: (event: string, payload: unknown) => sent.push([event, payload]),
      },
    } as never);

    const annotation = {
      quote: 'Uma frase',
      prefix: '',
      suffix: '.',
      section: null,
      request: 'troca',
      replacement: '',
      start: 0,
      end: 9,
    };
    handlers.get('post-review:save')?.({ slug: 'meu-post', annotations: [annotation] });
    handlers.get('post-review:save')?.({ slug: 'meu-post', annotations: [] });

    expect(sent[0]).toEqual(['post-review:saved', { path: 'docs/post-reviews/meu-post.md' }]);
    expect(sent[1]?.[0]).toBe('post-review:failed');
    expect(readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8')).toContain('Uma frase');
  });

  it('is registered in astro.config.mjs', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toContain("import { postReview } from './src/integrations/post-review.ts';");
    expect(config).toMatch(/integrations: \[icon\(\), postReview\(\)\]/);
  });

  it('keeps the reviews out of git', () => {
    expect(readFileSync('.gitignore', 'utf8').split('\n')).toContain('docs/post-reviews/');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/integration.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/integrations/post-review""

**Step 3: Write minimal implementation**

`src/integrations/post-review.ts`:
```ts
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { saveReview } from '../lib/post-review/save';
import { REVIEW_APP_ID, REVIEW_EVENTS } from '../lib/post-review/schema';

/**
 * Text reviewer for posts (spec post-review). A Dev Toolbar app, so it exists
 * on `astro dev` only and never reaches dist/ or the client-JS allow list.
 */
export const postReview = (): AstroIntegration => {
  let root = process.cwd();

  return {
    name: REVIEW_APP_ID,
    hooks: {
      'astro:config:setup': ({ command, config, addDevToolbarApp }) => {
        if (command !== 'dev') return;
        root = fileURLToPath(config.root);
        addDevToolbarApp({
          id: REVIEW_APP_ID,
          name: 'Revisar texto',
          icon: 'file-search',
          entrypoint: fileURLToPath(new URL('./post-review-app.ts', import.meta.url)),
        });
      },
      'astro:server:setup': ({ toolbar }) => {
        toolbar.on(REVIEW_EVENTS.save, (payload: unknown) => {
          const result = saveReview(payload, root, () => new Date());
          if (result.ok) toolbar.send(REVIEW_EVENTS.saved, { path: result.path });
          else toolbar.send(REVIEW_EVENTS.failed, { reason: result.reason });
        });
      },
    },
  };
};
```

`src/integrations/post-review-app.ts` (stub, substituído na Task 10):
```ts
import { defineToolbarApp } from 'astro/toolbar';

export default defineToolbarApp({});
```

`astro.config.mjs`: acrescentar o import depois do de `codeToolbar` e trocar a linha de `integrations`:
```js
import { postReview } from './src/integrations/post-review.ts';
```
```js
  // Icons are inlined as SVG at render time; nothing ships to the browser.
  // Only the icons used are bundled into the server build. The post reviewer
  // is a Dev Toolbar app: it registers on `astro dev` only (spec post-review).
  integrations: [icon(), postReview()],
```

`.gitignore`: acrescentar no fim
```
docs/post-reviews/
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/integration.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 8: Funções de DOM (seleção, offsets, armazenamento)

**Requirement:** REQ-003, REQ-004, REQ-005, REQ-009
**Depends on:** Tasks 1, 2
**Files:**
- Create: `src/lib/post-review/dom.ts`
- Test: `tests/post-review/dom.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  articleOf,
  headingsOf,
  insertAnnotation,
  loadAnnotations,
  pendingFrom,
  rangeAt,
  storeAnnotations,
  textOffset,
} from '../../src/lib/post-review/dom';
import type { Annotation } from '../../src/lib/post-review/schema';

const markup = `
<article data-reader-article data-post-slug="meu-post">
  <h1>Título do post</h1>
  <p data-post-lead>Resumo curto.</p>
  <div data-post-toolbar>Copiar link</div>
  <div data-prose>
    <p>Abertura com <strong>negrito</strong> aqui.</p>
    <h2>Contexto</h2>
    <p>Texto da seção.</p>
  </div>
</article>`;

let article: HTMLElement;

const textNode = (selector: string): Text => document.querySelector(selector)!.firstChild as Text;

const rangeOver = (node: Text, start: number, end: number): Range => {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
};

beforeEach(() => {
  document.body.innerHTML = markup;
  article = articleOf(document)!;
});

describe('articleOf', () => {
  it('finds the post article, or null elsewhere', () => {
    expect(article.dataset.postSlug).toBe('meu-post');
    document.body.innerHTML = '<main>Outra página</main>';
    expect(articleOf(document)).toBeNull();
  });
});

describe('offsets', () => {
  it('measures a position in the article text and maps it back to a range', () => {
    const text = article.textContent ?? '';
    const node = textNode('strong');
    const start = textOffset(article, node, 0);
    expect(text.slice(start, start + 7)).toBe('negrito');
    expect(rangeAt(article, start, start + 7)?.toString()).toBe('negrito');
  });

  it('is null for offsets beyond the text', () => {
    expect(rangeAt(article, 0, 99999)).toBeNull();
  });
});

describe('pendingFrom', () => {
  it('anchors a selection inside the body with its section', () => {
    const pending = pendingFrom(article, rangeOver(textNode('h2 + p'), 0, 5));
    expect(pending?.quote).toBe('Texto');
    expect(pending?.section).toBe('Contexto');
    expect(pending?.prefix.endsWith('Contexto\n    ')).toBe(true);
  });

  it('accepts the title and the lead, with no section', () => {
    expect(pendingFrom(article, rangeOver(textNode('h1'), 0, 6))).toMatchObject({ quote: 'Título', section: null });
    expect(pendingFrom(article, rangeOver(textNode('[data-post-lead]'), 0, 6))?.quote).toBe('Resumo');
  });

  it('ignores a selection outside the regions, across regions or collapsed', () => {
    expect(pendingFrom(article, rangeOver(textNode('[data-post-toolbar]'), 0, 6))).toBeNull();
    const across = document.createRange();
    across.setStart(textNode('h1'), 0);
    across.setEnd(textNode('[data-post-lead]'), 6);
    expect(pendingFrom(article, across)).toBeNull();
    expect(pendingFrom(article, rangeOver(textNode('h1'), 2, 2))).toBeNull();
  });
});

describe('headingsOf', () => {
  it('lists the body h2/h3 with their offsets', () => {
    const [heading] = headingsOf(article);
    expect(heading?.text).toBe('Contexto');
    expect((article.textContent ?? '').slice(heading!.offset, heading!.offset + 8)).toBe('Contexto');
  });
});

const annotation = (start: number): Annotation => ({
  quote: 'x',
  prefix: '',
  suffix: '',
  section: null,
  request: 'troca',
  replacement: '',
  start,
  end: start + 1,
});

describe('annotations list and storage', () => {
  it('keeps the list in text order', () => {
    const list = insertAnnotation(insertAnnotation([], annotation(50)), annotation(10));
    expect(list.map(a => a.start)).toEqual([10, 50]);
  });

  it('round-trips through storage and removes the key when empty', () => {
    storeAnnotations(localStorage, 'meu-post', [annotation(10)]);
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([annotation(10)]);
    storeAnnotations(localStorage, 'meu-post', []);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('survives broken or throwing storage', () => {
    localStorage.setItem('post-review:meu-post', '{nope');
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([]);
    localStorage.setItem('post-review:meu-post', JSON.stringify([annotation(1), { quote: '' }]));
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([annotation(1)]);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadAnnotations(throwing, 'meu-post')).toEqual([]);
    expect(() => storeAnnotations(throwing, 'meu-post', [annotation(1)])).not.toThrow();
    expect(loadAnnotations(undefined, 'meu-post')).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/dom.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/dom""

**Step 3: Write minimal implementation**
```ts
import { anchorFrom, sectionFor, type Anchor, type HeadingMark } from './anchor';
import { annotationSchema, storageKey, type Annotation } from './schema';

/** Where an annotation may start and end: the title, the lead, the body. */
export const REGIONS = 'h1, [data-post-lead], [data-prose]';

export type Pending = Anchor & { section: string | null };

type ReviewStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const articleOf = (doc: Document): HTMLElement | null =>
  doc.querySelector<HTMLElement>('article[data-post-slug]');

const elementOf = (node: Node): Element | null => (node instanceof Element ? node : node.parentElement);

/** Character offset of (node, offset) in root's textContent. */
export const textOffset = (root: Node, node: Node, offset: number): number => {
  const range = (root.ownerDocument ?? document).createRange();
  range.setStart(root, 0);
  range.setEnd(node, offset);
  return range.toString().length;
};

/** The range over [start, end) of root's textContent; null past its end. */
export const rangeAt = (root: Node, start: number, end: number): Range | null => {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let seen = 0;
  let started = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!started && start <= seen + length) {
      range.setStart(node, start - seen);
      started = true;
    }
    if (started && end <= seen + length) {
      range.setEnd(node, end - seen);
      return range;
    }
    seen += length;
  }
  return null;
};

export const headingsOf = (article: HTMLElement): HeadingMark[] =>
  [...article.querySelectorAll('[data-prose] :is(h2, h3)')].map(heading => ({
    offset: textOffset(article, heading, 0),
    text: heading.textContent?.trim() ?? '',
  }));

/** The anchored selection, or null when it is empty or leaves one region. */
export const pendingFrom = (article: HTMLElement, range: Range): Pending | null => {
  if (range.collapsed) return null;
  const region = elementOf(range.startContainer)?.closest(REGIONS);
  if (!region || !article.contains(region)) return null;
  if (elementOf(range.endContainer)?.closest(REGIONS) !== region) return null;

  const anchor = anchorFrom(
    article.textContent ?? '',
    textOffset(article, range.startContainer, range.startOffset),
    textOffset(article, range.endContainer, range.endOffset),
  );
  if (anchor.quote === '') return null;
  return { ...anchor, section: sectionFor(headingsOf(article), anchor.start) };
};

export const insertAnnotation = (list: readonly Annotation[], annotation: Annotation): Annotation[] =>
  [...list, annotation].sort((a, b) => a.start - b.start);

export const loadAnnotations = (storage: ReviewStorage | undefined, slug: string): Annotation[] => {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(storageKey(slug)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(item => annotationSchema.safeParse(item).success) : [];
  } catch {
    return [];
  }
};

export const storeAnnotations = (storage: ReviewStorage | undefined, slug: string, list: readonly Annotation[]): void => {
  try {
    if (list.length === 0) storage?.removeItem(storageKey(slug));
    else storage?.setItem(storageKey(slug), JSON.stringify(list));
  } catch {
    // Blocked storage: the list lives until the page reloads.
  }
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/dom.test.ts`
Expected: PASS (11 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 9: Painel do revisor

**Requirement:** REQ-002, REQ-003, REQ-005, REQ-006, REQ-007, REQ-009, REQ-010
**Depends on:** Task 8
**Files:**
- Create: `src/lib/post-review/panel.ts`
- Test: `tests/post-review/panel.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails, security-reviewer

**Step 1: Write the failing test**
```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { mountPanel, type PanelServer } from '../../src/lib/post-review/panel';

const markup = `
<article data-reader-article data-post-slug="meu-post">
  <h1>Título do post</h1>
  <div data-prose><p>Primeira frase. Segunda frase.</p></div>
</article>`;

type Handler = (data: unknown) => void;

const fakeServer = () => {
  const handlers = new Map<string, Handler>();
  const sent: [string, unknown][] = [];
  const server: PanelServer = {
    send: (event, payload) => void sent.push([event, payload]),
    on: (event, handler) => void handlers.set(event, handler as Handler),
  };
  return { server, sent, emit: (event: string, data: unknown) => handlers.get(event)?.(data) };
};

let canvas: ShadowRoot;
let painted: Range[][];
let selected: Range | null;

const paragraph = () => document.querySelector('[data-prose] p')!.firstChild as Text;
const select = (start: number, end: number) => {
  selected = document.createRange();
  selected.setStart(paragraph(), start);
  selected.setEnd(paragraph(), end);
};
const $ = <T extends Element>(selector: string) => canvas.querySelector<T>(selector)!;
const altR = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', altKey: true }));

const mount = (server: PanelServer) => {
  const host = document.createElement('div');
  document.body.append(host);
  canvas = host.attachShadow({ mode: 'open' });
  const panel = mountPanel({
    canvas,
    doc: document,
    server,
    storage: localStorage,
    paint: ranges => void painted.push(ranges),
    currentRange: () => selected,
  });
  panel.setActive(true);
  return panel;
};

const annotate = (start: number, end: number, request: string, replacement = '') => {
  select(start, end);
  altR();
  $<HTMLTextAreaElement>('textarea[name="request"]').value = request;
  $<HTMLTextAreaElement>('textarea[name="replacement"]').value = replacement;
  $<HTMLFormElement>('[data-form]').dispatchEvent(new Event('submit', { cancelable: true }));
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = markup;
  painted = [];
  selected = null;
});

describe('post-review panel', () => {
  it('asks for a post on any other page', () => {
    document.body.innerHTML = '<main>Outra página</main>';
    mount(fakeServer().server);
    expect($('[data-empty]').hasAttribute('hidden')).toBe(false);
    expect($('[data-empty]').textContent).toBe('Abra um post para revisar');
    expect($('[data-review]').hasAttribute('hidden')).toBe(true);
  });

  it('opens the form with the quote on Alt+R and focuses the request', () => {
    mount(fakeServer().server);
    select(0, 15);
    altR();
    expect($('[data-form]').hasAttribute('hidden')).toBe(false);
    expect($('[data-quote]').textContent).toBe('Primeira frase.');
    expect(canvas.activeElement).toBe($('textarea[name="request"]'));
  });

  it('refuses an annotation with neither request nor replacement', () => {
    mount(fakeServer().server);
    annotate(0, 15, '  ');
    expect($('[data-error]').textContent).toBe('Escreva o pedido ou o texto novo');
    expect($('[data-list]').children.length).toBe(0);
  });

  it('lists annotations in text order, highlights them and keeps them after a reload', () => {
    mount(fakeServer().server);
    annotate(16, 30, '', 'Outra frase.');
    annotate(0, 15, 'mais curto');
    const items = [...$('[data-list]').children].map(item => item.querySelector('blockquote')?.textContent);
    expect(items).toEqual(['Primeira frase.', 'Segunda frase.']);
    expect($('[data-count]').textContent).toBe('2 anotações');
    expect(painted.at(-1)?.map(range => range.toString())).toEqual(['Primeira frase.', 'Segunda frase.']);

    document.body.innerHTML = markup;
    mount(fakeServer().server);
    expect($('[data-list]').children.length).toBe(2);
  });

  it('removes one annotation by its labelled button', () => {
    mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    const remove = $<HTMLButtonElement>('[data-list] button');
    expect(remove.getAttribute('aria-label')).toBe('Remover anotação 1');
    remove.click();
    expect($('[data-list]').children.length).toBe(0);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('sends the review on save and shows where it was written', () => {
    const { server, sent, emit } = fakeServer();
    mount(server);
    annotate(0, 15, 'mais curto');
    $<HTMLButtonElement>('[data-save]').click();
    expect(sent[0]?.[0]).toBe('post-review:save');
    expect(sent[0]?.[1]).toMatchObject({ slug: 'meu-post', annotations: [{ quote: 'Primeira frase.' }] });
    emit('post-review:saved', { path: 'docs/post-reviews/meu-post.md' });
    expect($('[data-status]').textContent).toBe('Salvo em docs/post-reviews/meu-post.md');
    emit('post-review:failed', { reason: 'Post não encontrado: meu-post' });
    expect($('[data-status]').textContent).toBe('Post não encontrado: meu-post');
  });

  it('clears the list, the highlights and the storage', () => {
    mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    $<HTMLButtonElement>('[data-clear]').click();
    expect($('[data-list]').children.length).toBe(0);
    expect(painted.at(-1)).toEqual([]);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('stops listening and removes the highlights when switched off', () => {
    const panel = mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    panel.setActive(false);
    expect(painted.at(-1)).toEqual([]);
    select(16, 30);
    altR();
    expect($('[data-quote]').textContent).toBe('');
  });

  it('labels every control', () => {
    mount(fakeServer().server);
    for (const field of canvas.querySelectorAll('textarea')) expect(field.closest('label')).not.toBeNull();
    for (const button of canvas.querySelectorAll('button')) expect(button.textContent?.trim()).not.toBe('');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/panel.test.ts`
Expected: FAIL with "Failed to resolve import "../../src/lib/post-review/panel""

**Step 3: Write minimal implementation**
```ts
import {
  articleOf,
  insertAnnotation,
  loadAnnotations,
  pendingFrom,
  rangeAt,
  storeAnnotations,
  type Pending,
} from './dom';
import { LIMITS, REVIEW_APP_ID, REVIEW_EVENTS, type Annotation } from './schema';

export type PanelServer = {
  send: <T>(event: string, payload: T) => void;
  on: <T>(event: string, callback: (data: T) => void) => void;
};

export type PanelDeps = {
  canvas: ShadowRoot;
  doc: Document;
  server: PanelServer;
  storage?: Storage;
  paint?: (ranges: Range[]) => void;
  currentRange?: () => Range | null;
};

export type Panel = { setActive: (state: boolean) => void };

/** Static markup only; every piece of post text goes in through textContent. */
const TEMPLATE = `
<style>
  section, form { display: flex; flex-direction: column; gap: 0.5rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  textarea { font: inherit; min-height: 4rem; }
  blockquote { margin: 0; padding-left: 0.5rem; border-left: 2px solid currentColor; }
  ol { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  [hidden] { display: none !important; }
</style>
<astro-dev-toolbar-window>
  <h2>Revisar texto</h2>
  <p data-empty hidden>Abra um post para revisar</p>
  <section data-review hidden>
    <p>Selecione um trecho do título, do resumo ou do texto (no teclado, Shift+setas) e aperte Alt+R.</p>
    <form data-form hidden>
      <blockquote data-quote></blockquote>
      <label>O que mudar <textarea name="request" maxlength="${LIMITS.request}"></textarea></label>
      <label>Texto novo <textarea name="replacement" maxlength="${LIMITS.replacement}"></textarea></label>
      <p data-error role="alert"></p>
      <div><button type="submit">Anotar</button> <button type="button" data-cancel>Cancelar</button></div>
    </form>
    <p data-count></p>
    <ol data-list></ol>
    <div><button type="button" data-save>Salvar revisão</button> <button type="button" data-clear>Limpar</button></div>
    <p data-status role="status"></p>
  </section>
</astro-dev-toolbar-window>`;

/** Marks on the page without touching its DOM (CSS Custom Highlight API). */
const paintHighlights = (ranges: Range[]): void => {
  if (typeof Highlight === 'undefined' || !CSS.highlights) return;
  if (ranges.length === 0) CSS.highlights.delete(REVIEW_APP_ID);
  else CSS.highlights.set(REVIEW_APP_ID, new Highlight(...ranges));
};

const HIGHLIGHT_STYLE = `::highlight(${REVIEW_APP_ID}) { background-color: Mark; color: MarkText; }`;

const safeStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const mountPanel = ({
  canvas,
  doc,
  server,
  storage = safeStorage(),
  paint = paintHighlights,
  currentRange = () => {
    const selection = doc.getSelection();
    return selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  },
}: PanelDeps): Panel => {
  canvas.innerHTML = TEMPLATE;
  const $ = <T extends Element>(selector: string): T => canvas.querySelector<T>(selector)!;
  const article = articleOf(doc);
  const slug = article?.dataset.postSlug;

  if (!article || !slug) {
    $<HTMLElement>('[data-empty]').hidden = false;
    return { setActive: () => {} };
  }

  $<HTMLElement>('[data-review]').hidden = false;
  const form = $<HTMLFormElement>('[data-form]');
  const quote = $<HTMLElement>('[data-quote]');
  const request = $<HTMLTextAreaElement>('textarea[name="request"]');
  const replacement = $<HTMLTextAreaElement>('textarea[name="replacement"]');
  const error = $<HTMLElement>('[data-error]');
  const count = $<HTMLElement>('[data-count]');
  const listView = $<HTMLOListElement>('[data-list]');
  const status = $<HTMLElement>('[data-status]');
  const style = Object.assign(doc.createElement('style'), { textContent: HIGHLIGHT_STYLE });

  let list = loadAnnotations(storage, slug);
  let pending: Pending | null = null;
  let active = false;

  const item = (annotation: Annotation, index: number): HTMLLIElement => {
    const li = doc.createElement('li');
    const cited = Object.assign(doc.createElement('blockquote'), { textContent: annotation.quote });
    const note = Object.assign(doc.createElement('p'), {
      textContent: annotation.request || `Texto novo: ${annotation.replacement}`,
    });
    const remove = Object.assign(doc.createElement('button'), { type: 'button', textContent: 'Remover' });
    remove.setAttribute('aria-label', `Remover anotação ${index + 1}`);
    remove.addEventListener('click', () => {
      list = list.filter(other => other !== annotation);
      commit();
    });
    li.append(cited, note, remove);
    return li;
  };

  const render = (): void => {
    count.textContent = list.length === 1 ? '1 anotação' : `${list.length} anotações`;
    listView.replaceChildren(...list.map(item));
    paint(
      active ? list.map(a => rangeAt(article, a.start, a.end)).filter((range): range is Range => range !== null) : [],
    );
  };

  const commit = (): void => {
    storeAnnotations(storage, slug, list);
    render();
  };

  const closeForm = (): void => {
    pending = null;
    form.reset();
    quote.textContent = '';
    error.textContent = '';
    form.hidden = true;
  };

  /** Opens the form for a range; leaves the panel as it was when the range is not annotatable. */
  const annotate = (range: Range | null): boolean => {
    const next = range ? pendingFrom(article, range) : null;
    if (!next) return false;
    pending = next;
    quote.textContent = next.quote;
    error.textContent = '';
    form.hidden = false;
    request.focus();
    return true;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!pending) return;
    const asked = request.value.trim();
    const written = replacement.value.trim();
    if (!asked && !written) {
      error.textContent = 'Escreva o pedido ou o texto novo';
      return;
    }
    if (list.length >= LIMITS.annotations) {
      error.textContent = `No máximo ${LIMITS.annotations} anotações por post`;
      return;
    }
    list = insertAnnotation(list, { ...pending, request: asked, replacement: written });
    closeForm();
    commit();
  });

  $<HTMLButtonElement>('[data-cancel]').addEventListener('click', closeForm);

  $<HTMLButtonElement>('[data-save]').addEventListener('click', () => {
    if (list.length === 0) {
      status.textContent = 'Nenhuma anotação para salvar';
      return;
    }
    status.textContent = 'Salvando…';
    server.send(REVIEW_EVENTS.save, { slug, annotations: list });
  });

  $<HTMLButtonElement>('[data-clear]').addEventListener('click', () => {
    list = [];
    closeForm();
    commit();
    status.textContent = 'Anotações removidas';
  });

  server.on<{ path: string }>(REVIEW_EVENTS.saved, ({ path }) => {
    status.textContent = `Salvo em ${path}`;
  });
  server.on<{ reason: string }>(REVIEW_EVENTS.failed, ({ reason }) => {
    status.textContent = reason;
  });

  const onMouseUp = (event: MouseEvent): void => {
    // Clicks inside the panel keep the page selection; they must not reopen the form.
    if (event.composedPath().includes(canvas.host)) return;
    annotate(currentRange());
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!event.altKey || event.key.toLowerCase() !== 'r') return;
    event.preventDefault();
    if (!annotate(currentRange())) status.textContent = 'Selecione um trecho do título, do resumo ou do texto';
  };

  const setActive = (state: boolean): void => {
    active = state;
    if (state) {
      doc.addEventListener('mouseup', onMouseUp);
      doc.addEventListener('keydown', onKeyDown);
      doc.head.append(style);
    } else {
      doc.removeEventListener('mouseup', onMouseUp);
      doc.removeEventListener('keydown', onKeyDown);
      style.remove();
      closeForm();
    }
    render();
  };

  render();
  return { setActive };
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/panel.test.ts`
Expected: PASS (9 tests)

Se `canvas.activeElement` vier `null` no happy-dom, troque a asserção por `expect(document.activeElement).toBe(canvas.host)`. Isso testa a mesma coisa pelo lado do documento. Não remova a verificação de foco.

**Step 5: Commit**
Run: `/git commit`

---

### Task 10: App da Dev Toolbar

**Requirement:** REQ-001, REQ-005
**Depends on:** Tasks 7, 9
**Files:**
- Modify: `src/integrations/post-review-app.ts` (stub da Task 7)
- Test: `tests/post-review/app.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import app from '../../src/integrations/post-review-app';

describe('post-review toolbar app', () => {
  it('mounts the panel and follows the toggle', async () => {
    document.body.innerHTML = '<article data-post-slug="meu-post"><div data-prose><p>Uma frase.</p></div></article>';
    const host = document.createElement('div');
    document.body.append(host);
    const canvas = host.attachShadow({ mode: 'open' });
    let toggled: ((options: { state: boolean }) => void) | undefined;
    const target = { onToggled: (callback: typeof toggled) => (toggled = callback) };
    const server = { send: vi.fn(), on: vi.fn() };

    await app.init?.(canvas, target as never, server as never);

    expect(canvas.querySelector('[data-review]')?.hasAttribute('hidden')).toBe(false);
    expect(server.on).toHaveBeenCalledWith('post-review:saved', expect.any(Function));
    toggled?.({ state: true });
    expect(document.head.querySelector('style')?.textContent).toContain('::highlight(post-review)');
    toggled?.({ state: false });
    expect(document.head.querySelector('style')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/app.test.ts`
Expected: FAIL with "expected undefined to be false" (o stub não tem `init`)

**Step 3: Write minimal implementation**
```ts
import { defineToolbarApp } from 'astro/toolbar';
import { mountPanel } from '../lib/post-review/panel';

/** Dev Toolbar shell over the reviewer panel (spec post-review). Dev only. */
export default defineToolbarApp({
  init(canvas, app, server) {
    const panel = mountPanel({ canvas, doc: document, server });
    app.onToggled(({ state }) => panel.setActive(state));
  },
});
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/app.test.ts && npm run check`
Expected: PASS (1 test), e `astro check` com `0 errors`

**Step 5: Commit**
Run: `/git commit`

---

### Task 11: Slug no artigo do post

**Requirement:** REQ-002
**Files:**
- Modify: `src/pages/[slug].astro:75` (`<article ... data-reader-article>`)
- Test: `tests/post-review/post-slug.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import PostPage from '../../src/pages/[slug].astro';

describe('post page slug for the reviewer', () => {
  it('marks the article with the post slug', async () => {
    const [entry] = await getAllPostEntries();
    expect(entry).toBeTruthy();
    const html = await (await AstroContainer.create()).renderToString(PostPage, {
      props: { entry },
      params: { slug: entry!.data.slug },
    });
    expect(html).toMatch(new RegExp(`<article[^>]*data-post-slug="${entry!.data.slug}"`));
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/post-review/post-slug.test.ts`
Expected: FAIL with "expected ... to match /<article[^>]*data-post-slug=..."

**Step 3: Write minimal implementation**

Em `src/pages/[slug].astro`, trocar:
```astro
  <article class="mt-2xl flex flex-col gap-xl" data-reader-article>
```
por:
```astro
  <article class="mt-2xl flex flex-col gap-xl" data-reader-article data-post-slug={post.slug}>
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/post-review/post-slug.test.ts tests/posts/post-page.test.ts`
Expected: PASS (todos)

**Step 5: Commit**
Run: `/git commit`

---

### Task 12: Portão de vazamento no build e documentação

**Requirement:** REQ-001
**Depends on:** Task 10
**Files:**
- Create: `tests/helpers/reviewer-leaks.ts`
- Create: `tests/helpers/reviewer-leaks.test.ts`
- Create: `tests/post-review/no-reviewer-in-dist.build-test.ts`
- Modify: `CLAUDE.md` (tabela "Portões automatizados" e seção nova "Revisor de texto")

**Team:**
- Track: infra
- Implementer: infra-engineer (skills: bash-linux)
- Reviewers: security-reviewer, consequences-reviewer

**Step 1: Write the failing test**

`tests/helpers/reviewer-leaks.test.ts`:
```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reviewerLeaks } from './reviewer-leaks';

describe('reviewerLeaks', () => {
  it('names every built file that carries the reviewer', () => {
    const dir = mkdtempSync(join(tmpdir(), 'reviewer-leaks-'));
    mkdirSync(join(dir, 'client/_astro'), { recursive: true });
    writeFileSync(join(dir, 'client/_astro/app.js'), 'send("post-review:save")');
    writeFileSync(join(dir, 'client/index.html'), '<button>Revisar texto</button>');
    writeFileSync(join(dir, 'client/clean.html'), '<article data-post-slug="x"></article>');
    writeFileSync(join(dir, 'client/logo.png'), 'post-review:save');

    expect(reviewerLeaks(dir).sort()).toEqual(
      [join(dir, 'client/_astro/app.js'), join(dir, 'client/index.html')].sort(),
    );
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/helpers/reviewer-leaks.test.ts`
Expected: FAIL with "Failed to resolve import "./reviewer-leaks""

**Step 3: Write minimal implementation**

`tests/helpers/reviewer-leaks.ts`:
```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

/** What only the dev-only reviewer would put in a build (spec post-review, REQ-001). */
const MARKERS = ['post-review:', 'Revisar texto'];
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.md']);

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

export const reviewerLeaks = (dir: string): string[] =>
  filesUnder(dir).filter(
    file => TEXT.has(extname(file)) && MARKERS.some(marker => readFileSync(file, 'utf8').includes(marker)),
  );
```

`tests/post-review/no-reviewer-in-dist.build-test.ts`:
```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reviewerLeaks } from '../helpers/reviewer-leaks';

// Requires `npm run build`. The reviewer is a Dev Toolbar app (spec post-review):
// nothing of it may reach the production build.
describe('post reviewer stays out of the build', () => {
  it('leaves no trace of the reviewer in dist/', () => {
    expect(existsSync('dist/client')).toBe(true);
    expect(reviewerLeaks('dist')).toEqual([]);
  });
});
```

`CLAUDE.md`: na tabela "Portões automatizados", acrescentar a linha
```markdown
| Revisor fora do build | `tests/post-review/no-reviewer-in-dist.build-test.ts` | Qualquer arquivo de `dist/` com `post-review:` ou "Revisar texto" |
```
e trocar "Sete testes" por "Oito testes". Depois de "Visão IA", acrescentar a seção:
```markdown
### Revisor de texto (`docs/specs/post-review`)

No `astro dev`, a Dev Toolbar tem o app "Revisar texto": grife um trecho de um post (ou selecione com Shift+setas e aperte Alt+R), escreva o pedido ou o texto novo e clique "Salvar revisão". O arquivo vai para `docs/post-reviews/<slug>.md` (gitignored). Para aplicar, peça "aplica a revisão do post <slug>": leia esse arquivo, edite só os trechos anotados em `src/content/posts/<slug>.md` e, no fim, apague a revisão aplicada. O app só existe no dev; o portão "Revisor fora do build" prova que nada dele chega ao `dist/`.
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/helpers/reviewer-leaks.test.ts && npm run verify`
Expected: PASS no teste do helper; `npm run verify` verde, com `tests/post-review/no-reviewer-in-dist.build-test.ts` passando dentro do `test:build`.

**Prova de vermelho do portão:** com o build pronto, rode `echo 'post-review:save' > dist/client/leak.js && npx vitest run -c vitest.build.config.ts tests/post-review/no-reviewer-in-dist.build-test.ts`. O esperado é FAIL listando `dist/client/leak.js`. Depois rode `rm dist/client/leak.js`.

**Step 5: Commit**
Run: `/git commit`

---

## Verificação manual (depois da Task 12)

Precisa do dev server, então peça ao autor antes de subir. Com `npm run dev`, abra um post e ligue "Revisar texto" na Dev Toolbar. Confira:

1. Grifar com o mouse abre o formulário.
2. Shift+setas seguido de Alt+R também abre.
3. O trecho anotado fica marcado na página.
4. Recarregar a página mantém as anotações.
5. "Salvar revisão" grava `docs/post-reviews/<slug>.md`, com a linha certa para um parágrafo comum.
6. "Limpar" remove as anotações.
7. Numa página que não é post, o app mostra "Abra um post para revisar".

Registre o resultado em `docs/reviews/post-review-manual-check.md`.
