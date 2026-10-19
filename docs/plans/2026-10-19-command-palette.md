# Plano: Paleta de comandos (Ctrl+K)

> **Spec:** docs/specs/command-palette/SPEC.md

**Objetivo:** abrir com `Ctrl+K`/`⌘K` (ou pelo botão `⌘` do cabeçalho) uma paleta que busca posts, cases, páginas e serviços, oferece "Copiar link", "Enviar e-mail" e "Ir para" com sequências `G` + letra, com transições suaves e sem pesar em quem nunca a abre.
**Arquitetura:** a lógica é pura e mora em `src/lib/search/` (copy, busca, índice, sequência `G`, controlador). O índice sai pré-renderizado em `/search.json`. O markup do `<dialog>` vem do `BaseLayout`; o módulo `src/scripts/palette.ts` (terceira exceção de JavaScript, até 4 KB gzip) é baixado sob demanda por um carregador mínimo dentro do script do `PointerField`. As transições são CSS puro, no padrão do lightbox.
**Stack:** Astro 7 SSR, TypeScript, Tailwind 4, Vitest (+ `happy-dom` só no teste do módulo).
**Total de tarefas:** 15
**Complexidade estimada:** grande
**Depende de:** nada. **Sequenciar com `i18n-foundation`**: as duas mexem em `src/components/art/PointerField.astro` e em `src/components/layout/SiteHeader.astro`. Não implementar as duas em paralelo.

---

## Lotes e dependências

| Lote | Tarefas | Depende de |
|------|---------|------------|
| A: lógica pura | 1, 2, 3, 4, 5, 6 | nada (3 depende de 1; 6 depende de 1, 2, 5) |
| B: markup e estilo | 7, 8, 9, 10 | 1 |
| C: portão | 11 | nada |
| D: módulo e carregador | 12, 13 | 6, 7, 11 |
| E: docs e verificação | 14, 15 | todas |

---

### Tarefa 1: Copy da paleta e mapa `G` + letra

**Requisito:** REQ-007, REQ-010, REQ-011 (D6, D9)
**Arquivos:**
- Criar: `src/lib/search/copy.ts`
- Teste: `tests/search/copy.test.ts`

**Equipe:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { GO_TARGETS, PALETTE_COPY, PALETTE_PAGES } from '../../src/lib/search/copy';

describe('palette copy', () => {
  it('maps G + letter to the site sections, one letter each', () => {
    expect(GO_TARGETS.map((target) => [target.key, target.path])).toEqual([
      ['h', '/'],
      ['b', '/posts'],
      ['p', '/portfolio'],
      ['l', '/lab'],
      ['s', '/sobre'],
      ['u', '/setup'],
      ['n', '/now'],
      ['c', '/contato'],
      ['m', '/mcp'],
    ]);
    expect(new Set(GO_TARGETS.map((target) => target.key)).size).toBe(GO_TARGETS.length);
  });

  it('writes every visible string in pt-BR, without dashes', () => {
    const text = JSON.stringify({ PALETTE_COPY, GO_TARGETS, PALETTE_PAGES });
    expect(text).not.toMatch(/[–—]/);
    expect(PALETTE_COPY.placeholder).toBe('Digite um comando ou busque…');
    expect(PALETTE_COPY.groups.go).toBe('Ir para');
  });

  it('lists the site pages for the index, including the CV', () => {
    expect(PALETTE_PAGES.map((page) => page.path)).toContain('/curriculo');
  });
});
```

**Passo 2:** `npx vitest run tests/search/copy.test.ts` → FAIL: `Failed to resolve import "../../src/lib/search/copy"`.

**Passo 3: implementação mínima**
```ts
/** Visible strings of the command palette (docs/specs/command-palette, D9), in pt-BR. */
export const PALETTE_COPY = {
  placeholder: 'Digite um comando ou busque…',
  label: 'Buscar no site',
  trigger: 'Abrir a busca',
  hint: { before: 'Pressione', after: 'para começar' },
  empty: 'Nada encontrado.',
  unavailable: 'A busca está indisponível agora; os atalhos continuam funcionando.',
  copied: 'Link copiado',
  results: (count: number) => (count === 1 ? '1 resultado' : `${count} resultados`),
  groups: {
    general: 'Geral',
    go: 'Ir para',
    post: 'Posts',
    case: 'Cases',
    page: 'Páginas',
    service: 'Serviços',
    archive: 'Arquivo',
  },
  actions: {
    copyLink: 'Copiar link',
    email: 'Enviar e-mail',
    contact: 'Ir para o contato',
  },
} as const;

export interface GoTarget {
  key: string;
  path: string;
  label: string;
}

/** G + letter (D6): global, only in sequence, never a lone key. */
export const GO_TARGETS: readonly GoTarget[] = [
  { key: 'h', path: '/', label: 'Home' },
  { key: 'b', path: '/posts', label: 'Blog' },
  { key: 'p', path: '/portfolio', label: 'Portfólio' },
  { key: 'l', path: '/lab', label: 'Lab' },
  { key: 's', path: '/sobre', label: 'Sobre' },
  { key: 'u', path: '/setup', label: 'Setup' },
  { key: 'n', path: '/now', label: 'Agora' },
  { key: 'c', path: '/contato', label: 'Contato' },
  { key: 'm', path: '/mcp', label: 'MCP' },
];

/** Site pages that enter the search index (REQ-005). */
export const PALETTE_PAGES: ReadonlyArray<{ path: string; title: string }> = [
  ...GO_TARGETS.map(({ path, label }) => ({ path, title: label })),
  { path: '/curriculo', title: 'Currículo' },
];
```

**Passo 4:** `npx vitest run tests/search/copy.test.ts` → PASS.

**Passo 5:** `/git commit`

---

### Tarefa 2: Normalização, correspondência e ordenação

**Requisito:** REQ-008 (D4)
**Arquivos:**
- Criar: `src/lib/search/match.ts`
- Teste: `tests/search/match.test.ts`

**Equipe:** backend · backend-engineer (typescript-backend) · business-logic-reviewer, test-reviewer

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { normalize, scoreOf, type Searchable } from '../../src/lib/search/match';

const item: Searchable = { title: 'Meu homelab num Mac mini', summary: 'Discos, DNS e Tailscale', keywords: ['linux', 'redes'] };

describe('search matching', () => {
  it('ignores case and accents', () => {
    expect(normalize('Ação Rápida')).toBe('acao rapida');
  });

  it('requires every typed term', () => {
    expect(scoreOf(item, 'homelab dns')).toBeGreaterThan(0);
    expect(scoreOf(item, 'homelab kubernetes')).toBe(0);
  });

  it('ranks a title hit above a keyword hit above a summary hit', () => {
    expect(scoreOf(item, 'homelab')).toBeGreaterThan(scoreOf(item, 'redes'));
    expect(scoreOf(item, 'redes')).toBeGreaterThan(scoreOf(item, 'tailscale'));
  });

  it('matches everything on an empty query, with no score', () => {
    expect(scoreOf(item, '   ')).toBe(0);
  });
});
```

**Passo 2:** `npx vitest run tests/search/match.test.ts` → FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
export interface Searchable {
  title: string;
  summary?: string;
  keywords?: readonly string[];
}

/** Lower case, no accents, single spaces: what the visitor types is compared like this. */
export const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

const terms = (query: string): string[] => normalize(query).split(' ').filter(Boolean);

/**
 * 0 when some term is missing (or the query is empty); otherwise title hits
 * weigh 3, keyword hits 2 and summary hits 1 (D4).
 */
export const scoreOf = (item: Searchable, query: string): number => {
  const words = terms(query);
  if (words.length === 0) return 0;
  const title = normalize(item.title);
  const keywords = normalize((item.keywords ?? []).join(' '));
  const summary = normalize(item.summary ?? '');
  let score = 0;
  for (const word of words) {
    const hit = (title.includes(word) ? 3 : 0) + (keywords.includes(word) ? 2 : 0) + (summary.includes(word) ? 1 : 0);
    if (hit === 0) return 0;
    score += hit;
  }
  return score;
};
```

**Passo 4:** PASS. **Passo 5:** `/git commit`

---

### Tarefa 3: Montar o índice de busca

**Requisito:** REQ-005 (D8)
**Depende de:** Tarefa 1
**Arquivos:**
- Criar: `src/lib/search/build-index.ts`
- Teste: `tests/search/build-index.test.ts`

**Equipe:** backend · backend-engineer (typescript-backend) · business-logic-reviewer, test-reviewer

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from '../../src/lib/search/build-index';

const post = (slug: string, draft = false) => ({ slug, title: `Post ${slug}`, summary: 'Resumo', markers: ['a', 'b', 'c'], draft });

describe('buildSearchIndex', () => {
  const index = buildSearchIndex({
    current: [post('novo'), post('rascunho', true)],
    archived: [post('velho')],
    projects: [{ slug: 'forja', title: 'Forja', summary: 'Cliente desktop', tech: ['Electron'], block: 'systems-cli' }],
    services: [{ title: 'Landing page', summary: 'Uma página', url: 'https://contrate.nandomoreira.dev/landing-page' }],
    landingUrl: 'https://contrate.nandomoreira.dev/',
  });

  it('lists pages, current posts, archived posts, cases and services, without drafts', () => {
    const kinds = new Set(index.map((item) => item.kind));
    expect([...kinds].sort()).toEqual(['archive', 'case', 'page', 'post', 'service']);
    expect(index.find((item) => item.title === 'Post rascunho')).toBeUndefined();
  });

  it('points posts at /slug, cases at their collection and services at the sales host', () => {
    expect(index.find((item) => item.title === 'Post novo')?.path).toBe('/novo');
    expect(index.find((item) => item.title === 'Post velho')?.kind).toBe('archive');
    expect(index.find((item) => item.title === 'Forja')?.path).toMatch(/^\/(portfolio|lab)\/forja$/);
    expect(index.find((item) => item.title === 'Landing page')?.path).toBe('https://contrate.nandomoreira.dev/landing-page');
    expect(index.find((item) => item.path === 'https://contrate.nandomoreira.dev/')?.kind).toBe('service');
  });

  it('keeps markers and tech as keywords', () => {
    expect(index.find((item) => item.title === 'Forja')?.keywords).toEqual(['Electron']);
  });
});
```

**Passo 2:** FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
import { collectionOfBlock } from '../catalog/groups';
import { PALETTE_PAGES } from './copy';

export type SearchKind = 'page' | 'post' | 'archive' | 'case' | 'service';

export interface SearchItem {
  kind: SearchKind;
  title: string;
  path: string;
  summary?: string;
  keywords?: string[];
}

interface PostLike {
  slug: string;
  title: string;
  summary: string;
  markers: string[];
  draft?: boolean;
}

interface Input {
  current: readonly PostLike[];
  archived: readonly PostLike[];
  projects: ReadonlyArray<{ slug: string; title: string; summary: string; tech: string[]; block: Parameters<typeof collectionOfBlock>[0] }>;
  services: ReadonlyArray<{ title: string; summary: string; url: string }>;
  landingUrl: string;
}

const postItem = (kind: 'post' | 'archive') => (post: PostLike): SearchItem => ({
  kind,
  title: post.title,
  path: `/${post.slug}`,
  summary: post.summary,
  keywords: post.markers,
});

/** The /search.json body (REQ-005). Drafts never enter, even on dev. */
export const buildSearchIndex = ({ current, archived, projects, services, landingUrl }: Input): SearchItem[] => [
  ...PALETTE_PAGES.map((page) => ({ kind: 'page' as const, title: page.title, path: page.path })),
  ...current.filter((post) => !post.draft).map(postItem('post')),
  ...projects.map((project) => ({
    kind: 'case' as const,
    title: project.title,
    path: `/${collectionOfBlock(project.block)}/${project.slug}`,
    summary: project.summary,
    keywords: project.tech,
  })),
  { kind: 'service', title: 'Serviços', path: landingUrl, summary: 'Sites, lojas e sistemas para o seu negócio' },
  ...services.map((service) => ({ kind: 'service' as const, title: service.title, path: service.url, summary: service.summary })),
  ...archived.filter((post) => !post.draft).map(postItem('archive')),
];
```

**Passo 4:** PASS. **Passo 5:** `/git commit`

---

### Tarefa 4: Rota `/search.json`

**Requisito:** REQ-005, REQ-006 (D3)
**Depende de:** Tarefa 3
**Arquivos:**
- Criar: `src/pages/search.json.ts`
- Teste: `tests/search/search-route.test.ts`

**Equipe:** backend · backend-engineer (typescript-backend) · security-reviewer, test-reviewer

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { GET, prerender } from '../../src/pages/search.json';
import { getArchivedPosts, getCurrentPosts } from '../../src/lib/content';

describe('/search.json', () => {
  it('is built once, at build time', () => {
    expect(prerender).toBe(true);
  });

  it('answers JSON with every current post and no e-mail', async () => {
    const response = await GET({} as never);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.text();
    const items = JSON.parse(body) as Array<{ path: string; kind: string }>;
    for (const post of await getCurrentPosts()) {
      if (!post.draft) expect(items.some((item) => item.path === `/${post.slug}`)).toBe(true);
    }
    expect(items.filter((item) => item.kind === 'archive')).toHaveLength((await getArchivedPosts()).filter((post) => !post.draft).length);
    expect(body).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});
```

**Passo 2:** FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
import type { APIRoute } from 'astro';
import { getAllProjects, getArchivedPosts, getCurrentPosts } from '../lib/content';
import { SALES_SERVICES } from '../lib/sales/catalog';
import { salesUrl } from '../lib/sales/host';
import { buildSearchIndex } from '../lib/search/build-index';

/** The command palette index (docs/specs/command-palette, D3): fetched on first open. */
export const prerender = true;

export const GET: APIRoute = async () => {
  const [current, archived, projects] = await Promise.all([getCurrentPosts(), getArchivedPosts(), getAllProjects()]);
  const index = buildSearchIndex({
    current,
    archived,
    projects,
    services: SALES_SERVICES.map((service) => ({ title: service.title, summary: service.summary, url: salesUrl(service.slug) })),
    landingUrl: salesUrl(),
  });
  return new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
```

**Passo 4:** PASS. Conferir também `npx vitest run tests/aeo/no-leak.test.ts` (verde). **Passo 5:** `/git commit`

---

### Tarefa 5: Sequência `G` + letra e alvo de digitação

**Requisito:** REQ-011, REQ-012 (D6)
**Arquivos:**
- Criar: `src/lib/search/go-sequence.ts`
- Teste: `tests/search/go-sequence.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · business-logic-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { GO_WINDOW_MS, goPathFor, isTypingTarget } from '../../src/lib/search/go-sequence';

describe('G + letter', () => {
  it('resolves a mapped letter pressed within the window after G', () => {
    expect(goPathFor({ armedAt: 1000, now: 1500, key: 'b' })).toBe('/posts');
    expect(goPathFor({ armedAt: 1000, now: 1000 + GO_WINDOW_MS + 1, key: 'b' })).toBeUndefined();
    expect(goPathFor({ armedAt: undefined, now: 1500, key: 'b' })).toBeUndefined();
    expect(goPathFor({ armedAt: 1000, now: 1200, key: 'x' })).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(goPathFor({ armedAt: 0, now: 10, key: 'H' })).toBe('/');
  });

  it('never fires while typing', () => {
    expect(isTypingTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'A', isContentEditable: false })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
```

**Passo 2:** FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
import { GO_TARGETS } from './copy';

/** How long after G the second letter still counts (REQ-011). */
export const GO_WINDOW_MS = 1000;

export const goPathFor = ({ armedAt, now, key }: { armedAt: number | undefined; now: number; key: string }): string | undefined => {
  if (armedAt === undefined || now - armedAt > GO_WINDOW_MS) return undefined;
  return GO_TARGETS.find((target) => target.key === key.toLowerCase())?.path;
};

/** REQ-012: a field, a select or editable content keeps every letter. */
export const isTypingTarget = (target: { tagName: string; isContentEditable: boolean } | null): boolean =>
  target !== null && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
```

**Passo 4:** PASS. **Passo 5:** `/git commit`

---

### Tarefa 6: Controlador da paleta (estado sem DOM)

**Requisito:** REQ-007, REQ-008, REQ-009, REQ-010, REQ-013
**Depende de:** Tarefas 1, 2, 3
**Arquivos:**
- Criar: `src/lib/search/controller.ts`
- Teste: `tests/search/controller.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · business-logic-reviewer, test-reviewer

**Passo 1: teste que falha**
```ts
import { describe, expect, it } from 'vitest';
import { move, viewFor } from '../../src/lib/search/controller';
import type { SearchItem } from '../../src/lib/search/build-index';

const index: SearchItem[] = [
  { kind: 'archive', title: 'Homelab antigo', path: '/velho' },
  { kind: 'post', title: 'Meu homelab', path: '/homelab', keywords: ['linux'] },
  { kind: 'case', title: 'Forja', path: '/lab/forja' },
];

describe('palette view', () => {
  it('shows General then Go to on an empty query', () => {
    expect(viewFor(index, '').map((group) => group.label)).toEqual(['Geral', 'Ir para']);
  });

  it('groups hits by kind, archive always last, best score first', () => {
    const groups = viewFor(index, 'homelab');
    expect(groups.map((group) => group.label)).toEqual(['Posts', 'Arquivo']);
  });

  it('filters actions and destinations too', () => {
    const groups = viewFor(index, 'copiar');
    expect(groups[0]?.options[0]?.label).toBe('Copiar link');
  });

  it('offers the contact when nothing matches', () => {
    const groups = viewFor(index, 'zzzz');
    expect(groups).toHaveLength(1);
    expect(groups[0]?.options[0]?.href).toBe('/contato');
    expect(groups[0]?.empty).toBe(true);
  });

  it('keeps going to work with no index (fetch failed)', () => {
    expect(viewFor(undefined, 'blog')[0]?.options[0]?.href).toBe('/posts');
  });

  it('gives every option a unique id for aria-activedescendant', () => {
    const ids = viewFor(index, '').flatMap((group) => group.options.map((option) => option.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wraps the active option with the arrows', () => {
    expect(move(0, -1, 5)).toBe(4);
    expect(move(4, 1, 5)).toBe(0);
    expect(move(0, 1, 0)).toBe(-1);
  });
});
```

**Passo 2:** FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
import type { SearchItem, SearchKind } from './build-index';
import { GO_TARGETS, PALETTE_COPY } from './copy';
import { scoreOf } from './match';

export interface PaletteOption {
  id: string;
  label: string;
  /** Destination; absent for an in-page action. */
  href?: string;
  action?: 'copy-link';
  /** Keys shown with <kbd>, e.g. ['G', 'B']. */
  keys?: string[];
}

export interface PaletteGroup {
  label: string;
  options: PaletteOption[];
  empty?: boolean;
}

const GENERAL: PaletteOption[] = [
  { id: 'opt-copy-link', label: PALETTE_COPY.actions.copyLink, action: 'copy-link' },
  { id: 'opt-email', label: PALETTE_COPY.actions.email, href: '/go/contato/email' },
];

const GO: PaletteOption[] = GO_TARGETS.map((target) => ({
  id: `opt-go-${target.key}`,
  label: target.label,
  href: target.path,
  keys: ['G', target.key.toUpperCase()],
}));

const ORDER: SearchKind[] = ['post', 'case', 'page', 'service', 'archive'];

const filter = (options: PaletteOption[], query: string) => options.filter((option) => scoreOf({ title: option.label }, query) > 0);

/** What the listbox shows for a query (REQ-007, REQ-008, REQ-009). */
export const viewFor = (index: readonly SearchItem[] | undefined, query: string): PaletteGroup[] => {
  if (query.trim() === '') {
    return [
      { label: PALETTE_COPY.groups.general, options: GENERAL },
      { label: PALETTE_COPY.groups.go, options: GO },
    ];
  }
  const groups: PaletteGroup[] = [
    { label: PALETTE_COPY.groups.general, options: filter(GENERAL, query) },
    { label: PALETTE_COPY.groups.go, options: filter(GO, query) },
    ...ORDER.map((kind) => ({
      label: PALETTE_COPY.groups[kind],
      options: (index ?? [])
        .filter((item) => item.kind === kind)
        .map((item) => ({ item, score: scoreOf(item, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }, at) => ({ id: `opt-${kind}-${at}`, label: item.title, href: item.path })),
    })),
  ].filter((group) => group.options.length > 0);
  if (groups.length > 0) return groups;
  return [{ label: PALETTE_COPY.empty, empty: true, options: [{ id: 'opt-contact', label: PALETTE_COPY.actions.contact, href: '/contato' }] }];
};

/** Next active index with wrap-around; -1 when the list is empty. */
export const move = (active: number, delta: number, count: number): number =>
  count === 0 ? -1 : (active + delta + count) % count;
```

**Passo 4:** PASS. **Passo 5:** `/git commit`

---

### Tarefa 7: Markup do diálogo no `BaseLayout`

**Requisito:** REQ-013, REQ-014, REQ-017
**Depende de:** Tarefa 1
**Arquivos:**
- Criar: `src/components/search/CommandPalette.astro`
- Modificar: `src/layouts/BaseLayout.astro` (antes de `<PointerField />`, ~linha 173)
- Teste: `tests/search/palette-markup.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CommandPalette from '../../src/components/search/CommandPalette.astro';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import Sobre from '../../src/pages/sobre.astro';

describe('CommandPalette markup', () => {
  it('is a labelled dialog with a combobox bound to a listbox and a live region', async () => {
    const html = await (await AstroContainer.create()).renderToString(CommandPalette);
    expect(html).toMatch(/<dialog[^>]*data-command-palette[^>]*aria-label="Buscar no site"/);
    expect(html).toMatch(/<input[^>]*role="combobox"[^>]*aria-controls="palette-list"[^>]*aria-expanded="true"/);
    expect(html).toMatch(/<ul[^>]*id="palette-list"[^>]*role="listbox"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toContain('placeholder="Digite um comando ou busque…"');
  });

  it('ships on the main site, never on the sales layout', async () => {
    const container = await AstroContainer.create();
    const site = await container.renderToString(Sobre, { request: new Request('https://nandomoreira.dev/sobre') });
    expect(site).toContain('data-command-palette');
    const sales = await container.renderToString(SalesLayout, {
      props: { title: 'x', description: 'y' },
      slots: { default: '<h1>x</h1>' },
      request: new Request('https://nandomoreira.dev/servicos'),
    });
    expect(sales).not.toContain('data-command-palette');
  });
});
```

**Passo 2:** FAIL: import não resolve.

**Passo 3: implementação mínima**

`src/components/search/CommandPalette.astro`:
```astro
---
import { PALETTE_COPY } from '../../lib/search/copy';
---

{/* Filled and opened by src/scripts/palette.ts, loaded on demand
    (docs/specs/command-palette, D1). Without JS it is never shown. */}
<dialog data-command-palette aria-label={PALETTE_COPY.label} class="palette">
  <div class="flex flex-col">
    <input
      type="text"
      role="combobox"
      aria-controls="palette-list"
      aria-expanded="true"
      aria-autocomplete="list"
      autocomplete="off"
      spellcheck="false"
      placeholder={PALETTE_COPY.placeholder}
      class="w-full border-b border-border bg-transparent px-lg py-md text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
    />
    <ul id="palette-list" role="listbox" aria-label={PALETTE_COPY.label} class="palette-list flex flex-col overflow-y-auto py-sm"></ul>
    <p aria-live="polite" class="sr-only" data-palette-status></p>
  </div>
</dialog>
```

`src/layouts/BaseLayout.astro`: importar `CommandPalette` e renderizar `<CommandPalette />` na linha anterior a `<PointerField />`, fora do ramo `view === 'ai'` se houver (a paleta vale para todas as páginas do site principal).

**Passo 4:** PASS. **Passo 5:** `/git commit`

---

### Tarefa 8: Estilo e transições do diálogo

**Requisito:** REQ-014, REQ-018 (D10)
**Depende de:** Tarefa 7
**Arquivos:**
- Modificar: `src/styles/global.css` (perto do bloco `.lightbox`, ~linhas 740-810)
- Teste: `tests/search/palette-style.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const block = css.slice(css.indexOf('/* Command palette'), css.indexOf('/* End command palette */'));

describe('palette style', () => {
  it('fades and scales in and out with the motion tokens, keeping the exit visible', () => {
    expect(block).toMatch(/\.palette\[open\]\s*\{[^}]*opacity:\s*1/);
    expect(block).toMatch(/@starting-style\s*\{\s*\.palette\[open\]/);
    expect(block).toMatch(/overlay var\(--duration-base\) allow-discrete/);
    expect(block).toMatch(/display var\(--duration-base\) allow-discrete/);
    expect(block).toMatch(/transform var\(--duration-base\) var\(--ease-out\)/);
    expect(block).toMatch(/\.palette::backdrop/);
  });

  it('drops the motion for reduced motion', () => {
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.palette/);
  });

  it('uses tokens only', () => {
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
```

**Passo 2:** FAIL: o bloco não existe.

**Passo 3: implementação mínima** (em `@layer components`, ao lado do lightbox)
```css
  /* Command palette (docs/specs/command-palette, REQ-018). A modal <dialog>:
     overlay and display are discrete, so allow-discrete keeps it in the top
     layer until the fade out ends, like the lightbox. */
  .palette {
    margin: 12dvh auto auto;
    padding: 0;
    width: min(36rem, 100% - 2 * var(--spacing-md));
    max-height: 70dvh;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-foreground);
    box-shadow: var(--shadow-window);
    overflow: hidden;
    opacity: 0;
    transform: scale(0.97);
    transition:
      opacity var(--duration-base) var(--ease-out),
      transform var(--duration-base) var(--ease-out),
      overlay var(--duration-base) allow-discrete,
      display var(--duration-base) allow-discrete;
  }

  .palette[open] {
    opacity: 1;
    transform: none;
  }

  @starting-style {
    .palette[open] {
      opacity: 0;
      transform: scale(0.97);
    }
  }

  .palette::backdrop {
    background: color-mix(in oklab, var(--color-background) 72%, transparent);
    backdrop-filter: blur(var(--blur-sm));
    opacity: 0;
    transition:
      opacity var(--duration-base) var(--ease-out),
      overlay var(--duration-base) allow-discrete,
      display var(--duration-base) allow-discrete;
  }

  .palette[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    .palette[open]::backdrop {
      opacity: 0;
    }
  }

  .palette-list {
    max-height: calc(70dvh - 4rem);
  }

  .palette-list [role='option'][aria-selected='true'] {
    background: var(--color-surface-elevated);
    color: var(--color-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    .palette,
    .palette::backdrop {
      transition: none;
    }
  }

  /* The hint is for keyboards: a touch screen opens the palette by the header button. */
  @media (hover: none) {
    [data-palette-hint] {
      display: none;
    }
  }
  /* End command palette */
```
`--shadow-window` e `--blur-sm` são os tokens que o lightbox e as janelas já usam; nunca valor avulso.

**Passo 4:** PASS, e `npx vitest run tests/design-system/no-ad-hoc-values.test.ts tests/design-system/contrast.test.ts` verde. **Passo 5:** `/git commit`

---

### Tarefa 9: Botão `⌘` no cabeçalho

**Requisito:** REQ-002, REQ-004, REQ-015 (D5)
**Depende de:** Tarefa 1
**Arquivos:**
- Criar: `src/components/search/PaletteTrigger.astro`
- Modificar: `src/components/layout/SiteHeader.astro:47` (ao lado do `AvailabilityPill` do cabeçalho)
- Teste: `tests/search/palette-trigger.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../../src/components/layout/SiteHeader.astro';

describe('palette trigger', () => {
  it('sits in the header, hidden until the script shows it, with an accessible name', async () => {
    const html = await (await AstroContainer.create()).renderToString(SiteHeader, { props: { availability: { status: 'open' } } });
    const button = html.match(/<button[^>]*data-palette-trigger[^>]*>/)?.[0] ?? '';
    expect(button).toContain('hidden');
    expect(button).toContain('type="button"');
    expect(button).toContain('aria-label="Abrir a busca"');
    expect(button).toContain('aria-haspopup="dialog"');
    expect(button).toMatch(/min-h-11/);
  });
});
```

**Passo 2:** FAIL: não há botão.

**Passo 3: implementação mínima**

`src/components/search/PaletteTrigger.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { PALETTE_COPY } from '../../lib/search/copy';
---

{/* Ships hidden: only the palette loader shows it (REQ-004). */}
<button
  type="button"
  hidden
  data-palette-trigger
  aria-label={PALETTE_COPY.trigger}
  aria-haspopup="dialog"
  class="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-border-strong text-foreground transition-[border-color,color] duration-(--duration-fast) ease-out hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  <Icon name="lucide:command" class="size-4" aria-hidden="true" />
</button>
```
Em `SiteHeader.astro`, logo depois do `AvailabilityPill` com `data-header-availability`: `<PaletteTrigger />`.

**Passo 4:** PASS; `npx vitest run tests/layout/site-header.test.ts` verde. **Passo 5:** `/git commit`

---

### Tarefa 10: Dica "Pressione Ctrl K" na home

**Requisito:** REQ-015, REQ-004
**Depende de:** Tarefas 1, 8
**Arquivos:**
- Modificar: `src/components/home/Hero.astro:26-28` (abaixo dos botões)
- Teste: `tests/search/palette-hint.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · test-reviewer, accessibility-guardrails

**Passo 1: teste que falha**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/home/Hero.astro';

describe('home palette hint', () => {
  it('ships hidden, opens the palette, shows the keys as kbd and never competes with the primary call', async () => {
    const html = await (await AstroContainer.create()).renderToString(Hero, { props: { name: 'F', headline: 'H', positioning: 'P' } });
    const hint = html.match(/<button[^>]*data-palette-hint[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
    expect(hint).toMatch(/\bhidden\b/);
    expect(hint).toContain('data-palette-trigger');
    expect(hint).toMatch(/<kbd[^>]*data-palette-mod[^>]*>Ctrl<\/kbd>/);
    expect(hint).toMatch(/<kbd[^>]*>K<\/kbd>/);
    expect(hint).not.toMatch(/(?<=["\s])bg-primary\b/);
  });
});
```

**Passo 2:** FAIL.

**Passo 3: implementação mínima** (depois do `div` dos botões do hero)
```astro
    <button
      type="button"
      hidden
      data-palette-trigger
      data-palette-hint
      aria-haspopup="dialog"
      class="inline-flex w-fit items-center gap-xs text-body text-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {PALETTE_COPY.hint.before}
      <kbd data-palette-mod class="rounded-md border border-border-strong bg-surface px-xs font-mono text-small">Ctrl</kbd>
      <kbd class="rounded-md border border-border-strong bg-surface px-xs font-mono text-small">K</kbd>
      {PALETTE_COPY.hint.after} <span aria-hidden="true">→</span>
    </button>
```
Importar `PALETTE_COPY` no frontmatter do `Hero.astro`.

**Passo 4:** PASS; `npx vitest run tests/home` verde (inclui `single-primary-cta.test.ts`). **Passo 5:** `/git commit`

---

### Tarefa 11: Portão de JavaScript aceita a paleta (só sob demanda)

**Requisito:** REQ-016 (D1)
**Arquivos:**
- Modificar: `tests/helpers/client-scripts.ts`
- Modificar: `tests/helpers/client-scripts.test.ts`
- Modificar: `tests/design-system/no-client-js.build-test.ts:96-104`

**Equipe:** infra · infra-engineer (bash-linux) · security-reviewer, consequences-reviewer

**Passo 1: teste que falha** (acrescentar em `tests/helpers/client-scripts.test.ts`)
```ts
import { PALETTE_BUDGET_BYTES, PALETTE_MARKER, paletteChunkViolations, scriptViolations } from './client-scripts';

describe('command palette exception', () => {
  it('refuses the palette as a script on the page itself', () => {
    expect(scriptViolations([{ route: '/', scripts: [`document.querySelector('[${PALETTE_MARKER}]')`] }])).toEqual([
      '/: script outside the allowlist',
    ]);
  });

  it('accepts an on-demand chunk within budget and refuses a bigger one', () => {
    expect(paletteChunkViolations([{ file: 'palette.js', body: `/*${PALETTE_MARKER}*/` }])).toEqual([]);
    const big = `${PALETTE_MARKER}${'x'.repeat(PALETTE_BUDGET_BYTES * 40)}${Math.random()}`.split('').sort(() => Math.random() - 0.5).join('');
    expect(paletteChunkViolations([{ file: 'palette.js', body: big }])[0]).toMatch(/palette\.js: command palette is \d+ B gzip, budget 4096/);
  });
});
```
Rodar e **ver vermelho** antes de implementar (portão novo precisa falhar primeiro).

**Passo 2:** `npx vitest run tests/helpers/client-scripts.test.ts` → FAIL: `PALETTE_MARKER` não exportado.

**Passo 3: implementação mínima** (em `tests/helpers/client-scripts.ts`)
```ts
/** Third named exception (docs/specs/command-palette, D1): an on-demand chunk, never a page script. */
export const PALETTE_MARKER = 'data-command-palette';
export const PALETTE_BUDGET_BYTES = 4096;

export const paletteChunkViolations = (chunks: Array<{ file: string; body: string }>): string[] =>
  chunks
    .filter(({ body }) => body.includes(PALETTE_MARKER))
    .flatMap(({ file, body }) => {
      const size = gzipSync(body).length;
      return size > PALETTE_BUDGET_BYTES ? [`${file}: command palette is ${size} B gzip, budget ${PALETTE_BUDGET_BYTES}`] : [];
    });
```
`scriptViolations` não muda: a paleta inline ou em `<script src>` da página já cai em "script outside the allowlist", porque não traz `POINTER_MARKER`. Conferir que o carregador do ponteiro não contém a string `data-command-palette` (só `data-palette-trigger`), senão ele seria lido como paleta.

Em `tests/design-system/no-client-js.build-test.ts`, no teste `leaves no stray script file`: aceitar `body.includes(PALETTE_MARKER)` e acrescentar:
```ts
  it('ships the command palette only as an on-demand chunk within budget', () => {
    const dir = join(CLIENT, '_astro');
    const chunks = readdirSync(dir).filter((file) => file.endsWith('.js')).map((file) => ({ file, body: readFileSync(join(dir, file), 'utf8') }));
    expect(chunks.some(({ body }) => body.includes(PALETTE_MARKER))).toBe(true);
    expect(paletteChunkViolations(chunks)).toEqual([]);
  });
```
Esse teste de build fica vermelho até a Tarefa 13 (não existe chunk ainda): é o esperado.

**Passo 4:** `npx vitest run tests/helpers/client-scripts.test.ts` → PASS. **Passo 5:** `/git commit`

---

### Tarefa 12: Módulo da paleta (DOM)

**Requisito:** REQ-001, REQ-003, REQ-006, REQ-008, REQ-010, REQ-011, REQ-013 (D11)
**Depende de:** Tarefas 5, 6, 7, 11
**Arquivos:**
- Criar: `src/scripts/palette.ts`
- Modificar: `package.json` (devDependency `happy-dom`)
- Teste: `tests/search/palette-module.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · type-safety-reviewer, test-reviewer, accessibility-guardrails, security-reviewer

**Passo 0:** `npm i -D happy-dom` e `npm audit --audit-level=high` (Lei de ferro 11). Sem vulnerabilidade alta ou crítica.

**Passo 1: teste que falha**
```ts
// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const markup = `
<button id="opener" data-palette-trigger>abrir</button>
<dialog data-command-palette aria-label="Buscar no site" class="palette">
  <input role="combobox" aria-controls="palette-list" aria-expanded="true" />
  <ul id="palette-list" role="listbox"></ul>
  <p aria-live="polite" data-palette-status></p>
</dialog>`;

const index = [{ kind: 'post', title: 'Meu homelab', path: '/homelab' }];

const load = async () => {
  vi.resetModules();
  return import('../../src/scripts/palette');
};

beforeEach(() => {
  document.body.innerHTML = markup;
  const dialog = document.querySelector('dialog')!;
  dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
  dialog.close = vi.fn(() => {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  });
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(index))) as never;
});

describe('palette module', () => {
  it('opens with the input focused and the empty-query groups', async () => {
    const palette = await load();
    await palette.open(document.getElementById('opener'));
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('input'));
    expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Copiar link');
  });

  it('fetches the index once and finds a post without accents', async () => {
    const palette = await load();
    await palette.open(null);
    await palette.open(null);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const input = document.querySelector('input')!;
    input.value = 'homelab';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Meu homelab');
    expect(document.querySelector('[data-palette-status]')!.textContent).toBe('1 resultado');
  });

  it('moves the active option with the arrows and sets aria-activedescendant', async () => {
    const palette = await load();
    await palette.open(null);
    const input = document.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const active = input.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)!.getAttribute('aria-selected')).toBe('true');
  });

  it('closes and gives the focus back to the opener', async () => {
    const palette = await load();
    const opener = document.getElementById('opener')!;
    await palette.open(opener);
    document.querySelector('dialog')!.close();
    expect(document.activeElement).toBe(opener);
  });

  it('keeps the actions when the index cannot be fetched', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline');
    }) as never;
    const palette = await load();
    await palette.open(null);
    expect(document.querySelector('[data-palette-status]')!.textContent).toContain('indisponível');
    const input = document.querySelector('input')!;
    input.value = 'blog';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Blog');
  });

  it('renders titles as text, never as HTML', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify([{ kind: 'post', title: '<img src=x onerror=alert(1)>', path: '/x' }]))) as never;
    const palette = await load();
    await palette.open(null);
    const input = document.querySelector('input')!;
    input.value = 'img';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[role="listbox"] img')).toBeNull();
  });

  it('navigates on G then a mapped letter', async () => {
    const palette = await load();
    const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
    palette.armGo(performance.now());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    expect(go).toHaveBeenCalledWith('/posts');
  });

  it('carries the gate marker in its own source', () => {
    expect(readFileSync('src/scripts/palette.ts', 'utf8')).toContain('data-command-palette');
  });
});
```

**Passo 2:** `npx vitest run tests/search/palette-module.test.ts` → FAIL: import não resolve.

**Passo 3: implementação mínima**
```ts
/**
 * The command palette (docs/specs/command-palette), loaded on demand by the
 * loader in PointerField.astro. Third named JS exception: this file must stay
 * under 4 KB gzip (tests/helpers/client-scripts.ts). Text only, never innerHTML.
 */
import type { SearchItem } from '../lib/search/build-index';
import { move, viewFor, type PaletteOption } from '../lib/search/controller';
import { PALETTE_COPY } from '../lib/search/copy';
import { goPathFor, isTypingTarget } from '../lib/search/go-sequence';

const dialog = document.querySelector<HTMLDialogElement>('[data-command-palette]')!;
const input = dialog.querySelector('input')!;
const list = dialog.querySelector<HTMLUListElement>('[role="listbox"]')!;
const status = dialog.querySelector<HTMLElement>('[data-palette-status]')!;

/** Indirection so the test can watch navigation. */
export const nav = { go: (href: string) => window.location.assign(href) };

let index: SearchItem[] | undefined;
let loading: Promise<void> | undefined;
let options: PaletteOption[] = [];
let active = -1;
let opener: HTMLElement | null = null;
let armedAt: number | undefined;

const loadIndex = () =>
  (loading ??= fetch('/search.json')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((items: SearchItem[]) => {
      index = items;
    })
    .catch(() => {
      status.textContent = PALETTE_COPY.unavailable;
    }));

const kbd = (key: string) => {
  const element = document.createElement('kbd');
  element.className = 'rounded-md border border-border-strong bg-background px-xs font-mono text-caption text-muted-foreground';
  element.textContent = key;
  return element;
};

const paint = () => {
  const groups = viewFor(index, input.value);
  options = groups.flatMap((group) => group.options);
  list.replaceChildren(
    ...groups.flatMap((group) => {
      const heading = document.createElement('li');
      heading.setAttribute('role', 'presentation');
      heading.className = 'px-lg pt-md pb-xs font-mono text-caption uppercase tracking-eyebrow text-muted-foreground';
      heading.textContent = group.label;
      return [
        heading,
        ...group.options.map((option) => {
          const item = document.createElement('li');
          item.id = option.id;
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', 'false');
          item.className = 'flex min-h-11 cursor-pointer items-center justify-between gap-md px-lg text-body text-muted-foreground';
          const label = document.createElement('span');
          label.textContent = option.label;
          const keys = document.createElement('span');
          keys.className = 'flex gap-xs';
          keys.append(...(option.keys ?? []).map(kbd));
          item.append(label, keys);
          item.addEventListener('click', () => choose(option));
          return item;
        }),
      ];
    }),
  );
  if (input.value.trim() && !groups[0]?.empty) status.textContent = PALETTE_COPY.results(options.length);
  setActive(options.length ? 0 : -1);
};

const setActive = (next: number) => {
  active = next;
  options.forEach((option, at) => document.getElementById(option.id)?.setAttribute('aria-selected', String(at === active)));
  const current = options[active];
  if (current) {
    input.setAttribute('aria-activedescendant', current.id);
    document.getElementById(current.id)?.scrollIntoView?.({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
};

const choose = (option: PaletteOption) => {
  if (option.action === 'copy-link') {
    void navigator.clipboard?.writeText(window.location.href);
    status.textContent = PALETTE_COPY.copied;
    dialog.close();
    return;
  }
  dialog.close();
  if (option.href) nav.go(option.href);
};

input.addEventListener('input', paint);
input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(move(active, event.key === 'ArrowDown' ? 1 : -1, options.length));
  } else if (event.key === 'Enter' && options[active]) {
    event.preventDefault();
    choose(options[active]);
  }
});
// A click on the backdrop lands on the dialog itself, outside the panel.
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  opener?.focus();
});

document.addEventListener('keydown', (event) => {
  const path = goPathFor({ armedAt, now: event.timeStamp || performance.now(), key: event.key });
  if (event.key.toLowerCase() !== 'g') armedAt = undefined;
  if (path && !isTypingTarget(event.target as HTMLElement | null)) {
    if (dialog.open) dialog.close();
    nav.go(path);
  }
});

/** Opens the palette (REQ-001, REQ-002); `from` gets the focus back on close. */
export const open = async (from: HTMLElement | null) => {
  opener = from;
  input.value = '';
  if (!dialog.open) dialog.showModal();
  input.focus();
  paint();
  await loadIndex();
  paint();
};

/** Called by the loader on a lone G (REQ-011). */
export const armGo = (at: number) => {
  armedAt = at;
};
```

**Passo 4:** `npx vitest run tests/search/palette-module.test.ts` → PASS. Se algum teste depender de `event.timeStamp` do happy-dom, usar `performance.now()` em ambos os lados. **Passo 5:** `/git commit`

---

### Tarefa 13: Carregador no script do `PointerField`

**Requisito:** REQ-001, REQ-002, REQ-004, REQ-011, REQ-012, REQ-015, REQ-016, REQ-017 (D2)
**Depende de:** Tarefas 9, 10, 11, 12
**Arquivos:**
- Modificar: `src/components/art/PointerField.astro` (no fim do `<script>`, antes do `const fine = ...`, ~linha 93)
- Teste: `tests/search/palette-loader.test.ts`

**Equipe:** frontend · frontend-engineer (frontend-design) · test-reviewer, accessibility-guardrails, consequences-reviewer

**Passo 1: teste que falha**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');
const loader = source.slice(source.indexOf('// Command palette loader'), source.indexOf('// End command palette loader'));

describe('palette loader in the site script', () => {
  it('only arms where a trigger exists, so the sales layout gets nothing', () => {
    expect(loader).toMatch(/querySelectorAll<HTMLElement>\('\[data-palette-trigger\]'\)/);
    expect(loader).toMatch(/if \(triggers\.length\)/);
  });

  it('imports the module on demand and never names the gate marker', () => {
    expect(loader).toMatch(/import\('\.\.\/\.\.\/scripts\/palette'\)/);
    expect(loader).not.toContain('data-command-palette');
  });

  it('opens on Ctrl or Cmd + K, arms G outside fields and swaps Ctrl for ⌘ on a Mac', () => {
    expect(loader).toMatch(/event\.ctrlKey \|\| event\.metaKey/);
    expect(loader).toMatch(/preventDefault\(\)/);
    expect(loader).toMatch(/armGo/);
    expect(loader).toMatch(/isContentEditable/);
    expect(loader).toMatch(/data-palette-mod/);
  });
});
```

**Passo 2:** FAIL: o trecho não existe.

**Passo 3: implementação mínima**
```ts
  // Command palette loader (docs/specs/command-palette, D2). The palette itself
  // is a separate chunk, fetched on the first Ctrl+K, click or G. Only pages
  // with a trigger (the main site) arm it, so the sales layout gets nothing.
  const triggers = document.querySelectorAll<HTMLElement>('[data-palette-trigger]');
  if (triggers.length) {
    const palette = () => import('../../scripts/palette');
    if (/Mac|iP/.test(navigator.platform)) document.querySelectorAll('[data-palette-mod]').forEach((key) => (key.textContent = '⌘'));
    triggers.forEach((trigger) => {
      trigger.hidden = false;
      trigger.addEventListener('click', () => palette().then((module) => module.open(trigger)));
    });
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        palette().then((module) => module.open(document.activeElement as HTMLElement));
      } else if (
        event.key === 'g' &&
        !event.ctrlKey && !event.metaKey && !event.altKey &&
        !target.isContentEditable && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      ) {
        const at = event.timeStamp;
        palette().then((module) => module.armGo(at));
      }
    });
  }
  // End command palette loader
```

**Passo 4:** PASS. Em seguida, `npm run build && npm run test:build`:
- `ships only the pointer effect...` verde: o ponteiro com o carregador continua ≤ 1536 B gzip.
- `ships the command palette only as an on-demand chunk within budget` verde (o chunk existe e tem ≤ 4096 B gzip).

Se o ponteiro passar de 1536 B: encurtar o carregador (por exemplo, mover a troca `Ctrl`→`⌘` para o módulo), **nunca** subir o orçamento. Se o Vite separar código compartilhado do módulo num segundo chunk sem a marca (`leaves no stray script file` vermelho), importar o necessário só a partir de `src/scripts/palette.ts` e nada de `src/lib/search` no script do ponteiro.

**Passo 5:** `/git commit`

---

### Tarefa 14: Registrar a exceção no `CLAUDE.md`

**Requisito:** REQ-016 (D1)
**Arquivos:**
- Modificar: `CLAUDE.md` (tabela "Portões automatizados" e "Restrições que não são preferência")

**Equipe:** docs · rpi-implementer · self-review

**Passo 1:** Na linha do portão de JavaScript, acrescentar "ou a paleta de comandos fora de um chunk sob demanda ou acima de 4 KB gzip". Na restrição "JavaScript de cliente só por exceção nomeada", acrescentar a terceira exceção: o módulo da paleta (command-palette, D1, 2026-10-19), em `src/scripts/palette.ts`, marcado por `data-command-palette`, baixado sob demanda pelo carregador do script do `PointerField`, até 4 KB gzip, nunca como `<script>` da página.

**Passo 2:** `grep -n "command-palette" CLAUDE.md` mostra as duas menções.

**Passo 3:** `/git commit`

---

### Tarefa 15: Verificação de ponta a ponta

**Requisito:** todos (critérios de sucesso)
**Arquivos:** nenhum novo.

**Equipe:** frontend · frontend-engineer · accessibility-guardrails, test-reviewer

1. `npm run verify` → verde, exceto `tests/design-system/code-contrast.test.ts`, que já falha antes desta feature.
2. Com `npm start` (build de produção), em Chromium headless ou no navegador:
   - `Ctrl+K` na home abre a paleta com fade e escala; `Esc` fecha com fade, e o foco volta.
   - Digitar `homelab` (sem acento, minúsculo) lista o post do homelab.
   - `G B` com a paleta fechada leva a `/posts`; digitar "gb" num campo do `/contato` não navega.
   - Com JavaScript desligado, nenhuma página mostra o botão `⌘` nem a dica.
   - `contrate.nandomoreira.local:4321/` não tem botão e `Ctrl+K` não faz nada.
   - Com "reduzir movimento" do sistema ligado, abre e fecha sem animação.
3. Leitor de tela (Orca): o campo anuncia "Buscar no site", as setas anunciam a opção ativa e a contagem de resultados é lida.
4. Atualizar `docs/specs/command-palette/STATE.md` com `phase: done` e a data.
