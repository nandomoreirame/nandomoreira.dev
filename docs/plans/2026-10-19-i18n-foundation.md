# Plano: i18n-foundation

> **Spec:** docs/specs/i18n-foundation/SPEC.md

**Objetivo:** versão inglesa do site sob `/en`, com slugs traduzidos, `hreflang`, dicionário de UI tipado, seletor e sugestão de idioma, SEO e visão IA em inglês, e o perfil traduzido. Tudo atrás da bandeira `EN_LIVE`.
**Arquitetura:** funções puras em `src/lib/i18n/` (idioma pelo caminho, mapa de rotas, alternados, bandeira, dicionário). As páginas humanas viram componentes em `src/components/pages/` que recebem `locale`, e as rotas pt-BR e en são cascas. A camada de acesso ganha o parâmetro `locale`. Posts e cases ingleses ainda devolvem vazio, porque o modelo de sobreposição chega na `i18n-content`.
**Stack:** Astro 7.2 SSR, Zod 4, Tailwind 4, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 35, em 6 lotes (a 14b entrou na revisão de 2026-10-23).
**Complexidade estimada:** large.
**Depende de:** nada.
**Features irmãs:** `i18n-content` (depende desta) e `i18n-sales` (depende desta).

## Revisão de 2026-10-23

O plano de 2026-10-19 vale. Esta revisão cobre o que o código ganhou depois, para o implementador não seguir instrução vencida.

- O aviso de árvore suja em `src/middleware.ts` e `src/lib/analytics/measure.ts` caducou: isso já está commitado. O rascunho de gitflow que estava modificado em 2026-10-23 foi descartado. A tradução usa o arquivo commitado.
- Se `shadcn-ui` for implementado ao mesmo tempo, os dois mexem em `src/pages/contato.astro`, `src/pages/curriculo.astro` e `src/components/sales/SalesContact.astro`. Esta fundação vem primeiro.
- Orçamento do script: REQ-020 e D13. A tarefa 14 mede o build. O teto sobe de 2304 para no máximo 2560 só se a sugestão não couber.
- Tema, paleta, Giscus e a grade do blog entram nas tarefas 13, 14b e 26 (REQ-024, REQ-025, REQ-026).
- `/releases` e `/releases/17` ficam de fora (D14). O teste da tarefa 3 precisa provar que não têm par.


## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho.
- Nenhum hex fora do `@theme`, nenhum valor arbitrário `[...]`, nenhum `<script>` novo: a sugestão de idioma entra no script do `PointerField` (D9, D13).
- O portão do script do ponteiro é `POINTER_BUDGET_BYTES` em `tests/helpers/client-scripts.ts` (2304). O texto antigo de 1,5 KB não vale. Não crie outro `<script>`.
- **Toda string de interface sai do dicionário** (`src/lib/i18n/messages/`). Chave nova vai nos dois arquivos, e o tipo `Messages` reprova a que faltar.
- **Como traduzir o texto de interface:** inglês americano, frases curtas e diretas na primeira pessoa (é o site do Fernando), sem travessão e sem meia-risca. Nomes próprios, de produto e de comando ficam intocados, e nenhum número muda. Os rótulos da navegação são `Blog`, `Portfolio`, `Lab`, `Setup`, `Now`, `About`, `MCP` e `Contact`.
- **Pares pt e en não se misturam numa string só:** cada idioma tem a frase inteira, sem concatenar pedaços traduzidos.
- `locale` é sempre o último parâmetro opcional, com padrão `'pt-BR'`, para que nenhum chamador pt-BR precise mudar e a suíte atual continue verde sem edição.
- No fim de cada tarefa: o teste da tarefa verde, `npm test` sem falha nova e `npm run check` sem erro novo. Antes de mexer em schema, confira se há dev server (`./node_modules/.bin/astro dev status`; veja as armadilhas do `CLAUDE.md`).

## Lotes

| Lote | Tarefas | Depende de |
|---|---|---|
| A. Núcleo i18n | 1 a 7 | — |
| B. Conteúdo | 8 a 10 | A |
| C. Layout e navegação | 11 a 14b | A, B |
| D. Páginas | 15 a 27 | C |
| E. SEO e máquina | 28 a 32 | D |
| F. Documentação e verificação | 33 e 34 | E |

---

## Lote A: núcleo i18n

### Tarefa 1: idioma pelo caminho

**Requisito:** REQ-001
**Arquivos:**
- Criar: `src/lib/i18n/locale.ts`
- Teste: `tests/i18n/locale.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  htmlLang,
  localeOfPath,
  ogLocale,
  stripLocale,
  withLocale,
} from '../../src/lib/i18n/locale';

describe('localeOfPath', () => {
  it.each([
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/en/about', 'en'],
    ['/en/portfolio/forja', 'en'],
    ['/', 'pt-BR'],
    ['/sobre', 'pt-BR'],
    ['/english-post', 'pt-BR'],
    ['/enxame', 'pt-BR'],
    ['/posts/en', 'pt-BR'],
  ])('%s is %s', (path, locale) => {
    expect(localeOfPath(path)).toBe(locale);
  });
});

describe('stripLocale', () => {
  it('drops the /en prefix and keeps the root', () => {
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/en/about')).toBe('/about');
    expect(stripLocale('/sobre')).toBe('/sobre');
  });
});

describe('withLocale', () => {
  it('prefixes only English paths', () => {
    expect(withLocale('/', 'en')).toBe('/en');
    expect(withLocale('/about', 'en')).toBe('/en/about');
    expect(withLocale('/sobre', 'pt-BR')).toBe('/sobre');
  });

  it('never doubles the prefix', () => {
    expect(withLocale('/en/about', 'en')).toBe('/en/about');
  });
});

describe('constants', () => {
  it('pt-BR is the default and comes first', () => {
    expect(DEFAULT_LOCALE).toBe('pt-BR');
    expect(LOCALES).toEqual(['pt-BR', 'en']);
  });

  it('maps html lang and og:locale', () => {
    expect(htmlLang('pt-BR')).toBe('pt-BR');
    expect(htmlLang('en')).toBe('en');
    expect(ogLocale('pt-BR')).toBe('pt_BR');
    expect(ogLocale('en')).toBe('en_US');
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/locale.test.ts`. Esperado: FAIL (módulo inexistente).

**Passo 3: implementação.**

```ts
/**
 * The site's languages (i18n-foundation). pt-BR lives at the root, unchanged;
 * English lives under /en with translated slugs (D1, D2). Astro's built-in
 * i18n routing is not used: it assumes the same path in every language (D4).
 */
export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-BR';

const EN_PREFIX = '/en';

/** REQ-001: exactly /en, or anything under /en/, is English. */
export const localeOfPath = (path: string): Locale =>
  path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`) ? 'en' : 'pt-BR';

/** The path without its locale prefix; the English root becomes '/'. */
export const stripLocale = (path: string): string => {
  if (localeOfPath(path) !== 'en') return path;
  const rest = path.slice(EN_PREFIX.length).replace(/\/+$/, '');
  return rest === '' ? '/' : rest;
};

/** Root-relative path of `path` in `locale`. Idempotent. */
export const withLocale = (path: string, locale: Locale): string => {
  if (locale === 'pt-BR') return path;
  if (localeOfPath(path) === 'en') return path;
  return path === '/' ? EN_PREFIX : `${EN_PREFIX}${path}`;
};

export const htmlLang = (locale: Locale): string => locale;

/** Open Graph wants an underscore and a region. */
export const ogLocale = (locale: Locale): string => (locale === 'en' ? 'en_US' : 'pt_BR');
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 2: bandeira `EN_LIVE`

**Requisito:** REQ-005
**Arquivos:**
- Criar: `src/lib/i18n/live.ts`
- Teste: `tests/i18n/live.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { EN_LIVE, enLive } from '../../src/lib/i18n/live';

describe('enLive', () => {
  it('is off in production until the flag flips', () => {
    expect(enLive({ DEV: false, MODE: 'production' }, false)).toBe(false);
    expect(enLive({ DEV: false, MODE: 'production' }, true)).toBe(true);
  });

  it('is always on in astro dev and in the staging build', () => {
    expect(enLive({ DEV: true, MODE: 'development' }, false)).toBe(true);
    expect(enLive({ DEV: false, MODE: 'staging' }, false)).toBe(true);
  });

  it('follows the flag under Vitest, so the suite checks what production serves', () => {
    expect(enLive({ DEV: false, MODE: 'test' }, false)).toBe(false);
  });

  it('ships off: i18n-content flips it (C7)', () => {
    expect(EN_LIVE).toBe(false);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/live.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

```ts
/**
 * Whether the /en pages are published (D8). Off until i18n-content has
 * translated the catalog and the blog: a push to main publishes on its own, and
 * an /en with an empty portfolio would go live. Dev and the homelab staging
 * build always show /en, like drafts (showDrafts in src/lib/content/posts.ts).
 * Flipping it back to false is the rollback.
 */
export const EN_LIVE = false;

export const enLive = (env: { DEV: boolean; MODE: string }, flag: boolean = EN_LIVE): boolean =>
  flag || (env.DEV && env.MODE === 'development') || env.MODE === 'staging';

/** The value for this build. */
export const EN_PUBLISHED = enLive(import.meta.env);
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 3: mapa de rotas estáticas

**Requisito:** REQ-003, REQ-004, D12
**Arquivos:**
- Criar: `src/lib/i18n/routes.ts`
- Teste: `tests/i18n/routes.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, staticCounterpart } from '../../src/lib/i18n/routes';

describe('STATIC_ROUTES', () => {
  it('pairs every human page of the spec route map', () => {
    expect(STATIC_ROUTES).toEqual([
      { 'pt-BR': '/', en: '/en' },
      { 'pt-BR': '/portfolio', en: '/en/portfolio' },
      { 'pt-BR': '/lab', en: '/en/lab' },
      { 'pt-BR': '/posts', en: '/en/posts' },
      { 'pt-BR': '/sobre', en: '/en/about' },
      { 'pt-BR': '/contato', en: '/en/contact' },
      { 'pt-BR': '/curriculo', en: '/en/resume' },
      { 'pt-BR': '/mcp', en: '/en/mcp' },
      { 'pt-BR': '/setup', en: '/en/setup' },
      { 'pt-BR': '/now', en: '/en/now' },
      { 'pt-BR': '/privacidade', en: '/en/privacy' },
    ]);
  });

  it('has no duplicate path on either side', () => {
    const pt = STATIC_ROUTES.map((route) => route['pt-BR']);
    const en = STATIC_ROUTES.map((route) => route.en);
    expect(new Set(pt).size).toBe(pt.length);
    expect(new Set(en).size).toBe(en.length);
  });
});

describe('staticCounterpart', () => {
  it('maps both ways', () => {
    expect(staticCounterpart('/sobre')).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
    expect(staticCounterpart('/en/about')).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
  });

  it('has no pair for the archive (D12), the releases (D14) or unknown paths', () => {
    expect(staticCounterpart('/posts/arquivo')).toBeUndefined();
    expect(staticCounterpart('/posts/arquivo/2017')).toBeUndefined();
    expect(staticCounterpart('/releases')).toBeUndefined();
    expect(staticCounterpart('/releases/17')).toBeUndefined();
    expect(staticCounterpart('/en/nope')).toBeUndefined();
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/routes.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

```ts
import type { Locale } from './locale';

export type RoutePair = Record<Locale, string>;

/**
 * Human pages that exist in both languages (spec route map). Content pages
 * (cases, posts) pair through their translations, in src/lib/i18n/alternates.ts.
 * The archive has no English side (D12). /releases and /releases/17 neither (D14).
 * The sales pages are i18n-sales.
 */
export const STATIC_ROUTES: readonly RoutePair[] = [
  { 'pt-BR': '/', en: '/en' },
  { 'pt-BR': '/portfolio', en: '/en/portfolio' },
  { 'pt-BR': '/lab', en: '/en/lab' },
  { 'pt-BR': '/posts', en: '/en/posts' },
  { 'pt-BR': '/sobre', en: '/en/about' },
  { 'pt-BR': '/contato', en: '/en/contact' },
  { 'pt-BR': '/curriculo', en: '/en/resume' },
  { 'pt-BR': '/mcp', en: '/en/mcp' },
  { 'pt-BR': '/setup', en: '/en/setup' },
  { 'pt-BR': '/now', en: '/en/now' },
  { 'pt-BR': '/privacidade', en: '/en/privacy' },
];

export const staticCounterpart = (path: string): RoutePair | undefined =>
  STATIC_ROUTES.find((route) => route['pt-BR'] === path || route.en === path);

/** The path of a static page in `locale`, from its pt-BR path. Throws on a typo. */
export const routeFor = (ptPath: string, locale: Locale): string => {
  const pair = STATIC_ROUTES.find((route) => route['pt-BR'] === ptPath);
  if (!pair) throw new Error(`No static route for ${ptPath}`);
  return pair[locale];
};
```

Acrescente ao teste, no mesmo passo 1, a cobertura do `routeFor`:

```ts
import { routeFor } from '../../src/lib/i18n/routes';

describe('routeFor', () => {
  it('returns the localized path and throws on an unknown one', () => {
    expect(routeFor('/contato', 'en')).toBe('/en/contact');
    expect(routeFor('/contato', 'pt-BR')).toBe('/contato');
    expect(() => routeFor('/contatos', 'en')).toThrow(/No static route/);
  });
});
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 4: dicionário tipado

**Requisito:** REQ-007, REQ-008
**Arquivos:**
- Criar: `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`, `src/lib/i18n/messages/index.ts`
- Criar: `tests/helpers/pt-leftovers.ts`
- Teste: `tests/i18n/messages.test.ts`, `tests/helpers/pt-leftovers.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer

**Passo 1: testes que falham.**

`tests/i18n/messages.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { en } from '../../src/lib/i18n/messages/en';
import { messagesFor } from '../../src/lib/i18n/messages';
import { ptBR } from '../../src/lib/i18n/messages/pt-BR';

/** Every leaf path of a nested object, e.g. "nav.blog". */
const leaves = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

const values = (value: unknown): unknown[] =>
  typeof value === 'object' && value !== null ? Object.values(value).flatMap(values) : [value];

describe('messages', () => {
  it('has the same keys in both languages (REQ-007)', () => {
    expect(leaves(en).sort()).toEqual(leaves(ptBR).sort());
  });

  it('has no empty string', () => {
    for (const text of [...values(ptBR), ...values(en)]) {
      expect(typeof text === 'string' ? text.trim() : 'fn').not.toBe('');
    }
  });

  it('uses no em dash or en dash in either language', () => {
    for (const text of [...values(ptBR), ...values(en)]) {
      if (typeof text === 'string') expect(text).not.toMatch(/[–—]/);
    }
  });

  it('resolves by locale', () => {
    expect(messagesFor('pt-BR')).toBe(ptBR);
    expect(messagesFor('en')).toBe(en);
  });

  it('proves the parity check can fail', () => {
    expect(leaves({ a: { b: 'x' } })).not.toEqual(leaves({ a: { c: 'x' } }));
  });
});
```

`tests/helpers/pt-leftovers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ptLeftovers } from './pt-leftovers';

describe('ptLeftovers', () => {
  it('finds Portuguese words in visible text', () => {
    expect(ptLeftovers('<p>Ver todos os posts</p><p>Não sei</p>')).toEqual(expect.arrayContaining(['todos', 'não']));
  });

  it('ignores tags, attributes, scripts, styles and code', () => {
    const html =
      '<a href="/sobre" title="não">About</a><script>const você = 1</script><style>.não{}</style><code>para</code><pre>com</pre>';
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('ignores the allowlisted proper names', () => {
    expect(ptLeftovers('<p>Fernando Moreira Costa lives in São Paulo</p>')).toEqual([]);
  });

  it('passes clean English', () => {
    expect(ptLeftovers('<p>See all posts in the blog</p>')).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/messages.test.ts tests/helpers/pt-leftovers.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/lib/i18n/messages/pt-BR.ts` (a fonte; as tarefas seguintes acrescentam seções):

```ts
/**
 * Interface copy in pt-BR, the source language (D5). en.ts must have the same
 * shape: a missing key fails `npm run check` and tests/i18n/messages.test.ts.
 */
export const ptBR = {
  layout: {
    skipToContent: 'Pular para o conteúdo',
    rssTitle: 'Blog de Fernando Moreira',
  },
  language: {
    /** Name of each language written in itself, for the switcher. */
    names: { 'pt-BR': 'Português', en: 'English' },
    switchTo: 'Ler em português',
    suggestion: 'Esta página também existe em português.',
    suggestionLink: 'Ler em português',
    dismiss: 'Dispensar',
  },
} as const;
```

`src/lib/i18n/messages/en.ts`:

```ts
import type { Messages } from './index';

export const en: Messages = {
  layout: {
    skipToContent: 'Skip to content',
    rssTitle: "Fernando Moreira's blog",
  },
  language: {
    names: { 'pt-BR': 'Português', en: 'English' },
    switchTo: 'Read in English',
    suggestion: 'This page is also available in English.',
    suggestionLink: 'Read in English',
    dismiss: 'Dismiss',
  },
};
```

Note que `switchTo` e `suggestion` estão **no idioma de destino** do link: a cópia pt-BR convida a ler em português e aparece numa página inglesa, e vice-versa. O seletor (tarefa 12) e o aviso (tarefa 14) leem as mensagens do idioma de destino, nunca do idioma da página.

`src/lib/i18n/messages/index.ts`:

```ts
import type { Locale } from '../locale';
import { en } from './en';
import { ptBR } from './pt-BR';

/** Same shape as the source, with every literal widened to string. */
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends (...args: infer A) => infer R ? (...args: A) => R : Shape<T[K]> };

export type Messages = Shape<typeof ptBR>;

const BY_LOCALE: Record<Locale, Messages> = { 'pt-BR': ptBR, en };

export const messagesFor = (locale: Locale): Messages => BY_LOCALE[locale];
```

`tests/helpers/pt-leftovers.ts`:

```ts
/**
 * Portuguese words left in what should be English (REQ-008 of the foundation,
 * REQ-009 of i18n-content). Reads only visible text: tags, attributes, script,
 * style, code and pre are dropped first. A word list rather than language
 * detection, so a failure always names the word.
 */
const MARKERS = [
  'não', 'você', 'também', 'então', 'porque', 'isso', 'está', 'são', 'já', 'mas', 'quando',
  'para', 'com', 'todos', 'ver', 'sobre', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma', 'seu', 'sua',
  'leitura', 'contato', 'projetos', 'agora', 'arquivo', 'rascunho', 'próximo', 'anterior', 'página',
];

/** Proper names that legitimately carry those words. */
const ALLOWED = [/São Paulo/g, /Fernando Moreira Costa/g, /Embu das Artes/g, /Ateliê Eh Pique/gi, /Encantos Brincantes/gi, /Seu Ateliê Aqui/gi];

export const visibleText = (html: string): string => {
  let text = html
    .replace(/<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
  for (const name of ALLOWED) text = text.replace(name, ' ');
  return text;
};

export const ptLeftovers = (html: string): string[] => {
  const words = visibleText(html).toLowerCase().split(/[^\p{L}]+/u);
  return [...new Set(words.filter((word) => MARKERS.includes(word)))];
};
```

**Passo 4:** mesmo comando do passo 2. Esperado: PASS. Rode também `npm run check` e confirme que apagar uma chave de `en.ts` gera erro de tipo (prova do portão; desfaça em seguida).

**Passo 5:** `/git commit`.

---

### Tarefa 5: datas por idioma

**Requisito:** REQ-009
**Arquivos:**
- Modificar: `src/lib/format/date.ts`
- Teste: `tests/format/date-locale.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { toLongDate, toShortDate } from '../../src/lib/format/date';

describe('dates by locale', () => {
  it('keeps pt-BR as the default', () => {
    expect(toLongDate('2026-10-11')).toBe('11 de outubro de 2026');
    expect(toShortDate('2026-10-16')).toBe('16 out. 2026');
  });

  it('formats English', () => {
    expect(toLongDate('2026-10-11', 'en')).toBe('October 11, 2026');
    expect(toShortDate('2026-10-16', 'en')).toBe('16 Oct 2026');
    expect(toShortDate('2026-05-01', 'en')).toBe('01 May 2026');
  });

  it('never moves the day across a timezone', () => {
    expect(toLongDate('2026-01-01', 'en')).toBe('January 1, 2026');
  });
});
```

**Passo 2:** `npx vitest run tests/format/date-locale.test.ts`. Esperado: FAIL (`toLongDate` ignora o segundo argumento).

**Passo 3: implementação.** Em `src/lib/format/date.ts`: importe `import type { Locale } from '../i18n/locale';`. Mude a assinatura para `toLongDate = (iso: string, locale: Locale = 'pt-BR')` e passe `locale` ao `Intl.DateTimeFormat` no lugar do literal `'pt-BR'`. No `toShortDate`, acrescente:

```ts
const SHORT_MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
```

troque a assinatura para `toShortDate = (iso: string, locale: Locale = 'pt-BR')` e o retorno para:

```ts
  const months = locale === 'en' ? SHORT_MONTHS_EN : SHORT_MONTHS;
  return `${day} ${months[Number(month) - 1]} ${year}`;
```

**Passo 4:** `npx vitest run tests/format`. Esperado: PASS (inclusive os testes antigos de data).

**Passo 5:** `/git commit`.

---

### Tarefa 6: anos de carreira e tempo de leitura por idioma

**Requisito:** REQ-010, REQ-003
**Arquivos:**
- Modificar: `src/lib/format/career-years.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/format/career-years-locale.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { careerYearsLabel, withCareerYears } from '../../src/lib/format/career-years';
import { messagesFor } from '../../src/lib/i18n/messages';

const at = new Date('2026-10-19T12:00:00Z');

describe('career years by locale', () => {
  it('keeps the pt-BR label', () => {
    expect(careerYearsLabel(at)).toBe('+15 anos');
    expect(withCareerYears('há {anos}', at)).toBe('há +15 anos');
  });

  it('writes the English label', () => {
    expect(careerYearsLabel(at, 'en')).toBe('15+ years');
    expect(withCareerYears('{anos} of work', at, 'en')).toBe('15+ years of work');
  });
});

describe('reading time label', () => {
  it('reads in both languages', () => {
    expect(messagesFor('pt-BR').posts.readingTime(7)).toBe('7 min de leitura');
    expect(messagesFor('en').posts.readingTime(7)).toBe('7 min read');
  });
});
```

**Passo 2:** `npx vitest run tests/format/career-years-locale.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em `career-years.ts`:

```ts
import type { Locale } from '../i18n/locale';

export const careerYearsLabel = (now?: Date, locale: Locale = 'pt-BR'): string =>
  locale === 'en' ? `${careerYears(now)}+ years` : `+${careerYears(now)} anos`;

/** Replaces every {anos} marker in a text with the label. */
export const withCareerYears = (text: string, now?: Date, locale: Locale = 'pt-BR'): string =>
  text.replaceAll('{anos}', careerYearsLabel(now, locale));
```

No dicionário, acrescente a seção `posts` (crescerá na tarefa 26):

```ts
  // pt-BR.ts
  posts: {
    readingTime: (minutes: number) => `${minutes} min de leitura`,
  },
```

```ts
  // en.ts
  posts: {
    readingTime: (minutes: number) => `${minutes} min read`,
  },
```

**Passo 4:** `npx vitest run tests/format tests/i18n`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 7: slug `en` reservado

**Requisito:** REQ-006
**Arquivos:**
- Modificar: `src/content/schemas/post.ts`, `src/content/schemas/project.ts`
- Teste: `tests/content/reserved-slug.test.ts`

**Time:**
- Track: data
- Implementer: backend-engineer
- Reviewers: consequences-reviewer, business-logic-reviewer

**Passo 1: teste que falha.** Acrescente ao arquivo existente:

```ts
describe('the en slug', () => {
  it('is reserved for posts', () => {
    const result = post.safeParse({ ...postBase, slug: 'en' });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/reserved/);
  });

  it('is reserved for cases', () => {
    const result = projectSchema.safeParse({ ...projectBase, slug: 'en' });
    expect(result.success).toBe(false);
  });

  it('still accepts a slug that merely starts with en', () => {
    expect(post.safeParse({ ...postBase, slug: 'enxame' }).success).toBe(true);
  });
});
```

**Passo 2:** `npx vitest run tests/content/reserved-slug.test.ts`. Esperado: FAIL nos dois primeiros.

**Passo 3: implementação.** No `post.ts`, troque o `refine` do `ia` por um que cubra os dois:

```ts
    .refine((post) => !RESERVED_SLUGS.includes(post.slug), {
      message:
        'slug is reserved: "ia" is the AI view of a page and "en" is the English site root, so a post cannot claim either',
      path: ['slug'],
    });
```

com `const RESERVED_SLUGS = ['ia', 'en'];` no topo do arquivo. No `project.ts`, acrescente o mesmo `refine` (com a mensagem dizendo "a case") ao fim da cadeia, ou estenda o refine de `ia` se ele já existir lá.

**Passo 4:** `npx vitest run tests/content`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Lote B: conteúdo

### Tarefa 8: perfil inglês com paridade

**Requisito:** REQ-021, REQ-022, REQ-023, D10, D11
**Arquivos:**
- Criar: `src/content/profile-en/profile.md`
- Modificar: `src/content.config.ts`, `src/lib/content/profile.ts`
- Teste: `tests/i18n/profile-parity.test.ts`, `tests/content/profile-access.test.ts`

**Time:**
- Track: data
- Implementer: backend-engineer
- Reviewers: consequences-reviewer, business-logic-reviewer, test-reviewer

**Passo 1: testes que falham.**

`tests/i18n/profile-parity.test.ts` lê pela camada de acesso, como os outros testes que tocam coleção (o frontmatter do perfil é YAML aninhado, e o projeto não tem parser YAML como dependência direta; não acrescente um):

```ts
import { describe, expect, it } from 'vitest';
import type { Profile } from '../../src/content/schemas/profile';
import { getProfile } from '../../src/lib/content/profile';

/** The structure that must never drift between the two languages (REQ-021). */
const profileStructure = (profile: Profile) => ({
  name: profile.name,
  wordmark: profile.wordmark,
  contacts: profile.contacts,
  stack: profile.stack,
  availability: { status: profile.availability.status, updatedAt: profile.availability.updatedAt },
  services: profile.services.map((service) => service.caseSlug),
  trajectory: profile.trajectory.length,
  work: (profile.work ?? []).map(({ name, url, startDate, endDate }) => ({ name, url, startDate, endDate })),
  education: (profile.education ?? []).map(({ institution, url, startDate, endDate }) => ({ institution, url, startDate, endDate })),
});

describe('English profile', async () => {
  const [pt, en] = await Promise.all([getProfile('pt-BR'), getProfile('en')]);

  it('matches the pt-BR structure (REQ-021, REQ-022)', () => {
    expect(profileStructure(en)).toEqual(profileStructure(pt));
  });

  it('is actually translated', () => {
    expect(en.headline).not.toBe(pt.headline);
    expect(en.bio).not.toBe(pt.bio);
    expect(en.availability.detail).not.toBe(pt.availability.detail);
  });

  it('has no dash in its prose', () => {
    expect(JSON.stringify(en)).not.toMatch(/[\u2013\u2014]/);
  });
});
```

Coleção nova exige reiniciar o dev server antes de rodar a suíte (o `.astro/data-store.json` só registra a coleção no shutdown; veja as armadilhas do `CLAUDE.md`).

Em `tests/content/profile-access.test.ts`, acrescente:

```ts
import { getProfile } from '../../src/lib/content/profile';

it('serves the English profile with the English career label', async () => {
  const profile = await getProfile('en');
  expect(profile.bio).not.toContain('{anos}');
  expect(profile.bio).not.toMatch(/\+\d+ anos/);
});
```

**Passo 2:** `npx vitest run tests/i18n/profile-parity.test.ts tests/content/profile-access.test.ts`. Esperado: FAIL (arquivo e coleção inexistentes).

**Passo 3: implementação.**

1. Pare o dev server se houver (`./node_modules/.bin/astro dev stop`).
2. `src/content.config.ts`: acrescente a coleção e exporte-a:

```ts
const profileEn = defineCollection({
  loader: glob({ base: './src/content/profile-en', pattern: '**/*.md' }),
  schema: profileSchema,
});

export const collections = { projects, posts, profile, profileEn };
```

3. `src/lib/content/profile.ts`: `getProfile(locale: Locale = 'pt-BR')` lê `getCollection(locale === 'en' ? 'profileEn' : 'profile')`, mantém o erro de "exactly one" e aplica `applyCareerYears(entry, undefined, locale)`; estenda `applyCareerYears` com o parâmetro `locale` repassado a cada `withCareerYears`. `getAvailability(locale)` idem.
4. `src/content/profile-en/profile.md`: copie `src/content/profile/profile.md` e traduza **só** os campos de texto (`headline`, `bio`, `positioning`, `trajectory[].label/context` e `value` quando tiver palavra, `services[].title/description`, `availability.detail`, `work[].position/summary/highlights`, `education[].area/studyType`). Contatos, datas, URLs, `stack`, `caseSlug`, `status` e nomes de empresa ficam idênticos. Mantenha `{anos}` onde estiver. Siga as regras de tradução do topo deste plano.

**Passo 4:** mesmo comando do passo 2, e `npx vitest run tests/content`. Esperado: PASS. A paridade fica vermelha se você mudar uma data só no pt-BR (prove e desfaça).

**Passo 5:** `/git commit`.

---

### Tarefa 9: camada de acesso com `locale`

**Requisito:** REQ-023
**Arquivos:**
- Modificar: `src/lib/content/posts.ts`, `src/lib/content/projects.ts`, `src/lib/content/index.ts`
- Teste: `tests/i18n/access-locale.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import {
  getAllPosts,
  getAllProjects,
  getCurrentPosts,
  getPost,
  getProject,
  translationPairs,
} from '../../src/lib/content';

describe('access layer by locale', () => {
  it('keeps pt-BR as the default', async () => {
    expect((await getAllPosts()).length).toBeGreaterThan(0);
    expect((await getAllProjects()).length).toBe(26);
  });

  it('serves no English post or case before i18n-content', async () => {
    expect(await getAllPosts('en')).toEqual([]);
    expect(await getCurrentPosts('en')).toEqual([]);
    expect(await getAllProjects('en')).toEqual([]);
    expect(await getPost('o-falso-verde', 'en')).toBeUndefined();
    expect(await getProject('forja', 'en')).toBeUndefined();
  });

  it('has no translation pair yet', async () => {
    expect(await translationPairs()).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/access-locale.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em cada função pública de `posts.ts` e `projects.ts` (`getAllPosts`, `getAllPostEntries`, `getCurrentPosts`, `getArchivedPosts`, `getUpcomingPosts`, `getPost`, `getPostEntry`, `getAllProjects`, `getFeaturedProjects`, `getProjectsByBlock`, `getProject`), acrescente `locale: Locale = 'pt-BR'` como último parâmetro e, no topo do corpo, `if (locale === 'en') return [];` (ou `undefined` nas que devolvem um item; `getProjectsByBlock` devolve os blocos vazios via `groupByBlock([])`). O arquivo e as funções de ano do arquivo não ganham `locale` (D12).

Crie, em `posts.ts`:

```ts
/** A page that exists in both languages: [pt-BR path, en path]. */
export type TranslationPair = { 'pt-BR': string; en: string };

/**
 * Content pages paired through their translations (posts and cases). Empty
 * until i18n-content adds the English collections; alternates.ts reads it.
 */
export const translationPairs = async (): Promise<TranslationPair[]> => [];
```

e exporte `translationPairs` e `TranslationPair` pelo `index.ts`. O comentário `// i18n-content replaces these early returns with the overlay` acompanha cada `if (locale === 'en')`.

**Passo 4:** `npx vitest run tests/i18n tests/content`. Esperado: PASS, e o `single-source.test.ts` continua verde.

**Passo 5:** `/git commit`.

---

### Tarefa 10: alternados de uma página

**Requisito:** REQ-004, REQ-005, REQ-011
**Arquivos:**
- Criar: `src/lib/i18n/alternates.ts`
- Teste: `tests/i18n/alternates.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { alternatesFrom } from '../../src/lib/i18n/alternates';

const pairs = [{ 'pt-BR': '/o-falso-verde', en: '/en/the-false-green' }];

describe('alternatesFrom', () => {
  it('pairs a static page both ways when English is live', () => {
    expect(alternatesFrom('/sobre', pairs, true)).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
    expect(alternatesFrom('/en/about', pairs, true)).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
  });

  it('pairs content through its translation', () => {
    expect(alternatesFrom('/en/the-false-green', pairs, true)).toEqual(pairs[0]);
    expect(alternatesFrom('/o-falso-verde', pairs, true)).toEqual(pairs[0]);
  });

  it('has no pair without a translation (D6)', () => {
    expect(alternatesFrom('/o-fone-mudo-e-o-jack-p2-no-pipewire', pairs, true)).toBeUndefined();
    expect(alternatesFrom('/posts/arquivo', pairs, true)).toBeUndefined();
  });

  it('has no pair while English is not live (REQ-005)', () => {
    expect(alternatesFrom('/sobre', pairs, false)).toBeUndefined();
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/alternates.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

```ts
import { translationPairs, type TranslationPair } from '../content';
import { EN_PUBLISHED } from './live';
import { staticCounterpart } from './routes';

/**
 * The two language versions of a page, or undefined when it exists in one
 * language only (D6) or English is not published yet (D8). Feeds hreflang, the
 * switcher, the suggestion banner and the sitemap.
 */
export const alternatesFrom = (
  path: string,
  pairs: readonly TranslationPair[],
  live: boolean,
): TranslationPair | undefined => {
  if (!live) return undefined;
  return staticCounterpart(path) ?? pairs.find((pair) => pair['pt-BR'] === path || pair.en === path);
};

export const alternatesFor = async (path: string): Promise<TranslationPair | undefined> =>
  alternatesFrom(path, await translationPairs(), EN_PUBLISHED);
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Lote C: layout e navegação

### Tarefa 11: `BaseLayout` por idioma

**Requisito:** REQ-011, REQ-012
**Arquivos:**
- Modificar: `src/layouts/BaseLayout.astro`, `src/lib/aeo/website-ld.ts`, `src/lib/aeo/webpage-ld.ts`
- Teste: `tests/i18n/base-layout.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async (url: string, props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    request: new Request(url),
    props: { title: 'T', description: 'D', ...props },
    slots: { default: '<p>x</p>' },
  });
};

const pair = { 'pt-BR': '/sobre', en: '/en/about' };

describe('BaseLayout language', () => {
  it('stays pt-BR at the root, with no hreflang when there is no pair', async () => {
    const html = await render('https://nandomoreira.dev/sobre');
    expect(html).toContain('<html lang="pt-BR"');
    expect(html).toContain('content="pt_BR"');
    expect(html).not.toContain('hreflang');
    expect(html).toContain('Pular para o conteúdo');
    expect(html).toContain('"inLanguage":"pt-BR"');
  });

  it('switches to English under /en', async () => {
    const html = await render('https://nandomoreira.dev/en/about', { alternates: pair });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="og:locale:alternate" content="pt_BR"');
    expect(html).toContain('Skip to content');
    expect(html).toContain('"inLanguage":"en"');
    expect(html).toContain('href="/en/rss.xml"');
  });

  it('emits reciprocal hreflang with x-default on pt-BR (REQ-011)', async () => {
    const html = await render('https://nandomoreira.dev/sobre', { alternates: pair });
    expect(html).toContain('<link rel="alternate" hreflang="pt-BR" href="https://nandomoreira.dev/sobre"');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://nandomoreira.dev/en/about"');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://nandomoreira.dev/sobre"');
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/base-layout.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

- `website-ld.ts` e `webpage-ld.ts`: troque o tipo `inLanguage: 'pt-BR'` por `inLanguage: Locale` e aceite `locale: Locale = 'pt-BR'` (último parâmetro de `websiteLd`; campo opcional `locale` no objeto de `webPageLd`).
- `BaseLayout.astro`:
  - Nova prop opcional `alternates?: TranslationPair`. Quando ausente, `const alternates = Astro.props.alternates ?? (await alternatesFor(current ?? '/'))`.
  - `const locale = localeOfPath(current ?? '/')` e `const t = messagesFor(locale)`.
  - `<html lang={htmlLang(locale)}>`; `<meta property="og:locale" content={ogLocale(locale)} />` e, com `alternates`, `og:locale:alternate` do outro idioma.
  - Com `alternates`, emita os três `<link rel="alternate" hreflang=...>` com `absoluteUrl(site, ...)`; `x-default` aponta para o pt-BR.
  - RSS alternado: `href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'}` e `title={t.layout.rssTitle}`.
  - Skip link: `{t.layout.skipToContent}`.
  - Repasse `locale` a `websiteLd`, `webPageLd`, `SiteHeader`, `SiteFooter`, `AiSwitcher` (as duas últimas aceitam a prop nas tarefas 12 e 13; até lá, só o header e o JSON-LD).

**Passo 4:** `npx vitest run tests/i18n tests/layout tests/aeo`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 12: navegação e seletor de idioma

**Requisito:** REQ-003, REQ-017
**Arquivos:**
- Criar: `src/components/layout/LanguageSwitch.astro`
- Modificar: `src/components/layout/SiteHeader.astro`, `src/components/layout/SiteNav.astro`, `src/layouts/BaseLayout.astro`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/language-switch.test.ts`, `tests/i18n/site-nav-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, test-reviewer

**Passo 1: testes que falham.**

`tests/i18n/language-switch.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LanguageSwitch from '../../src/components/layout/LanguageSwitch.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(LanguageSwitch, { props });

describe('LanguageSwitch', () => {
  it('points a pt-BR page at its English pair, labelled in English', async () => {
    const html = await render({ locale: 'pt-BR', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<a[^>]*href="\/en\/about"/);
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('lang="en"');
    expect(html).toContain('Read in English');
    expect(html).toMatch(/>\s*EN\s*</);
  });

  it('points an English page back at the pt-BR pair', async () => {
    const html = await render({ locale: 'en', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<a[^>]*href="\/sobre"/);
    expect(html).toContain('hreflang="pt-BR"');
    expect(html).toContain('Ler em português');
  });

  it('falls back to the other home without a pair', async () => {
    expect(await render({ locale: 'pt-BR', live: true })).toMatch(/href="\/en"/);
    expect(await render({ locale: 'en', live: true })).toMatch(/href="\/"/);
  });

  it('renders nothing while English is not live (REQ-005)', async () => {
    expect((await render({ locale: 'pt-BR', live: false })).trim()).toBe('');
  });
});
```

`tests/i18n/site-nav-en.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('SiteNav in English', () => {
  it('links the English pages with English labels', async () => {
    const html = await (await AstroContainer.create()).renderToString(SiteNav, {
      props: { locale: 'en', hasPosts: true },
    });
    for (const href of ['/en/posts', '/en/portfolio', '/en/lab', '/en/setup', '/en/now', '/en/about', '/en/mcp', '/en/contact']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('Now');
    expect(html).toContain('Open menu');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/language-switch.test.ts tests/i18n/site-nav-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

Dicionário, seção `nav` (pt-BR com os rótulos atuais de `SiteNav.astro`; en: `Blog`, `Portfolio`, `Lab`, `Setup`, `Now`, `About`, `MCP`, `Contact`, mais `openMenu`, `closeMenu`, `mainNavigation`, `menu`, copiados dos `aria-label` atuais e traduzidos).

`SiteNav.astro`: prop `locale: Locale = 'pt-BR'`; os itens viram

```ts
const t = messagesFor(locale).nav;
const items = [
  ...(hasPosts ? [{ href: routeFor('/posts', locale), label: t.blog }] : []),
  { href: routeFor('/portfolio', locale), label: t.portfolio },
  { href: routeFor('/lab', locale), label: t.lab },
  { href: routeFor('/setup', locale), label: t.setup },
  { href: routeFor('/now', locale), label: t.now },
  { href: routeFor('/sobre', locale), label: t.about },
  { href: routeFor('/mcp', locale), label: t.mcp },
  { href: routeFor('/contato', locale), label: t.contact },
];
```

e todos os `aria-label` literais leem de `t`.

`LanguageSwitch.astro`:

```astro
---
import { messagesFor } from '../../lib/i18n/messages';
import { EN_PUBLISHED } from '../../lib/i18n/live';
import type { Locale } from '../../lib/i18n/locale';
import type { TranslationPair } from '../../lib/content';

interface Props {
  locale: Locale;
  alternates?: TranslationPair;
  /** Tests override; the build reads EN_PUBLISHED. */
  live?: boolean;
}

const { locale, alternates, live = EN_PUBLISHED } = Astro.props;
const target: Locale = locale === 'en' ? 'pt-BR' : 'en';
// Without a pair, the other language's home (REQ-017).
const href = alternates?.[target] ?? (target === 'en' ? '/en' : '/');
// Labelled in the destination language: it is read by whoever wants that language.
const label = messagesFor(target).language.switchTo;
const short = target === 'en' ? 'EN' : 'PT';
---

{
  (live || alternates) && (
    <a
      href={href}
      hreflang={target}
      lang={target}
      aria-label={label}
      data-language-switch
      class="inline-flex min-h-11 items-center font-mono text-micro uppercase tracking-wide text-muted-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span class="text-trim-cap">{short}</span>
    </a>
  )
}
```

`SiteHeader.astro`: props `locale` e `alternates`, repassadas a `SiteNav` e a um `<LanguageSwitch>` ao lado do `AvailabilityPill` do header (e dentro do menu móvel, por slot, como o pill). O wordmark aponta para `routeFor('/', locale)`. `BaseLayout` passa `locale` e `alternates` ao header.

**Passo 4:** `npx vitest run tests/i18n tests/layout`. Esperado: PASS (os testes antigos de header e nav continuam verdes no pt-BR).

**Passo 5:** `/git commit`.

---

### Tarefa 13: rodapé, seletor da visão IA e 404 em inglês

**Requisito:** REQ-003, REQ-004, REQ-024
**Arquivos:**
- Modificar: `src/components/layout/SiteFooter.astro`, `src/components/layout/ThemeToggle.astro`, `src/lib/theme/copy.ts`, `src/components/ai-view/AiSwitcher.astro`, `src/components/ai-view/AiBar.astro`, `src/components/ai-view/AiDocument.astro`, `src/lib/ai-view/labels.ts`, `src/pages/404.astro`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Criar: `src/components/pages/NotFoundPage.astro`
- Teste: `tests/i18n/chrome-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, test-reviewer

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';
import AiSwitcher from '../../src/components/ai-view/AiSwitcher.astro';
import NotFoundPage from '../../src/components/pages/NotFoundPage.astro';
import { aiViewLabels } from '../../src/lib/ai-view/labels';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (component: unknown, props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(component as never, { props });

describe('English chrome', () => {
  it('footer', async () => {
    const html = await render(SiteFooter, { locale: 'en', name: 'Fernando Moreira', year: 2026, contacts: [] });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('AI switcher', async () => {
    const html = await render(AiSwitcher, { locale: 'en', humanPath: '/en/about', view: 'human' });
    expect(html).toContain('Human');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('AI view labels keep pt-BR as the default export', () => {
    expect(aiViewLabels('pt-BR').human).toBe('Humano');
    expect(aiViewLabels('en').human).toBe('Human');
    expect(aiViewLabels('en').ready).toBe('LLM ready');
  });

  it('404 page', async () => {
    const html = await render(NotFoundPage, { locale: 'en' });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('href="/en"');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/chrome-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

- `labels.ts`: mantenha `AI_VIEW_LABELS` (o pt-BR) e acrescente `AI_VIEW_LABELS_EN` com as mesmas chaves (`Human`, `AI`, `LLM ready`, `Rendered`, `Source`, `Copy`, `Copied`, `Download .md`, `Close`, `Title`, `URL`) e `aiViewLabels(locale)`. Tipar o en como `Record<AiViewLabel, string>`.
- `SiteFooter`, `AiSwitcher`, `AiBar`, `AiDocument`: prop `locale` (padrão pt-BR); todo literal visível e todo `aria-label` sai do dicionário (seção `footer`) ou de `aiViewLabels(locale)`. Os links internos do rodapé passam por `routeFor`.
- O `ThemeToggle` mora no rodapé desde 2026-10-20. Ele recebe `locale` e lê `themeCopy(locale)`. Mantenha `THEME_COPY` como o objeto pt-BR (`themeCopy('pt-BR')`), porque a paleta ainda importa essa constante até a tarefa 14b. O `aria-label` da versão no rodapé traduz, e o `href` continua `RELEASES_PATH` (D14): não crie `/en/releases`.
- `NotFoundPage.astro`: mova o corpo de `src/pages/404.astro` para o componente, com prop `locale` e textos na seção `notFound` do dicionário, e links da home e do blog por `routeFor`. O `BaseLayout` recebe `canonicalPath` e descobre o idioma pela URL; para o 404, passe `locale` explicitamente com uma prop nova `locale?: Locale` do `BaseLayout`, que vence o caminho.
- `src/pages/404.astro` vira casca: `<NotFoundPage locale={localeOfPath(Astro.url.pathname)} />`. Assim um `/en/qualquer` que cai no 404 recebe o 404 inglês (REQ-004).

**Passo 4:** `npx vitest run tests/i18n tests/layout tests/ai-view tests/pages`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 14: sugestão de idioma pelo navegador

**Requisito:** REQ-018, REQ-019, REQ-020, D9
**Arquivos:**
- Criar: `src/components/layout/LanguageSuggestion.astro`
- Modificar: `src/components/art/PointerField.astro`, `src/layouts/BaseLayout.astro`, `tests/helpers/client-scripts.ts`
- Teste: `tests/i18n/language-suggestion.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, test-reviewer, security-reviewer

**Passo 1: teste que falha.**

```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LanguageSuggestion from '../../src/components/layout/LanguageSuggestion.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(LanguageSuggestion, { props });

describe('LanguageSuggestion', () => {
  it('ships hidden, in the language it offers, naming the target', async () => {
    const html = await render({ locale: 'pt-BR', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<aside[^>]*hidden/);
    expect(html).toContain('data-lang-suggest="en"');
    expect(html).toContain('lang="en"');
    expect(html).toContain('This page is also available in English.');
    expect(html).toMatch(/<a[^>]*href="\/en\/about"[^>]*hreflang="en"/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*data-lang-dismiss/);
    expect(html).toContain('Dismiss');
  });

  it('offers pt-BR on an English page', async () => {
    const html = await render({ locale: 'en', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toContain('data-lang-suggest="pt"');
    expect(html).toContain('Esta página também existe em português.');
  });

  it('renders nothing without a pair (REQ-018)', async () => {
    expect((await render({ locale: 'pt-BR' })).trim()).toBe('');
  });
});

describe('the site script', () => {
  const script = readFileSync('src/components/art/PointerField.astro', 'utf8');

  it('reveals the suggestion from navigator.languages and never redirects', () => {
    expect(script).toContain('[data-lang-suggest]');
    expect(script).toContain('navigator.languages');
    expect(script).not.toMatch(/location\.(href|assign|replace)/);
  });

  it('wraps storage in try/catch (REQ-019)', () => {
    const block = script.slice(script.indexOf('[data-lang-suggest]'));
    expect(block.slice(0, 900)).toMatch(/try\s*{[^}]*localStorage/);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/language-suggestion.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`LanguageSuggestion.astro`:

```astro
---
import type { TranslationPair } from '../../lib/content';
import type { Locale } from '../../lib/i18n/locale';
import { messagesFor } from '../../lib/i18n/messages';

interface Props {
  locale: Locale;
  alternates?: TranslationPair;
}

const { locale, alternates } = Astro.props;
const target: Locale = locale === 'en' ? 'pt-BR' : 'en';
// Written in the visitor's language, which is the target (D9).
const t = messagesFor(target).language;
// The script compares this with navigator.languages: "pt" or "en".
const code = target === 'en' ? 'en' : 'pt';
---

{
  alternates && (
    <aside
      hidden
      data-lang-suggest={code}
      lang={target}
      aria-label={t.names[target]}
      class="mx-auto mt-md flex w-full max-w-frame flex-wrap items-center justify-between gap-sm rounded-md border border-border-strong bg-surface px-lg py-sm text-small text-foreground"
    >
      <p class="m-0">
        {t.suggestion}{' '}
        <a href={alternates[target]} hreflang={target} class="text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t.suggestionLink}</a>
      </p>
      <button
        type="button"
        data-lang-dismiss
        class="inline-flex min-h-11 items-center px-sm font-mono text-micro uppercase tracking-wide text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t.dismiss}
      </button>
    </aside>
  )
}
```

No `BaseLayout`, renderize `<LanguageSuggestion locale={locale} alternates={alternates} />` logo abaixo do header (fora do `view === 'ai'`).

No `PointerField.astro`, acrescente antes do bloco do ponteiro:

```ts
  // Language suggestion (i18n-foundation, D9). The banner ships hidden in the
  // HTML; it shows only when the visitor's first pt/en language differs from
  // the page's, and never redirects. Storage can throw (private window).
  const suggest = document.querySelector<HTMLElement>('[data-lang-suggest]');
  if (suggest) {
    const wanted = navigator.languages.map((tag) => tag.slice(0, 2)).find((tag) => tag === 'pt' || tag === 'en');
    let dismissed = false;
    try {
      dismissed = localStorage.getItem('lang-suggest') === 'off';
    } catch {}
    if (wanted === suggest.dataset.langSuggest && !dismissed) suggest.hidden = false;
    suggest.querySelector('[data-lang-dismiss]')?.addEventListener('click', () => {
      suggest.hidden = true;
      try {
        localStorage.setItem('lang-suggest', 'off');
      } catch {}
    });
  }
```

**Passo 4:** `npx vitest run tests/i18n/language-suggestion.test.ts`. Esperado: PASS. Depois: `npm run build && npm run test:build -- tests/design-system/no-client-js.build-test.ts`. Esperado: PASS dentro de `POINTER_BUDGET_BYTES` (REQ-020, D13).

Meça o gzip do script do ponteiro no HTML do build, não no fonte. Comentário não conta: o build já remove. Se couber em 2304, não mexa na constante. Se passar de 2304 e o tamanho for no máximo 2560, suba `POINTER_BUDGET_BYTES` para esse tamanho medido e escreva na constante a data 2026-10-23 e o número. Se passar de 2560, pare e reporte. Não crie outro `<script>`.

**Passo 5:** `/git commit`.

---

### Tarefa 14b: paleta e índice inglês

**Requisito:** REQ-024
**Depende de:** tarefas 11 e 14
**Arquivos:**
- Criar: `src/pages/en/search.json.ts`
- Modificar: `src/lib/search/copy.ts`, `src/lib/search/controller.ts`, `src/lib/search/build-index.ts`, `src/scripts/palette.ts`, `src/components/search/CommandPalette.astro`, `src/components/search/PaletteTrigger.astro`, `src/components/home/Hero.astro`, `src/layouts/BaseLayout.astro`, `src/pages/search.json.ts`
- Teste: `tests/i18n/palette-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, test-reviewer, type-safety-reviewer

**Passo 1: teste que falha.**

```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CommandPalette from '../../src/components/search/CommandPalette.astro';
import { buildSearchIndex } from '../../src/lib/search/build-index';
import { GO_TARGETS, PALETTE_COPY, paletteCopy } from '../../src/lib/search/copy';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('palette copy by locale (REQ-024)', () => {
  it('keeps the pt-BR strings on the current export', () => {
    expect(paletteCopy('pt-BR').groups.general).toBe('Geral');
    expect(PALETTE_COPY.groups.general).toBe('Geral');
    expect(GO_TARGETS.map((target) => target.path)).toContain('/sobre');
  });

  it('translates the chrome and keeps paths', () => {
    const copy = paletteCopy('en');
    expect(ptLeftovers(`<p>${JSON.stringify(copy)}</p>`)).toEqual([]);
    expect(copy.groups.general).not.toBe('Geral');
    expect(GO_TARGETS.map((target) => target.key).sort()).toEqual(
      ['b', 'c', 'h', 'l', 'm', 'n', 'p', 's', 'u', 'v'].sort(),
    );
  });

  it('renders the dialog in English', async () => {
    const html = await (await AstroContainer.create()).renderToString(CommandPalette, {
      props: { locale: 'en' },
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('builds static page titles in English and leaves posts for later', () => {
    const index = buildSearchIndex({
      locale: 'en',
      current: [],
      archived: [],
      projects: [],
      services: [],
      landingUrl: 'https://contrate.nandomoreira.dev/',
    });
    const about = index.find((item) => item.path === '/sobre');
    expect(about?.title).toBe('About');
    expect(about?.path).toBe('/sobre');
  });
});

describe('palette loader', () => {
  const source = readFileSync('src/scripts/palette.ts', 'utf8');

  it('fetches the English index when the page is English', () => {
    expect(source).toContain('/en/search.json');
    expect(source).toContain('documentElement.lang');
  });
});
```

Confira as teclas reais de `GO_TARGETS` em `src/lib/search/copy.ts` e use essa lista no `toEqual`. O título inglês de `/sobre` é `About`, o de `/agora` é `Now`, o de `/contato` é `Contact`, o de `/portfolio` é `Portfolio`.

**Passo 2:** `npx vitest run tests/i18n/palette-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

- `paletteCopy(locale)` devolve a mesma forma de `PALETTE_COPY`. `PALETTE_COPY` passa a ser `paletteCopy('pt-BR')`, para a suíte de busca atual continuar verde.
- `buildSearchIndex` ganha `locale: Locale = 'pt-BR'`. Os títulos de página estática saem de `paletteCopy(locale)`. Paths não mudam. Posts, cases e serviços continuam nos dados recebidos. O `/search.json` não passa `locale` e segue pt-BR.
- `src/pages/en/search.json.ts` repete o GET de `search.json.ts` com `locale: 'en'`. Posts e cases vêm das coleções pt-BR. Os serviços continuam `SALES_SERVICES` até a `i18n-sales` trocar esta rota.
- `CommandPalette`, `PaletteTrigger` e `Hero` recebem `locale` (padrão `'pt-BR'`). O `BaseLayout` repassa o `locale` da página. O `Hero` da home ainda é pt-BR até a tarefa 17 passar `locale`.
- `controller.ts` monta os grupos a partir de `paletteCopy(locale)`. As teclas (`G`, `L`, `E`, `M`, `I`, `T`, `S`) não mudam.
- `palette.ts` escolhe a copy e a URL do índice por `document.documentElement.lang` (`en` busca `/en/search.json`). As duas copys viajam no chunk. Se `PALETTE_BUDGET_BYTES` (4096) estourar, pare e reporte. Não suba esse teto.

**Passo 4:** `npx vitest run tests/i18n/palette-en.test.ts tests/search`. Esperado: PASS. Depois o portão de JS do build, como na tarefa 14.

**Passo 5:** `/git commit`.

---

## Lote D: páginas

Padrão de todas as tarefas deste lote (D7):

1. Crie `src/components/pages/<Nome>Page.astro` com o corpo atual da página pt-BR, recebendo `locale: Locale = 'pt-BR'`.
2. Troque cada literal visível, `aria-label`, `alt` de interface e `title`/`description` de meta por chaves de uma seção nova do dicionário, com nome da página (`home`, `about`, `contact`...). O pt-BR recebe o texto atual sem mudar uma vírgula, e o en recebe a tradução.
3. Leia o conteúdo com `locale` (`getProfile(locale)`, `getAllProjects(locale)`...), formate datas com `locale` e monte links internos com `routeFor`/`withLocale`.
4. `src/pages/<pt>.astro` vira casca: imports, `export const prerender` se já houver, e `<XPage />`.
5. `src/pages/en/<en>.astro` é a casca inglesa:

```astro
---
import XPage from '../../components/pages/XPage.astro';
import { EN_PUBLISHED } from '../../lib/i18n/live';

if (!EN_PUBLISHED) return new Response(null, { status: 404 });
---

<XPage locale="en" />
```

Rotas pré-renderizadas usam `getStaticPaths` que devolve `[]` quando `!EN_PUBLISHED`, no lugar do `return`.

6. O teste de cada tarefa renderiza o componente com `locale: 'en'` e exige `ptLeftovers(html)` vazio, e renderiza com `locale: 'pt-BR'` exigindo o mesmo HTML de antes. Para isso, grave **antes de mexer** um snapshot do pt-BR atual com `toMatchFileSnapshot('../__snapshots__/<pagina>.pt.html')` e mantenha-o igual depois da extração (REQ-002).

### Tarefa 15: casca inglesa e prova da bandeira

**Requisito:** REQ-004, REQ-005
**Arquivos:**
- Criar: `src/lib/i18n/guard.ts`
- Teste: `tests/i18n/guard.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { enStaticPaths } from '../../src/lib/i18n/guard';

describe('enStaticPaths', () => {
  it('builds no English page while the flag is off', async () => {
    expect(await enStaticPaths(async () => [{ params: { slug: 'a' } }], false)).toEqual([]);
  });

  it('builds them once live', async () => {
    expect(await enStaticPaths(async () => [{ params: { slug: 'a' } }], true)).toEqual([{ params: { slug: 'a' } }]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/guard.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

```ts
import { EN_PUBLISHED } from './live';

/** getStaticPaths of a pre-rendered English route: nothing while /en is not live (D8). */
export const enStaticPaths = async <T>(paths: () => Promise<T[]>, live: boolean = EN_PUBLISHED): Promise<T[]> =>
  live ? paths() : [];
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 16: componentes da home

**Requisito:** REQ-003, REQ-008
**Arquivos:**
- Modificar: `src/components/home/Hero.astro`, `src/components/home/Services.astro`, `src/components/home/Trajectory.astro`, `src/components/home/LatestPosts.astro`, `src/components/home/Contact.astro`, `src/components/home/About.astro`, `src/components/home/CollectionSection.astro`, `src/components/contact/AgentBrief.astro`, `src/components/contact/AgentBriefWindow.astro`, `src/lib/home/meta.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/home-components-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Um `it` por componente: renderize com `locale: 'en'` e as mesmas props que os testes de `tests/home/` já usam (copie de lá os fixtures), e exija `ptLeftovers(html)` vazio. Para o `Services.astro`, mantenha a validação cruzada serviço-case funcionando com os serviços do perfil inglês (`getProfile('en')`). Antes de mexer, grave os snapshots pt-BR de cada componente (padrão do lote, item 6).

**Passo 2:** `npx vitest run tests/i18n/home-components-en.test.ts`. Esperado: FAIL (texto pt-BR no HTML inglês).

**Passo 3: implementação.** Siga o padrão do lote. Não existe `src/lib/home/hero.ts` nem `HERO_FACTS`: título e posicionamento vêm do perfil do idioma, e o texto do atalho no `Hero` já sai de `paletteCopy(locale)` desde a tarefa 14b. Passe `locale` ao `Hero`. `homeMeta(profile)` não muda (recebe o perfil já no idioma). A seção do dicionário é `home`.

**Passo 4:** `npx vitest run tests/i18n tests/home`. Esperado: PASS, inclusive `tests/home/single-primary-cta.test.ts`.

**Passo 5:** `/git commit`.

---

### Tarefa 17: página Home

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/HomePage.astro`, `src/pages/en/index.astro`
- Modificar: `src/pages/index.astro`
- Teste: `tests/i18n/home-page-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HomePage from '../../src/components/pages/HomePage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(HomePage, {
    props: { locale },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en' : 'https://nandomoreira.dev/'),
  });

describe('HomePage', () => {
  it('keeps the pt-BR home byte for byte', async () => {
    await expect(await render('pt-BR')).toMatchFileSnapshot('../__snapshots__/home.pt.html');
  });

  it('renders the English home', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
```

Rode o primeiro `it` **antes** de mexer em `index.astro`, sem o `HomePage` ainda (renderize `src/pages/index.astro`), para gravar o snapshot; depois troque o import pelo componente.

**Passo 2:** `npx vitest run tests/i18n/home-page-en.test.ts`. Esperado: FAIL (componente inexistente).

**Passo 3: implementação.** Padrão do lote. O `personLd` e o `organizationLd` recebem o perfil do idioma. O `Hero` já aceita `locale` desde a tarefa 14b: passe o `locale` da página, sem traduzir de novo as frases da paleta. O `NewsletterCard` recebe `locale` (o texto dele é da tarefa 27; até lá, passe a prop e deixe o card com o pt-BR, e marque o `it` inglês como `it.todo` apenas para o card, removendo o `todo` na tarefa 27).

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 18: Sobre (`/sobre` ↔ `/en/about`)

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/AboutPage.astro`, `src/pages/en/about.astro`
- Modificar: `src/pages/sobre.astro`, `src/components/about/Experience.astro`, `src/lib/about/colophon.ts`, `src/lib/about/period.ts`, `src/components/ui/Portrait.astro`, `src/components/ui/StatItem.astro`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/about-page-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Mesmo formato do teste da tarefa 17, com `AboutPage`, URLs `/sobre` e `/en/about`, snapshot `about.pt.html`, mais:

```ts
  it('formats periods in English', async () => {
    const html = await render('en');
    expect(html).toMatch(/Building software since 20\d\d/);
    expect(html).toContain('"@type":"ProfilePage"');
  });
```

**Passo 2:** `npx vitest run tests/i18n/about-page-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. `formatPeriod` ganha `locale` (meses e "atual"/"present"). `COLOPHON` vira `colophon(locale)`. `PROFILE_LABELS` continua (GitHub e LinkedIn são nomes).

**Passo 4:** `npx vitest run tests/i18n tests/pages/sobre.test.ts tests/about`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 19: Contato (`/contato` ↔ `/en/contact`) com retorno do formulário

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/ContactPage.astro`, `src/pages/en/contact.astro`
- Modificar: `src/pages/contato.astro`, `src/lib/contact/form-options.ts`, `src/lib/hire/handler.ts`, `src/lib/hire/form.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/contact-page-en.test.ts`, `tests/i18n/hire-redirect-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: security-reviewer, business-logic-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: testes que falham.**

`tests/i18n/hire-redirect-en.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contactOriginOf, formRedirect } from '../../src/lib/hire/form';

describe('contact form return path', () => {
  it('goes back to the English contact page only for the English form', () => {
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=contact-en'))).toBe('/en/contact');
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire'))).toBe('/contato');
  });

  it('never redirects to an arbitrary origin', () => {
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=https://evil.example'))).toBe('/contato');
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=/en/contact'))).toBe('/contato');
  });

  it('keeps the outcome values as the machine contract', () => {
    expect(formRedirect('ok', '/en/contact').headers.get('location')).toBe('/en/contact?envio=ok#envio');
  });
});
```

`tests/i18n/contact-page-en.test.ts`: formato da tarefa 17 com `ContactPage`, snapshot `contact.pt.html`, e:

```ts
  it('posts the English form with its own origin and shows outcomes in English', async () => {
    const html = await (await AstroContainer.create()).renderToString(ContactPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/contact?envio=invalido'),
    });
    expect(html).toContain('action="/api/hire?origem=contact-en"');
    expect(html).toMatch(/role="alert"/);
    expect(ptLeftovers(html)).toEqual([]);
  });
```

**Passo 2:** `npx vitest run tests/i18n/hire-redirect-en.test.ts tests/i18n/contact-page-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

- `form.ts`:

```ts
/** Return pages of the contact form, by its ?origem; anything else is /contato (never an open redirect). */
const CONTACT_ORIGINS: Record<string, string> = { 'contact-en': '/en/contact' };

export const contactOriginOf = (url: URL): string =>
  CONTACT_ORIGINS[url.searchParams.get('origem') ?? ''] ?? '/contato';
```

- `handler.ts`: `const salesBase = fromForm ? (salesOriginOf(url) ?? contactOriginOf(url)) : undefined;`, com `url = new URL(request.url)`. A escolha do schema continua por `salesOriginOf(url)` (só a venda usa `salesFormToPayload`): guarde os dois valores em variáveis separadas, `salesBase` e `returnBase`, e não altere a validação.
- `form-options.ts`: rótulos de orçamento e interesse e mensagens de resultado ganham versão inglesa: `budgetOptions(locale)`, `interestOptions(locale)`, `outcomeMessage(value, locale)`. Mantenha `BUDGET_OPTIONS`, `INTEREST_OPTIONS` e a assinatura antiga funcionando (pt-BR). Na versão inglesa, os valores em reais continuam em reais (`Up to R$ 10k`), porque o orçamento é cobrado em reais.
- `ContactPage.astro`: padrão do lote; a `action` do formulário é `/api/hire` em pt-BR e `/api/hire?origem=contact-en` em inglês.

**Passo 4:** `npx vitest run tests/i18n tests/pages/contato.test.ts tests/api tests/contact`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 20: Currículo (`/curriculo` ↔ `/en/resume`)

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/ResumePage.astro`, `src/pages/en/resume.astro`
- Modificar: `src/pages/curriculo.astro`, `src/lib/cv/download.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/resume-page-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Formato da tarefa 17, com `ResumePage`, snapshot `resume.pt.html`, URL `/en/resume`.

**Passo 2:** `npx vitest run tests/i18n/resume-page-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. Se `src/lib/cv/download.ts` aponta para um PDF pt-BR, a versão inglesa aponta para o mesmo PDF com o rótulo "Download résumé (Portuguese, PDF)": não há PDF inglês, e prometer um seria mentir.

**Passo 4:** `npx vitest run tests/i18n tests/cv`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 21: MCP (`/mcp` ↔ `/en/mcp`)

**Requisito:** REQ-002, REQ-003, REQ-012
**Arquivos:**
- Criar: `src/components/pages/McpPage.astro`, `src/pages/en/mcp.astro`
- Modificar: `src/pages/mcp.astro`, `src/lib/mcp/clients.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/mcp-page-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Formato da tarefa 17, com `McpPage`, snapshot `mcp.pt.html`, URL `/en/mcp`, mais `expect(html).toContain('"@type":"HowTo"')` e `expect(html).toContain('"inLanguage":"en"')`.

**Passo 2:** `npx vitest run tests/i18n/mcp-page-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. `mcpHowToLd(site, locale)`: nome, descrição, nomes de seção e passos com versão inglesa; `inLanguage: Locale`. Os trechos de configuração (JSON, comandos) ficam idênticos.

**Passo 4:** `npx vitest run tests/i18n tests/pages/mcp.test.ts tests/mcp`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 22: Setup (`/setup` ↔ `/en/setup`)

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/SetupPage.astro`, `src/pages/en/setup.astro`, `src/lib/setup/setup-en.ts`
- Modificar: `src/pages/setup.astro`, `src/lib/setup/setup.ts`
- Teste: `tests/i18n/setup-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { SETUP_SECTIONS } from '../../src/lib/setup/setup';
import { SETUP_SECTIONS_EN, setupFor } from '../../src/lib/setup/setup-en';

describe('English setup', () => {
  it('has the same sections, items, URLs and shortcuts in the same order', () => {
    const shape = (sections: typeof SETUP_SECTIONS) =>
      sections.map((section) => ({
        id: section.id,
        items: section.items?.map((item) => ({ name: item.name, url: item.url, keys: item.shortcuts?.map((s) => s.keys) })),
      }));
    expect(shape(SETUP_SECTIONS_EN)).toEqual(shape(SETUP_SECTIONS));
  });

  it('is translated and resolves by locale', () => {
    expect(setupFor('pt-BR').sections).toBe(SETUP_SECTIONS);
    expect(setupFor('en').sections).toBe(SETUP_SECTIONS_EN);
    expect(setupFor('en').lead).not.toBe(setupFor('pt-BR').lead);
  });
});
```

Ajuste os nomes de campo do `shape` aos reais de `SetupSection` (leia a interface em `setup.ts:37`). Acrescente um teste de render do `SetupPage` em inglês com `ptLeftovers` vazio e o snapshot pt-BR (padrão do lote).

**Passo 2:** `npx vitest run tests/i18n/setup-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `setup-en.ts` exporta `SETUP_LEAD_EN` e `SETUP_SECTIONS_EN: SetupSection[]` (mesma estrutura, `why`, `title`, `intro` e rótulos de atalho traduzidos) e `setupFor(locale)`. `setupMarkdown({ site, locale })` lê de `setupFor`. Página no padrão do lote.

**Passo 4:** `npx vitest run tests/i18n tests/setup tests/pages/setup-steps.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 23: Agora (`/now` ↔ `/en/now`)

**Requisito:** REQ-002, REQ-003, REQ-009
**Arquivos:**
- Criar: `src/components/pages/NowPage.astro`, `src/pages/en/now.astro`
- Modificar: `src/pages/now.astro`, `src/components/now/NowSection.astro`, `src/components/now/NowMusic.astro`, `src/components/now/NowGames.astro`, `src/components/now/GameProgress.astro`, `src/lib/now/markdown.ts`, `src/lib/now/day.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/now-page-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Formato da tarefa 17 com `NowPage`, URL `/en/now`, snapshot `now.pt.html`. Use os mesmos dublês das fontes externas que `tests/now/` já usa (nenhuma chamada real a Spotify, Xbox ou GitHub).

**Passo 2:** `npx vitest run tests/i18n/now-page-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. A prévia de áudio (`data-now-preview`) continua só em `/now` e `/en/now`; o portão de JS conta o script por rota, então confirme no passo 4 que ele aceita `/en/now` (se a lista de rotas permitidas do portão for literal `/now`, acrescente `/en/now` **no teste**, que é a única mudança permitida nele, porque a exceção registrada é "só nessa página", e a página agora tem duas URLs).

**Passo 4:** `npx vitest run tests/i18n tests/now`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 24: Privacidade (`/privacidade` ↔ `/en/privacy`)

**Requisito:** REQ-002, REQ-003
**Arquivos:**
- Criar: `src/components/pages/PrivacyPage.astro`, `src/pages/en/privacy.astro`, `src/lib/privacy/policy-en.ts`
- Modificar: `src/pages/privacidade.astro`, `src/lib/privacy/policy.ts`
- Teste: `tests/i18n/privacy-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, security-reviewer

**Passo 1: teste que falha.** Paridade como na tarefa 22: mesmo número de seções, mesmos `id`, mesmo `POLICY_UPDATED_AT`, texto diferente. Mais o render inglês com `ptLeftovers` vazio e o snapshot pt-BR.

**Passo 2:** `npx vitest run tests/i18n/privacy-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `policy-en.ts` com `privacySectionsEn`, `POLICY_LEAD_EN` e `policyFor(locale)`; `formatPolicyDate(iso, locale)` usa `toLongDate(iso, locale)`. A tradução é fiel ao `policy.ts` do dia da implementação, inclusive a seção `comentarios` do Giscus (2026-10-22). Mesmos `id`. Nenhuma cláusula pode ser suavizada nem acrescentada.

**Passo 4:** `npx vitest run tests/i18n tests/privacy`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 25: Portfólio, Lab e páginas de case

**Requisito:** REQ-002, REQ-003, REQ-004
**Arquivos:**
- Criar: `src/components/pages/CollectionPage.astro`, `src/components/pages/CasePage.astro`, `src/pages/en/portfolio/index.astro`, `src/pages/en/lab/index.astro`, `src/pages/en/portfolio/[slug].astro`, `src/pages/en/lab/[slug].astro`
- Modificar: `src/pages/portfolio/index.astro`, `src/pages/lab/index.astro`, `src/pages/portfolio/[slug].astro`, `src/pages/lab/[slug].astro`, `src/lib/catalog/collection-copy.ts`, `src/lib/catalog/closing-cta.ts`, `src/lib/catalog/json-ld.ts`, `src/lib/catalog/open-source.ts`, `src/components/catalog/CaseArticle.astro`, `src/components/catalog/CollectionListing.astro`, `src/components/catalog/ClosingCta.astro`, `src/components/catalog/OpenSourceList.astro`, `src/components/catalog/LinkList.astro`, `src/components/catalog/ArtCard.astro`, `src/components/catalog/ArtRow.astro`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/catalog-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CollectionPage from '../../src/components/pages/CollectionPage.astro';
import { closingCta } from '../../src/lib/catalog/closing-cta';
import { collectionCopy } from '../../src/lib/catalog/collection-copy';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('catalog copy by locale', () => {
  it('keeps pt-BR and adds English', () => {
    expect(collectionCopy('portfolio', 'pt-BR').title).toBe('Produtos e trabalho de cliente, do problema à produção');
    expect(ptLeftovers(`<p>${Object.values(collectionCopy('lab', 'en')).join(' ')}</p>`)).toEqual([]);
    expect(ptLeftovers(`<p>${Object.values(closingCta('portfolio', 'en')).join(' ')}</p>`)).toEqual([]);
  });
});

describe('English collection pages', () => {
  it.each(['portfolio', 'lab'])('%s renders in English, empty until i18n-content', async (collection) => {
    const html = await (await AstroContainer.create()).renderToString(CollectionPage, {
      props: { collection, locale: 'en' },
      request: new Request(`https://nandomoreira.dev/en/${collection}`),
    });
    expect(html).toContain('<html lang="en"');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
```

Mais os snapshots pt-BR de `/portfolio`, `/lab` e de um case (`/portfolio/forja`), gravados antes da extração.

**Passo 2:** `npx vitest run tests/i18n/catalog-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. `COLLECTION_COPY` e `CLOSING_CTA` continuam exportados (pt-BR) e ganham `collectionCopy(collection, locale)` e `closingCta(collection, locale)`. O JSON-LD de case (`json-ld.ts`) ganha `inLanguage` e a URL `/en/...` quando `locale` é `en`. As rotas `/en/portfolio/[slug]` e `/en/lab/[slug]` usam `enStaticPaths(() => getAllProjects('en') filtrado pela coleção)`, que hoje devolve vazio. Os rótulos da `OpenSourceList` saem do dicionário; as descrições dos repositórios em `open-source.ts` ganham `descriptionEn`.

**Passo 4:** `npx vitest run tests/i18n tests/catalog`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 26: Blog: listagem e página de post

**Requisito:** REQ-002, REQ-003, REQ-009, REQ-025, REQ-026
**Arquivos:**
- Criar: `src/components/pages/PostsPage.astro`, `src/components/pages/PostPage.astro`, `src/pages/en/posts/index.astro`, `src/pages/en/[slug].astro`
- Modificar: `src/pages/posts/index.astro`, `src/pages/[slug].astro`, `src/middleware.ts`, `src/lib/posts/listing-view.ts`, `src/lib/posts/blog-copy.ts`, `src/lib/posts/giscus-config.ts`, `src/components/posts/GiscusComments.astro`, `src/components/posts/PostCard.astro`, `src/components/posts/PostRow.astro`, `src/components/posts/Pagination.astro`, `src/components/posts/UpcomingPosts.astro`, `src/components/posts/ReaderMode.astro`, `src/components/posts/AuthorBox.astro`, `src/components/posts/PostToc.astro`, `src/components/posts/PostTocToggle.astro`, `src/components/posts/PostSnapshot.astro`, `src/components/posts/RelatedPostCard.astro`, `src/components/posts/AiSummaryLink.astro`, `src/components/ui/CopyButton.astro`, `src/lib/posts/post-ld.ts`, `src/lib/i18n/messages/pt-BR.ts`, `src/lib/i18n/messages/en.ts`
- Teste: `tests/i18n/blog-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostsPage from '../../src/components/pages/PostsPage.astro';
import { blogCopy } from '../../src/lib/posts/blog-copy';
import { jsonLdForPost } from '../../src/lib/posts/post-ld';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('English blog', () => {
  it('listing renders in English, empty until i18n-content', async () => {
    const html = await (await AstroContainer.create()).renderToString(PostsPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/posts'),
    });
    expect(html).toContain('<html lang="en"');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('copy resolves by locale', () => {
    expect(blogCopy('pt-BR').title).toBe('Meu caderno aberto');
    expect(blogCopy('en').title).not.toBe('Meu caderno aberto');
  });

  it('post JSON-LD carries the language and the English URL', () => {
    const post = { slug: 'the-false-green', title: 'T', summary: 'S', date: '2026-10-09', markers: ['a', 'b', 'c'] };
    const ld = jsonLdForPost(post as never, 'https://nandomoreira.dev', undefined, 'en');
    expect(ld.inLanguage).toBe('en');
    expect(ld.url).toBe('https://nandomoreira.dev/en/the-false-green');
    expect(ld.image).toBe('https://nandomoreira.dev/og/en/the-false-green.png');
  });
});
```

Mais os snapshots pt-BR de `/posts` e de um post publicado com capa e índice, gravados antes da extração. O render de um post inglês real fica para a `i18n-content`; aqui, renderize o `PostPage` com uma entrada pt-BR e `locale: 'en'` e exija que a interface (data, tempo de leitura, botões, índice, "posts relacionados", modo leitura) esteja em inglês. O corpo continua em português nesse teste, então aplique o `ptLeftovers` só ao HTML fora de `[data-reader-article] .prose`.

**Passo 2:** `npx vitest run tests/i18n/blog-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Padrão do lote. `BLOG_COPY` continua exportado e ganha `blogCopy(locale)`. `jsonLdForPost(post, site, author, locale = 'pt-BR')` monta a URL com `withLocale` e o `image` com `ogImagePath(withLocale('/<slug>', locale))`. A paginação usa o mesmo `?pagina=`. O `/en/[slug].astro` usa `enStaticPaths(() => getAllPostEntries('en'))`. O `PostPage` monta `.md` e o canonical com `withLocale`. Os posts relacionados vêm de `getAllPosts(locale)`. A seção `posts` do dicionário recebe todos os rótulos (Rascunho, Arquivo, Copiar link, Posts relacionados, Ver todos no blog, LEITURA COMPLEMENTAR, rótulos do modo leitura e do índice).

Grade e lista (REQ-026), como estão desde 2026-10-22:

- A casca lê `parseListingView` do cookie `__session` e passa a view para `PostsPage`. O formulário continua POST, sem JavaScript.
- `listingHref(page, base = '/posts')`. A página inglesa passa `'/en/posts'`. Quem chama com um argumento segue em `/posts`, e a suíte atual permanece verde.
- O middleware aceita POST só em `/posts` e `/en/posts`. `handleListingView` redireciona para o pathname do pedido, com `?pagina=` quando a página é maior que 1. Os valores de `visao` continuam `grade` e `lista`. O cookie não muda.
- Um `?visao=` sobrando na listagem inglesa também sai da URL, como já acontece em `/posts`.
- Acrescente ao teste da tarefa um POST em `/en/posts` que espera 303 para `/en/posts`, e outro com `?pagina=2` que espera `/en/posts?pagina=2`.

Giscus (REQ-025), como está desde 2026-10-22:

- `giscusCopy(locale)` devolve `lang`, `eyebrow`, `heading`, `failureMessage` e `emptyMessage`. O export pt-BR atual permanece, com `lang: 'pt'` e as duas frases de `giscus-config.ts`.
- `GiscusComments` recebe `locale`. `data-lang` e os textos visíveis saem de `giscusCopy`. O loader não muda: ele já lê `data-lang` do HTML.
- `PostPage` renderiza o widget quando `isCommentsPost(post)`, nos dois idiomas. A thread é por pathname, então a página inglesa não reaproveita a discussão do pt-BR.

**Passo 4:** `npx vitest run tests/i18n tests/posts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 27: newsletter em inglês

**Requisito:** REQ-003
**Arquivos:**
- Modificar: `src/lib/newsletter/copy.ts`, `src/lib/newsletter/handler.ts`, `src/components/posts/NewsletterCard.astro`
- Teste: `tests/i18n/newsletter-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: security-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NewsletterCard from '../../src/components/posts/NewsletterCard.astro';
import { newsletterCopy } from '../../src/lib/newsletter/copy';
import { subscribeOriginOf } from '../../src/lib/newsletter/handler';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('newsletter in English', () => {
  it('accepts the English pages as return origins and nothing else', () => {
    const at = (origem: string) => new Request(`https://nandomoreira.dev/api/subscribe?origem=${encodeURIComponent(origem)}`);
    expect(subscribeOriginOf(at('/en'))).toBe('/en');
    expect(subscribeOriginOf(at('/en/posts'))).toBe('/en/posts');
    expect(subscribeOriginOf(at('/en/evil'))).toBe('/posts');
    expect(subscribeOriginOf(at('https://evil.example'))).toBe('/posts');
  });

  it('card copy and outcomes', async () => {
    expect(newsletterCopy('en').button).toBe('Subscribe');
    const html = await (await AstroContainer.create()).renderToString(NewsletterCard, {
      props: { locale: 'en', origin: '/en/posts', outcome: 'ok' },
    });
    expect(html).toContain('origem=%2Fen%2Fposts');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
```

Confira as props reais do `NewsletterCard` (abra o componente) e ajuste os nomes no teste antes de rodá-lo.

**Passo 2:** `npx vitest run tests/i18n/newsletter-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** No handler, `ORIGINS` passa a `new Set(['/', '/posts', '/en', '/en/posts'])` e o `originOf` é exportado como `subscribeOriginOf`. O `copy.ts` ganha `newsletterCopy(locale)` e `newsletterOutcomes(locale)`, mantendo as constantes antigas. Remova o `it.todo` deixado na tarefa 17.

**Passo 4:** `npx vitest run tests/i18n tests/newsletter tests/posts/newsletter-card.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Lote E: SEO e máquina

### Tarefa 28: sitemap bilíngue

**Requisito:** REQ-013, REQ-005
**Arquivos:**
- Modificar: `src/lib/aeo/sitemap.ts`, `src/pages/sitemap.xml.ts`
- Teste: `tests/i18n/sitemap-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../src/lib/aeo/sitemap';

const site = new URL('https://nandomoreira.dev');
const pairs = [{ 'pt-BR': '/o-falso-verde', en: '/en/the-false-green' }];

describe('bilingual sitemap', () => {
  it('lists English pages and links each pair both ways when live', () => {
    const xml = buildSitemap({ site, projects: [], posts: [], enLive: true, pairs });
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://nandomoreira.dev/en/about</loc>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://nandomoreira.dev/en/about"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="pt-BR" href="https://nandomoreira.dev/sobre"/>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/en/the-false-green</loc>');
  });

  it('is unchanged while English is not live', () => {
    const before = buildSitemap({ site, projects: [], posts: [] });
    expect(buildSitemap({ site, projects: [], posts: [], enLive: false, pairs })).toBe(before);
    expect(before).not.toContain('/en');
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/sitemap-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `Input` ganha `enLive?: boolean` (padrão `false`) e `pairs?: TranslationPair[]`. Com `enLive`, acrescente uma entrada por `STATIC_ROUTES[].en` e por `pairs[].en`. Na serialização, cada entrada cujo caminho tem par (estático ou de conteúdo) recebe os dois `xhtml:link`, e o `urlset` só declara o namespace quando há algum. `/api/resume.*` e o arquivo continuam sem par. A rota lê `EN_PUBLISHED` e `translationPairs()`.

**Passo 4:** `npx vitest run tests/i18n tests/aeo`. Esperado: PASS (os testes antigos de sitemap continuam iguais, porque o padrão é desligado).

**Passo 5:** `/git commit`.

---

### Tarefa 29: `/en/rss.xml`

**Requisito:** REQ-014
**Arquivos:**
- Criar: `src/pages/en/rss.xml.ts`
- Modificar: `src/lib/posts/rss.ts`
- Teste: `tests/i18n/rss-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { buildRss } from '../../src/lib/posts/rss';

const post = { slug: 'the-false-green', title: 'The false green', summary: 'S', date: '2026-10-09', markers: ['a', 'b', 'c'] };

describe('English RSS', () => {
  it('declares English and links the /en posts', () => {
    const xml = buildRss({ site: new URL('https://nandomoreira.dev'), posts: [post as never], title: 'T', description: 'D', locale: 'en' });
    expect(xml).toContain('<language>en</language>');
    expect(xml).toContain('<link>https://nandomoreira.dev/en/the-false-green</link>');
    expect(xml).toContain('<link>https://nandomoreira.dev/en/posts</link>');
  });

  it('keeps the pt-BR feed as it is', () => {
    const xml = buildRss({ site: new URL('https://nandomoreira.dev'), posts: [], title: 'T', description: 'D' });
    expect(xml).toContain('<language>pt-BR</language>');
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/rss-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `buildRss` ganha `locale?: Locale` (padrão pt-BR); links por `withLocale`, `<language>` por `htmlLang(locale)`. `src/pages/en/rss.xml.ts` copia a rota pt-BR, lê `getCurrentPosts('en')` (só não arquivados), título `Posts | nandomoreira.dev` e descrição `Writing on engineering, tooling and agents.`, e responde 404 com `!EN_PUBLISHED`.

**Passo 4:** `npx vitest run tests/i18n tests/posts/rss.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 30: imagens OG inglesas

**Requisito:** REQ-015
**Arquivos:**
- Modificar: `src/lib/og/pages.ts`
- Teste: `tests/i18n/og-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { englishOgPages } from '../../src/lib/og/pages';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('English share cards', () => {
  it('has one card per English static page, keyed under en/', async () => {
    const pages = await englishOgPages(true);
    const keys = pages.map((page) => page.key);
    expect(keys).toEqual(expect.arrayContaining(['en', 'en/about', 'en/contact', 'en/portfolio', 'en/lab', 'en/posts', 'en/now', 'en/setup', 'en/mcp', 'en/privacy', 'en/resume']));
    for (const page of pages) expect(ptLeftovers(`<p>${page.title} ${page.eyebrow}</p>`)).toEqual([]);
  });

  it('has none while English is not live', async () => {
    expect(await englishOgPages(false)).toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/og-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `ogKey('/en')` já dá `en` e `ogKey('/en/about')` dá `en/about`, então `ogImagePath` não muda. Crie `englishOgPages(live = EN_PUBLISHED)`: títulos e eyebrows ingleses dos estáticos (do dicionário e das funções de cópia por idioma), mais os cases e posts de `getAllProjects('en')` e `getAllPosts('en')` com `toLongDate(post.date, 'en')`. `ogPages()` passa a devolver `[...pt, ...(await englishOgPages())]`.

**Passo 4:** `npx vitest run tests/i18n tests/og`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 31: visão IA em inglês

**Requisito:** REQ-016
**Arquivos:**
- Modificar: `src/lib/ai-view/registry.ts`, `src/lib/ai-view/pages.ts`, `src/pages/[...path]/ia.astro`
- Teste: `tests/i18n/ai-view-en.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { markdownForPathIn } from '../../src/lib/ai-view/registry';
import { ptLeftovers } from '../helpers/pt-leftovers';

const site = new URL('https://nandomoreira.dev');

describe('English AI view', () => {
  it.each(['en', 'en/about', 'en/contact', 'en/portfolio', 'en/lab', 'en/posts', 'en/setup', 'en/now', 'en/privacy', 'en/mcp'])(
    '%s has an English markdown mirror',
    async (path) => {
      const page = await markdownForPathIn(site, path, true);
      expect(page?.humanPath).toBe(`/${path}`);
      expect(page?.mdPath).toBe(path === 'en' ? '/en/index.md' : `/${path}.md`);
      expect(ptLeftovers(page!.markdown.replace(/```[\s\S]*?```/g, ''))).toEqual([]);
    },
  );

  it('has no English archive and nothing while not live', async () => {
    expect(await markdownForPathIn(site, 'en/posts/arquivo', true)).toBeUndefined();
    expect(await markdownForPathIn(site, 'en/about', false)).toBeUndefined();
  });

  it('keeps every pt-BR key', async () => {
    expect((await markdownForPathIn(site, 'sobre', false))?.humanPath).toBe('/sobre');
  });
});
```

O markdown da home inglesa (`en`) cita nomes de cases em português até a `i18n-content`; se o `ptLeftovers` reprovar por causa de um título de case, mova `en` para um `it` próprio com o comentário `// cases are translated in i18n-content` e só a checagem de `humanPath`.

**Passo 2:** `npx vitest run tests/i18n/ai-view-en.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `markdownForPathIn(site, path, live)` é o `markdownForPath` atual com o idioma: `const locale = localeOfPath('/' + key)`; com `en` e `!live`, devolve `undefined`; então resolve a chave pt-BR por `staticCounterpart(withLocale)` (ou pelo slug do post ou case inglês, via camada de acesso) e chama os mesmos construtores de `pages.ts`, agora com `locale` (cada um recebe `locale` e lê textos do dicionário e das funções de cópia por idioma). `markdownForPath(site, path)` vira `markdownForPathIn(site, path, EN_PUBLISHED)`, e as duas rotas genéricas não mudam. A `ia.astro` monta título e descrição pelo dicionário (`IA`/`AI`, `Visão IA de`/`AI view of`).

**Passo 4:** `npx vitest run tests/i18n tests/ai-view`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 32: nenhum literal pt-BR nas páginas inglesas

**Requisito:** REQ-008
**Arquivos:**
- Criar: `tests/i18n/no-pt-in-en.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer
- Reviewers: test-reviewer

**Passo 1: o portão.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutPage from '../../src/components/pages/AboutPage.astro';
import CollectionPage from '../../src/components/pages/CollectionPage.astro';
import ContactPage from '../../src/components/pages/ContactPage.astro';
import HomePage from '../../src/components/pages/HomePage.astro';
import McpPage from '../../src/components/pages/McpPage.astro';
import NotFoundPage from '../../src/components/pages/NotFoundPage.astro';
import NowPage from '../../src/components/pages/NowPage.astro';
import PostsPage from '../../src/components/pages/PostsPage.astro';
import PrivacyPage from '../../src/components/pages/PrivacyPage.astro';
import ResumePage from '../../src/components/pages/ResumePage.astro';
import SetupPage from '../../src/components/pages/SetupPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const PAGES = [
  ['/en', HomePage, {}],
  ['/en/about', AboutPage, {}],
  ['/en/contact', ContactPage, {}],
  ['/en/resume', ResumePage, {}],
  ['/en/mcp', McpPage, {}],
  ['/en/setup', SetupPage, {}],
  ['/en/now', NowPage, {}],
  ['/en/privacy', PrivacyPage, {}],
  ['/en/posts', PostsPage, {}],
  ['/en/portfolio', CollectionPage, { collection: 'portfolio' }],
  ['/en/lab', CollectionPage, { collection: 'lab' }],
  ['/en/missing', NotFoundPage, {}],
] as const;

describe('English pages carry no Portuguese interface text', () => {
  it.each(PAGES)('%s', async (url, component, props) => {
    const html = await (await AstroContainer.create()).renderToString(component as never, {
      props: { ...props, locale: 'en' },
      request: new Request(`https://nandomoreira.dev${url}`),
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('proves the gate can fail', () => {
    expect(ptLeftovers('<p>Ver todos</p>')).not.toEqual([]);
  });
});
```

**Passo 2:** `npx vitest run tests/i18n/no-pt-in-en.test.ts`. Esperado: PASS se os lotes anteriores estão completos. Qualquer falha nomeia a palavra; corrija o componente (nunca a lista de marcadores, salvo nome próprio legítimo com justificativa no comentário).

**Passo 3:** a NowPage depende de dublês das fontes externas: reaproveite os de `tests/now/`.

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Lote F: documentação e verificação

### Tarefa 33: registrar a reversão e as regras novas

**Requisito:** Contexto da spec (reversão), D9
**Arquivos:**
- Modificar: `docs/specs/00-roadmap.md`, `docs/MVP-SCOPE.md`, `CLAUDE.md`

**Time:**
- Track: docs
- Implementer: rpi-implementer
- Reviewers: self-review

**Passos:**

1. `docs/specs/00-roadmap.md`: na tabela de features, troque a linha `english-pages` por `i18n-foundation`, `i18n-content` e `i18n-sales` (prioridade P1, alvo 2026-10). No Decision Log, acrescente: `2026-10-19: versão inglesa completa (i18n-foundation/content/sales) substitui a F15 english-pages e reverte "bilíngue completo descartado" do MVP-SCOPE; pedido do Fernando, sem esperar a H3.`
2. `docs/MVP-SCOPE.md`, seção Idioma: acrescente `- **Revisto em 2026-10-19:** bilíngue completo adotado; ver docs/specs/i18n-foundation/SPEC.md`. Não apague o histórico.
3. `CLAUDE.md`:
   - Seção **Idioma**: "Camada humana em pt-BR e em inglês (`/en`, ver `docs/specs/i18n-foundation`); camada de máquina em inglês." Acrescente: "Toda string de interface sai de `src/lib/i18n/messages/`; chave nova vai nos dois arquivos."
   - Seção **Restrições**, JavaScript de cliente: acrescente a sugestão de idioma (i18n-foundation, 2026-10-19) à lista do script do `PointerField`.
   - Nova subseção em **Arquitetura**, `### Idiomas (docs/specs/i18n-foundation)`: pt-BR na raiz e inglês em `/en`; mapa em `src/lib/i18n/routes.ts`; alternados em `alternates.ts`; páginas em `src/components/pages/` com cascas em `src/pages/` e `src/pages/en/`; `EN_LIVE` em `src/lib/i18n/live.ts`; slug `en` reservado.
   - Tabela de portões: acrescente `Paridade do dicionário` (`tests/i18n/messages.test.ts`) e `Nenhum pt-BR nas páginas inglesas` (`tests/i18n/no-pt-in-en.test.ts`), e mude "Sete testes" para "Nove testes".
   - Corrija o parágrafo "Estado atual", que está desatualizado: troque-o por uma linha dizendo que as sprints 1 a 4 e as features listadas em `docs/specs/` estão implementadas, e que a i18n está em andamento.

**Verificação:** `grep -n 'i18n' CLAUDE.md docs/specs/00-roadmap.md docs/MVP-SCOPE.md` mostra as entradas, e nenhum travessão novo (`grep -nP '[\x{2013}\x{2014}]' CLAUDE.md` sem linhas novas).

**Commit:** `/git commit`.

---

### Tarefa 34: verificação ponta a ponta

**Requisito:** critérios de aceite
**Arquivos:**
- Criar: `scripts/verify-i18n-routes.sh`

**Time:**
- Track: infra
- Implementer: infra-engineer (skills: bash-linux)
- Reviewers: consequences-reviewer

**Passo 1: o script.** No mesmo formato de `scripts/verify-aeo-routes.sh` (leia-o e reaproveite a subida e a derrubada do servidor): faz um build, sobe `dist/server/entry.mjs` em `PORT` (padrão 4932) e confere:

- `MODE=production` (build normal, `EN_LIVE=false`): `/en`, `/en/about` e `/en/the-anything` respondem 404; `/sobre` responde 200 sem `hreflang` e sem `data-language-switch`.
- `npm run build -- --mode staging` e servidor de novo: `/en`, `/en/about`, `/en/contact`, `/en/resume`, `/en/mcp`, `/en/setup`, `/en/now`, `/en/privacy`, `/en/posts`, `/en/portfolio` e `/en/lab` respondem 200 com `<html lang="en"`; `/sobre` traz `hreflang="en"`; `/en/rss.xml` responde 200 com `<language>en</language>`; `/en/about.md` responde 200 com `text/markdown`.

Termina com `I18N ROUTES PASSED` só se tudo passou (use `set -eo pipefail` e uma função `fail` que imprime `FAIL: <motivo>` e sai com 1; sem `set -u`).

**Passo 2:** rode `bash scripts/verify-i18n-routes.sh > /tmp/i18n.log 2>&1; echo EXIT=$?; grep -E 'PASSED|FAIL' /tmp/i18n.log`. Esperado: `I18N ROUTES PASSED`. Prove que o script fica vermelho trocando temporariamente um `/en/about` esperado por `/en/aboutx` (e desfaça).

**Passo 3:** portão completo: `npm run verify > /tmp/verify.log 2>&1; echo EXIT=$?` e `bash scripts/verify-local-server.sh`. Esperado: `EXIT=0` e `ALL LOCAL CHECKS PASSED`.

**Passo 4:** atualize `docs/specs/i18n-foundation/STATE.md` com `phase: implemented` e as evidências (as linhas de marca).

**Passo 5:** `/git commit`.
