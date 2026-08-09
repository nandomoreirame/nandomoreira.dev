# Plan: Restyle sobre o astro-starter-portfolio

> **Spec:** `docs/specs/theme-restyle/SPEC.md`

**Goal:** Adotar a composição e a densidade do `astro-starter-portfolio` mantendo paleta e fontes atuais, trocando grid de cards por listagem em linha, separando portfólio de laboratório e movendo About para página própria.
**Architecture:** Um componente `ListRow` substitui `ProjectCard` nas listagens, com grade de três colunas (data opcional, título e resumo, marcadores e indicador). `SectionHeading` ganha sobrescrito monoespaçado e contador. As decisões de lógica ficam em funções puras: agrupamento portfólio/laboratório em `src/lib/catalog/groups.ts` e formatação de data em `src/lib/format/date.ts`. Nenhum valor do tema entra como arbitrário: o que falta na escala vira token.
**Tech Stack:** Astro 7.2.0, Tailwind 4, TypeScript 5, Vitest, `experimental_AstroContainer`.
**Total Tasks:** 15
**Estimated Complexity:** large (9+ tasks)

---

## Verificação de caminhos (§3.5)

`Files: Modify` declarados: **12** — `src/styles/global.css`, `src/content/schemas/project.ts`,
`src/content/projects/forja.md`, `src/lib/content/projects.ts`, `src/components/ui/SectionHeader.astro`,
`src/components/layout/SiteNav.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`,
`src/components/home/*.astro`, `src/lib/aeo/sitemap.ts`, `src/lib/aeo/llms-txt.ts`,
`src/pages/projetos/index.astro`. Todos existem hoje.

Rodar a checagem de existência no início da execução.

**Fidelidade ao tema:** as referências de composição são
`src/components/WorkRow.astro`, `src/components/SectionHeading.astro`,
`src/components/Footer.astro`, `src/pages/index.astro` e `src/pages/about.astro` do
repositório `BracoZS/astro-starter-portfolio`. Consultar antes de cada tarefa que os
mencione, e **traduzir para os tokens do projeto**, nunca copiar classe do tema.

---

### Task 1: Tokens que faltam na escala

**Requirement:** REQ-016
**Files:**
- Modify: `src/styles/global.css`
- Test: `tests/design-system/tokens.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

Acrescentar a `tests/design-system/tokens.test.ts`:
```ts
const NEW_TOKENS = {
  '--tracking-eyebrow': '0.2em',
  '--text-micro': '0.6875rem',
};

describe('tokens introduced by the restyle', () => {
  it.each(Object.entries(NEW_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });
});
```

`0.6875rem` é 11px, o tamanho que o tema usa nos marcadores da linha. Entra como token
porque `text-[11px]` seria valor arbitrário e o portão da Task 4 do design system o
reprova.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/tokens.test.ts`
Expected: FAIL nos dois tokens novos.

**Step 3: Write minimal implementation**

No bloco `@theme` de `src/styles/global.css`, junto aos demais:
```css
  /* Restyle: sobrescrito de seção e marcadores da linha */
  --tracking-eyebrow: 0.2em;
  --text-micro: 0.6875rem;
  --text-micro--line-height: 1.4;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/tokens.test.ts && npm run verify`
Expected: PASS, e o portão completo verde.

**Step 5: Commit**

Run: `/git commit`

---

### Task 2: Data no schema de projeto

**Requirement:** REQ-006
**Files:**
- Modify: `src/content/schemas/project.ts`
- Modify: `src/content/projects/forja.md`
- Test: `tests/content/project-schema.test.ts`

**Team:**
- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

Acrescentar a `tests/content/project-schema.test.ts`:
```ts
it('requires a date, which the row pattern shows in its leading column', () => {
  const { date: _dropped, ...withoutDate } = { ...valid, date: '2026-04-01' };
  expect(projectSchema.safeParse(withoutDate).success).toBe(false);
});

it('accepts an ISO-8601 date', () => {
  expect(projectSchema.safeParse({ ...valid, date: '2026-04-01' }).success).toBe(true);
});

it('rejects a date that is not ISO-8601', () => {
  expect(projectSchema.safeParse({ ...valid, date: '01/04/2026' }).success).toBe(false);
});
```

A fixture `valid` do arquivo precisa ganhar `date` para os demais casos continuarem
passando.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/project-schema.test.ts`
Expected: FAIL, o schema ainda aceita projeto sem data.

**Step 3: Write minimal implementation**

Em `src/content/schemas/project.ts`, dentro do objeto:
```ts
    /** Shown as MM/YYYY in the leading column of the row pattern. */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date (YYYY-MM-DD)'),
```

Em `src/content/projects/forja.md`, acrescentar `date: "2026-01-15"` ao frontmatter,
com a data real do projeto.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/ && npm run build`
Expected: PASS, e o build conclui. Um projeto sem data agora quebra o build, que é o
comportamento desejado.

**Step 5: Commit**

Run: `/git commit`

---

### Task 3: Formatação de data para a linha

**Requirement:** REQ-006
**Files:**
- Create: `src/lib/format/date.ts`
- Test: `tests/format/date.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `business-logic-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`tests/format/date.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { toCompactStamp } from '../../src/lib/format/date';

describe('toCompactStamp', () => {
  it('renders an ISO date as MM/YYYY', () => {
    expect(toCompactStamp('2026-04-01')).toBe('04/2026');
  });

  it('pads a single-digit month', () => {
    expect(toCompactStamp('2025-06-09')).toBe('06/2025');
  });

  it('never shifts the month because of a timezone', () => {
    // Parsing '2026-01-01' as UTC and formatting in a negative offset would
    // yield 12/2025. The function must read the string, not build a Date.
    expect(toCompactStamp('2026-01-01')).toBe('01/2026');
  });

  it('rejects a malformed date instead of rendering NaN', () => {
    expect(() => toCompactStamp('01/2026')).toThrow();
  });
});
```

O terceiro caso é o que importa: usar `new Date(iso)` e formatar com fuso local desloca
o mês na virada do ano.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/format/date.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/format/date.ts`:
```ts
const ISO_DATE = /^(\d{4})-(\d{2})-\d{2}$/;

/**
 * Reads the ISO string directly instead of constructing a Date: parsing
 * '2026-01-01' as UTC and formatting in a negative offset yields 12/2025.
 */
export const toCompactStamp = (iso: string): string => {
  const match = ISO_DATE.exec(iso);

  if (!match) {
    throw new Error(`Expected an ISO-8601 date (YYYY-MM-DD), received "${iso}"`);
  }

  const [, year, month] = match;

  return `${month}/${year}`;
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/format/date.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 4: Agrupamento portfólio e laboratório

**Requirement:** REQ-011
**Files:**
- Create: `src/lib/catalog/groups.ts`
- Test: `tests/catalog/groups.test.ts`

**Team:**
- Track: backend
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`tests/catalog/groups.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';
import { COLLECTION_BLOCKS, blocksOf, collectionOfBlock } from '../../src/lib/catalog/groups';

describe('catalogue collections', () => {
  it('splits the archive into portfolio and lab', () => {
    expect(Object.keys(COLLECTION_BLOCKS)).toEqual(['portfolio', 'lab']);
  });

  it('puts delivered work in portfolio', () => {
    expect(blocksOf('portfolio')).toEqual(['ai-product', 'professional']);
  });

  it('puts tooling and systems in lab', () => {
    expect(blocksOf('lab')).toEqual(['ai-tooling', 'systems-cli']);
  });

  it('assigns every block to exactly one collection', () => {
    const assigned = [...blocksOf('portfolio'), ...blocksOf('lab')].sort();
    expect(assigned).toEqual([...BLOCKS].sort());
  });

  it('resolves the collection of a block', () => {
    expect(collectionOfBlock('ai-tooling')).toBe('lab');
    expect(collectionOfBlock('professional')).toBe('portfolio');
  });
});
```

O quarto caso é o invariante que impede um bloco novo de ficar órfão e sumir das duas
listagens sem ninguém notar.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/groups.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/catalog/groups.ts`:
```ts
import type { Block } from '../../content/blocks';

export type CatalogCollection = 'portfolio' | 'lab';

/**
 * Regrouping only: the four blocks stay exactly as cadastred. Portfolio is
 * delivered work, lab is tooling and experiments.
 */
export const COLLECTION_BLOCKS = {
  portfolio: ['ai-product', 'professional'],
  lab: ['ai-tooling', 'systems-cli'],
} as const satisfies Record<CatalogCollection, readonly Block[]>;

export const COLLECTION_LABELS: Record<CatalogCollection, string> = {
  portfolio: 'Portfólio',
  lab: 'Laboratório',
};

export const blocksOf = (collection: CatalogCollection): readonly Block[] =>
  COLLECTION_BLOCKS[collection];

export const collectionOfBlock = (block: Block): CatalogCollection =>
  (Object.keys(COLLECTION_BLOCKS) as CatalogCollection[]).find((collection) =>
    (COLLECTION_BLOCKS[collection] as readonly Block[]).includes(block),
  )!;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/groups.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 5: Componente `ListRow`

**Requirement:** REQ-002, REQ-003, REQ-004, REQ-020, REQ-021, REQ-022
**Files:**
- Create: `src/components/ui/ListRow.astro`
- Test: `tests/components/list-row.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 1, Task 3

**Step 1: Write the failing test**

`tests/components/list-row.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ListRow from '../../src/components/ui/ListRow.astro';

const base = {
  href: '/portfolio/forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  markers: ['Rust', 'Tauri'],
  stamp: '01/2026',
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ListRow, { props: { ...base, ...props } });
};

describe('ListRow', () => {
  it('links the whole row to its destination', async () => {
    expect(await render()).toContain('href="/portfolio/forja"');
  });

  it('shows the stamp when the item has one', async () => {
    expect(await render()).toContain('01/2026');
  });

  it('collapses the leading column when there is no stamp', async () => {
    const html = await render({ stamp: undefined });

    expect(html).not.toContain('01/2026');
    expect(html).toContain('grid-cols-[1fr_auto]');
  });

  it('truncates title and summary instead of widening the grid', async () => {
    const html = await render();
    expect((html.match(/truncate/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('hides the summary below sm and the markers below md', async () => {
    const html = await render();

    expect(html).toContain('hidden sm:block');
    expect(html).toContain('hidden md:block');
  });

  it('exposes a visible focus ring, since the row is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('marks the advance indicator as decorative', async () => {
    expect(await render()).toContain('aria-hidden="true"');
  });

  it('renders no marker column when the item has none', async () => {
    const html = await render({ markers: [] });
    expect(html).not.toContain('hidden md:block');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/list-row.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/ui/ListRow.astro`. Referência de composição: `WorkRow.astro` do tema,
traduzido para os tokens do projeto.
```astro
---
interface Props {
  href: string;
  title: string;
  summary?: string;
  markers?: string[];
  stamp?: string;
}

const { href, title, summary, markers = [], stamp } = Astro.props;

// The leading column only exists when there is something to put in it: an
// empty fixed column would leave a hole in the notes listing (REQ-022).
const columns = stamp
  ? 'grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[4.5rem_1fr_auto]'
  : 'grid-cols-[1fr_auto]';
---

<a
  href={href}
  class={`group grid ${columns} items-center gap-md border-b border-border py-lg transition-[border-color,color] duration-(--duration-fast) ease-out hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
>
  {stamp && <span class="font-mono text-small text-muted-foreground">{stamp}</span>}

  <span class="min-w-0">
    <span
      class="block truncate text-h3 text-foreground transition-colors group-hover:text-primary"
    >
      {title}
    </span>
    {summary && (
      <span class="hidden sm:block truncate text-small text-muted-foreground">
        {summary}
      </span>
    )}
  </span>

  <span class="flex items-center gap-md">
    {markers.length > 0 && (
      <span class="hidden md:block font-mono text-micro text-muted-foreground">
        {markers.slice(0, 2).join(' · ')}
      </span>
    )}
    <span
      aria-hidden="true"
      class="text-muted-foreground transition-transform group-hover:translate-x-xs group-hover:text-primary"
    >
      →
    </span>
  </span>
</a>
```

O deslocamento do indicador usa `transform`, permitido pela regra de motion, e é
suprimido automaticamente pela regra de `prefers-reduced-motion` que já existe.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/list-row.test.ts`
Expected: PASS, `Tests 8 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 6: `SectionHeader` com sobrescrito e contador

**Requirement:** REQ-005
**Files:**
- Modify: `src/components/ui/SectionHeader.astro`
- Test: `tests/components/badge-and-header.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 1

**Step 1: Write the failing test**

Acrescentar a `tests/components/badge-and-header.test.ts`:
```ts
describe('SectionHeader restyled', () => {
  it('renders the eyebrow in uppercase mono with the wide tracking token', async () => {
    const html = await render(SectionHeader, { title: 'Trabalho selecionado', level: 2 });

    expect(html).toContain('font-mono');
    expect(html).toContain('uppercase');
    expect(html).toContain('tracking-eyebrow');
  });

  it('pads the count to two digits', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2, count: 3 });
    expect(html).toContain('(03)');
  });

  it('omits the count when it is not given', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2 });
    expect(html).not.toMatch(/\(\d\d\)/);
  });

  it('renders a zero count rather than hiding it', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2, count: 0 });
    expect(html).toContain('(00)');
  });
});
```

O último caso protege contra `count && ...`, que esconderia o zero justamente quando a
listagem vazia precisa se declarar.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/badge-and-header.test.ts`
Expected: FAIL nos casos novos.

**Step 3: Write minimal implementation**

Reescrever `src/components/ui/SectionHeader.astro` mantendo as props atuais
(`title`, `level`, `index`, `description`) e acrescentando `count`, para não quebrar os
consumidores existentes. A prop `index` deixa de renderizar numeração própria: o
sobrescrito passa a ser o título em caixa alta, e o contador ocupa a direita.

```astro
---
interface Props {
  title: string;
  level?: 2 | 3;
  count?: number;
  description?: string;
  index?: number;
}

const { title, level = 2, count, description } = Astro.props;
const Heading = `h${level}` as 'h2' | 'h3';
---

<header class="mb-xl">
  <div class="flex items-baseline justify-between border-b border-border pb-sm">
    <Heading
      class="font-mono text-small uppercase tracking-eyebrow text-muted-foreground"
    >
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

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS. Os testes de `home-page` e `project-catalog` que asseguravam a numeração
antiga precisam ser atualizados junto, não silenciados.

**Step 5: Commit**

Run: `/git commit`

---

### Task 7: Rodapé

**Requirement:** REQ-013, REQ-014
**Files:**
- Create: `src/components/layout/SiteFooter.astro`
- Test: `tests/components/site-footer.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `security-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

`tests/components/site-footer.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';

const contacts = [
  { kind: 'email', value: 'fernando@nandomoreira.dev' },
  { kind: 'github', value: 'https://github.com/nandomoreirame' },
  { kind: 'linkedin', value: 'https://linkedin.com/in/nandomoreirame' },
];

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteFooter, {
    props: { name: 'Fernando Moreira Costa', year: 2026, contacts, ...props },
  });
};

describe('SiteFooter', () => {
  it('states the copyright with the name and year it receives', async () => {
    const html = await render();

    expect(html).toContain('2026');
    expect(html).toContain('Fernando Moreira Costa');
  });

  it('never credits the theme author', async () => {
    expect(await render()).not.toContain('BracoZS');
  });

  it('never links to X', async () => {
    const html = await render();

    expect(html).not.toMatch(/>\s*X\s*</);
    expect(html).not.toContain('x.com');
    expect(html).not.toContain('twitter.com');
  });

  it('lists the profile social channels', async () => {
    const html = await render();

    expect(html).toContain('github.com/nandomoreirame');
    expect(html).toContain('linkedin.com/in/nandomoreirame');
  });

  it('never publishes the email address in the footer', async () => {
    expect(await render()).not.toContain('@nandomoreira.dev');
  });

  it('offers a link back to the top', async () => {
    expect(await render()).toContain('href="#main"');
  });

  it('receives the year rather than reading the clock, so the build is reproducible', async () => {
    expect(await render({ year: 2030 })).toContain('2030');
  });
});
```

A data vem por prop e não de `new Date()` dentro do componente: um build reproduzível
não pode depender do relógio, e o teste ficaria instável na virada do ano.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/site-footer.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/layout/SiteFooter.astro`. Referência: `Footer.astro` do tema, **sem** o
`By BracoZS` e **sem** o item do X.
```astro
---
interface Props {
  name: string;
  year: number;
  contacts: Array<{ kind: string; value: string }>;
}

const { name, year, contacts } = Astro.props;

const LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  site: 'Site',
};

// Email is deliberately absent: the footer is on every page and gets scraped.
const social = contacts.filter((contact) => contact.kind in LABELS);
---

<footer class="border-t border-border">
  <div
    class="flex flex-col gap-md py-xl font-mono text-small text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
  >
    <p>© {year} {name}. Construído com Astro.</p>

    <nav class="flex items-center gap-lg" aria-label="Canais">
      {social.map((contact) => (
        <a
          href={contact.value}
          target="_blank"
          rel="noopener noreferrer me"
          class="inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {LABELS[contact.kind]}
        </a>
      ))}
      <a
        href="#main"
        class="inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Topo ↑
      </a>
    </nav>
  </div>
</footer>
```

A licença MIT do tema permanece no repositório; o que sai é a atribuição no rodapé.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/site-footer.test.ts`
Expected: PASS, `Tests 7 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 8: Rodapé no layout base

**Requirement:** REQ-013
**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/design-system/base-layout.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 7

**Step 1: Write the failing test**

Acrescentar a `tests/design-system/base-layout.test.ts`:
```ts
it('renders the footer on every page', async () => {
  expect(await render()).toContain('<footer');
});

it('keeps the footer outside the main landmark', async () => {
  const html = await render();
  expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('<footer'));
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/base-layout.test.ts`
Expected: FAIL, não há rodapé.

**Step 3: Write minimal implementation**

Em `src/layouts/BaseLayout.astro`, importar o perfil pela camada de acesso, calcular o
ano no frontmatter (uma vez por build) e renderizar `<SiteFooter />` depois de `</main>`,
dentro do container.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/base-layout.test.ts`
Expected: PASS.

**Step 5: Commit**

Run: `/git commit`

---

### Task 9: Rotas `/portfolio` e `/lab`

**Requirement:** REQ-012, REQ-002
**Files:**
- Create: `src/pages/portfolio/index.astro`
- Create: `src/pages/lab/index.astro`
- Create: `src/components/catalog/CollectionListing.astro`
- Test: `tests/catalog/collection-listing.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 4, Task 5, Task 6

**Step 1: Write the failing test**

`tests/catalog/collection-listing.test.ts` deve cobrir: a listagem usa `ListRow` e não
`ProjectCard`; ordena do mais recente para o mais antigo; mostra o contador com o total;
renderiza estado vazio explícito quando o agrupamento não tem projeto; e lê pela camada
de acesso, nunca por `getCollection`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/collection-listing.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`CollectionListing.astro` recebe `collection`, busca os projetos pela camada de acesso,
filtra pelos blocos de `blocksOf(collection)`, ordena por `date` decrescente e renderiza
`SectionHeader` com `count` mais uma lista de `ListRow`. As duas páginas são cascas finas
sobre ele.

O destino de cada linha é `/portfolio/<slug>` ou `/lab/<slug>` conforme o bloco, usando
`collectionOfBlock`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/ && npm run build`
Expected: PASS, e as duas rotas são geradas.

**Step 5: Commit**

Run: `/git commit`

---

### Task 10: Página de case nas rotas novas

**Requirement:** REQ-012, REQ-017
**Files:**
- Create: `src/pages/portfolio/[slug].astro`
- Create: `src/pages/lab/[slug].astro`
- Modify: `src/pages/projetos/index.astro`
- Create: `src/pages/projetos/[slug].astro` (substitui o atual por redirecionamento)
- Test: `tests/catalog/redirects.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `consequences-reviewer`, `security-reviewer`, `test-reviewer`
**Depends on:** Task 9

**Step 1: Write the failing test**

`tests/catalog/redirects.test.ts` verifica que as rotas antigas declaram redirecionamento
permanente para o destino novo, e que `getStaticPaths` das rotas novas deriva da camada
de acesso.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/redirects.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

As duas rotas novas reaproveitam `CaseArticle` sem alteração de API. As rotas antigas
passam a redirecionar com status 301: `/projetos` para `/portfolio`, e
`/projetos/<slug>` para a coleção correspondente ao bloco do projeto.

Redirecionar em vez de 404 porque `/projetos` já está no `sitemap.xml` publicado, e um
404 desperdiça a descoberta que `aeo-base` construiu.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/ && npm run build`
Expected: PASS.

Verificar o status real com o build local:
`curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:8137/projetos`
Expected: `301` com destino `/portfolio`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 11: Página `/sobre`

**Requirement:** REQ-009, REQ-019
**Files:**
- Create: `src/pages/sobre.astro`
- Test: `tests/pages/sobre.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 6

**Step 1: Write the failing test**

`tests/pages/sobre.test.ts` verifica: lê `getProfile` e não `getCollection`; renderiza a
bio completa; renderiza a stack reutilizando `TechBadge`; oferece um canal de contato; e
tem exatamente um `h1`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pages/sobre.test.ts`
Expected: FAIL, a página não existe.

**Step 3: Write minimal implementation**

Referência de composição: `about.astro` do tema — sobrescrito, título em display, bloco
de prosa, lista de ferramentas em pílulas, botão de contato. Traduzido para os
componentes do projeto: `SectionHeader`, `Prose`, `TechBadge`, `Button`.

Todo o conteúdo vem do perfil. Nenhum texto escrito no código, para não repetir o
problema que REQ-015 de `home-page` já resolveu.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pages/sobre.test.ts && npm run build`
Expected: PASS.

**Step 5: Commit**

Run: `/git commit`

---

### Task 12: Home reestruturada

**Requirement:** REQ-007, REQ-008, REQ-010, REQ-018
**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/home/Hero.astro`
- Modify: `src/components/home/FeaturedProjects.astro`
- Modify: `src/components/home/About.astro`
- Test: `tests/home/index-page.test.ts`
- Test: `tests/home/hero.test.ts`
- Test: `tests/home/featured.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 5, Task 6, Task 11

**Step 1: Write the failing test**

Atualizar os três arquivos de teste para a estrutura nova:

- `Hero`: exibe a disponibilidade do perfil como marcador visual **acompanhado de rótulo textual** (nunca só cor), mantém exatamente um CTA primário, e continua sem animar texto a partir do invisível.
- `FeaturedProjects`: usa `ListRow`, limita a cinco itens priorizando os destacados, e mostra o link "ver todos" com o total apenas quando há mais itens do que os exibidos.
- `index-page`: ordem hero, trabalho selecionado, trajetória, serviços, sobre, contato; a seção sobre traz resumo e link para `/sobre`, sem duplicar o texto.

O teste do CTA primário único (`tests/home/single-primary-cta.test.ts`) continua valendo
sem alteração e é o que impede o hero do tema, que tem dois botões, de virar dois CTAs de
mesmo peso aqui.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/home/`
Expected: FAIL nos casos novos.

**Step 3: Write minimal implementation**

Referência: `index.astro` do tema. O hero ganha o indicador de estado; a seção de
destaques troca o grid por `ListRow` com teto de cinco; a seção sobre encolhe para um
resumo com link.

O segundo botão do hero no tema (`Say hello`, variante ghost) é permitido, porque ghost
não é peso primário. Manter apenas um `variant="primary"`.

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS em toda a suíte.

**Step 5: Commit**

Run: `/git commit`

---

### Task 13: Navegação

**Requirement:** REQ-012, REQ-017
**Files:**
- Modify: `src/components/layout/SiteNav.astro`
- Test: `tests/catalog/site-nav.test.ts`

**Team:**
- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 9, Task 11

**Step 1: Write the failing test**

Atualizar `tests/catalog/site-nav.test.ts`: os destinos passam a ser `/portfolio`,
`/lab`, `/sobre` e `/#contato`. Manter a asserção que já existe e que proíbe apontar
para rota inexistente.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/site-nav.test.ts`
Expected: FAIL, os destinos antigos ainda estão lá.

**Step 3: Write minimal implementation**

```astro
const items = [
  { href: '/portfolio', label: 'Portfólio' },
  { href: '/lab', label: 'Laboratório' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
];
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/site-nav.test.ts`
Expected: PASS.

**Step 5: Commit**

Run: `/git commit`

---

### Task 14: Rotas de máquina atualizadas

**Requirement:** REQ-017
**Files:**
- Modify: `src/lib/aeo/sitemap.ts`
- Modify: `src/lib/aeo/llms-txt.ts`
- Test: `tests/aeo/sitemap.test.ts`
- Test: `tests/aeo/llms-txt.test.ts`

**Team:**
- Track: backend
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `security-reviewer`, `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 10, Task 11

**Step 1: Write the failing test**

Atualizar os dois arquivos: o sitemap lista `/`, `/portfolio`, `/lab`, `/sobre` e cada
case na coleção correta, e **não** lista `/projetos`, que agora só redireciona. O
`llms.txt` aponta os projetos para as URLs novas.

Acrescentar um caso que reprova a presença de rota redirecionada no sitemap: listar uma
URL que responde 301 ensina o crawler a desconfiar do arquivo.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/aeo/`
Expected: FAIL.

**Step 3: Write minimal implementation**

Derivar o caminho de cada projeto de `collectionOfBlock`, para que sitemap, `llms.txt` e
as páginas nunca divirjam sobre onde um case mora.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/aeo/ && bash scripts/verify-aeo-routes.sh`
Expected: PASS, e o script termina com `AEO ROUTES PASSED`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 15: Verificação manual e fechamento

**Requirement:** REQ-003, REQ-015, REQ-020
**Files:**
- Create: `docs/reviews/theme-restyle-manual-check.md`

**Team:**
- Track: docs
- Implementer: `rpi-implementer`
- Reviewers: self-review
**Depends on:** Task 14

**Step 1: Write the failing test**

Portão documental: a verificação responsiva e de teclado não é alcançável por
`AstroContainer`, porque depende de viewport real.

**Step 2: Run test to verify it fails**

Run: `test -f docs/reviews/theme-restyle-manual-check.md`
Expected: FAIL, exit 1.

**Step 3: Write minimal implementation**

Com o build local no ar, conferir em 320px, 640px, 768px e desktop:

1. A linha some com o resumo abaixo de 640px e com os marcadores abaixo de 768px, sem quebrar a grade.
2. Título longo trunca em vez de gerar scroll horizontal, nas três listagens.
3. Tabulação percorre as linhas em ordem, com foco visível.
4. `/notas` ainda não existe e não está na navegação.
5. O rodapé não mostra crédito ao tema nem X.
6. `/projetos` redireciona com 301.

Registrar cada item com resultado e data. Anotar o que falhou, não só o que passou.

**Step 4: Run test to verify it passes**

Run: `test -f docs/reviews/theme-restyle-manual-check.md && npm run verify`
Expected: PASS, e o portão completo verde com os sete portões originais intactos.

**Step 5: Commit**

Run: `/git commit`

---

## Depois do plano

`ProjectCard` deixa de ser usado nas listagens mas continua no repositório. A decisão de
aposentá-lo fica para depois de a nova listagem estar no ar, para não perder o fallback
determinístico de imagem sem substituto.

`notes` depende deste plano: o `ListRow` com coluna de data colapsável (REQ-022) é o que
permite listar nota sem data.

Três documentos precisam ser atualizados quando esta feature fechar, e estão no plano de
`notes` porque lá a mudança é maior: `PRD.md`, `MVP-SCOPE.md` e o roadmap.
