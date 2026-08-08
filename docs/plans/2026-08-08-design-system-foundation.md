# Plan: Fundação do design system

> **Spec:** `docs/specs/design-system-foundation/SPEC.md`

**Goal:** Colocar em código os tokens, o layout base e os sete componentes de `DESIGN-GUIDELINES.md`, com portões automatizados que impedem literal fora da escala, JavaScript de cliente e contraste reprovado.
**Architecture:** Tailwind CSS 4 via plugin Vite, com o tema inteiro declarado em `@theme` dentro de `src/styles/global.css` — uma única fonte de verdade, no CSS. Componentes em Astro puro sob `src/components/ui/`, sem estado de cliente. Um layout base (`src/layouts/BaseLayout.astro`) concentra skip link, marco `main`, container e carregamento de fonte. Três testes de portão sustentam as regras que sem automação viram sugestão: contraste, literal fora da escala e ausência de JavaScript no bundle.
**Tech Stack:** Astro 7.2.0, Tailwind CSS 4.x, TypeScript 5.x, Vitest, `experimental_AstroContainer`, Lucide (importação por ícone).
**Total Tasks:** 14
**Estimated Complexity:** large (9+ tasks)

---

## Verificação de caminhos (§3.5)

`Files: Modify` declarados: **2** (`astro.config.mjs`, `src/pages/index.astro`). Ambos
são criados pelo plano da sprint 1 (`2026-08-08-infra-deploy-spike.md`, Tasks 2 e 5).
Existentes no momento da escrita deste plano: **0** — o repositório ainda só tem
`docs/`.

**Portão:** rodar a checagem de existência no início da execução, não agora. Se a
sprint 1 não tiver rodado, as duas tarefas que declaram `Modify` (Task 1 e Task 14)
falham a verificação e o plano não deve começar. É o gate F8.1 se manifestando como
checagem de caminho.

---

### Task 1: Instalar Tailwind CSS 4

**Requirement:** REQ-001
**Files:**

- Modify: `astro.config.mjs`
- Modify: `package.json`
- Create: `src/styles/global.css`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

`tests/design-system/tailwind.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tailwind setup', () => {
  it('loads tailwind through the vite plugin, not a config file', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toContain('@tailwindcss/vite');
  });

  it('keeps the theme in CSS, so there is a single source of truth', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain('@theme');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/tailwind.test.ts`
Expected: FAIL com `ENOENT ... src/styles/global.css`.

**Step 3: Write minimal implementation**

```bash
npm install -D @tailwindcss/vite tailwindcss
```

`astro.config.mjs` (adicionar o bloco `vite`, preservando o resto):

```js
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nandomoreira.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

`src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  /* placeholder: os tokens entram na Task 2 */
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/tailwind.test.ts && npm run build`
Expected: PASS, `Tests 2 passed`, e o build conclui sem erro.

**Step 5: Commit**

Run: `/git commit`

---

### Task 2: Declarar os tokens no CSS

**Requirement:** REQ-001, REQ-003, REQ-010
**Files:**

- Modify: `src/styles/global.css`
- Test: `tests/design-system/tokens.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 1

**Step 1: Write the failing test**

`tests/design-system/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

const COLOR_TOKENS = {
  '--color-background': '#0a0a0a',
  '--color-surface': '#171717',
  '--color-surface-elevated': '#262626',
  '--color-border': '#262626',
  '--color-border-strong': '#404040',
  '--color-foreground': '#fafafa',
  '--color-muted-foreground': '#a3a3a3',
  '--color-primary': '#f59e0b',
  '--color-primary-foreground': '#0a0a0a',
  '--color-success': '#22c55e',
  '--color-warning': '#eab308',
  '--color-destructive': '#ef4444',
};

const SPACING_TOKENS = {
  '--spacing-xs': '0.25rem',
  '--spacing-sm': '0.5rem',
  '--spacing-md': '1rem',
  '--spacing-lg': '1.5rem',
  '--spacing-xl': '2.5rem',
  '--spacing-2xl': '4rem',
  '--spacing-3xl': '6rem',
};

const RADIUS_TOKENS = {
  '--radius-sm': '0.25rem',
  '--radius-md': '0.5rem',
  '--radius-lg': '0.75rem',
  '--radius-full': '9999px',
};

const MOTION_TOKENS = {
  '--duration-fast': '150ms',
  '--duration-base': '250ms',
};

describe('design tokens', () => {
  it.each(Object.entries(COLOR_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(SPACING_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(RADIUS_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(MOTION_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it('declares only two motion durations, per DESIGN-GUIDELINES', () => {
    const durations = css.match(/--duration-[a-z]+:/g) ?? [];
    expect(durations).toHaveLength(2);
  });

  it('ships a single dark theme, with no light-mode override', () => {
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).not.toContain('data-theme');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/tokens.test.ts`
Expected: FAIL, os `it.each` de cor/espaçamento/raio vermelhos (o `@theme` está vazio).

**Step 3: Write minimal implementation**

`src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  /* Base palette */
  --color-background: #0a0a0a;
  --color-surface: #171717;
  --color-surface-elevated: #262626;
  --color-border: #262626;
  --color-border-strong: #404040;
  --color-foreground: #fafafa;
  --color-muted-foreground: #a3a3a3;

  /* Accent */
  --color-primary: #f59e0b;
  --color-primary-foreground: #0a0a0a;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-destructive: #ef4444;

  /* Families */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Type scale */
  --text-display: 3rem;
  --text-display--line-height: 1.1;
  --text-h1: 2.25rem;
  --text-h1--line-height: 1.2;
  --text-h2: 1.5rem;
  --text-h2--line-height: 1.3;
  --text-h3: 1.25rem;
  --text-h3--line-height: 1.4;
  --text-body: 1rem;
  --text-body--line-height: 1.625;
  --text-small: 0.875rem;
  --text-small--line-height: 1.5;
  --text-mono: 0.875rem;
  --text-mono--line-height: 1.6;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2.5rem;
  --spacing-2xl: 4rem;
  --spacing-3xl: 6rem;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);

  /* Layout */
  --container-page: 1200px;
}

@layer base {
  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
  }
}
```

O `display` cresce para 3.75rem em desktop; isso é responsabilidade da classe
utilitária no componente, não de um segundo token.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/tokens.test.ts`
Expected: PASS, todos os `it.each` verdes.

**Step 5: Commit**

Run: `/git commit`

---

### Task 3: Utilitário de contraste e validação da paleta

**Requirement:** REQ-004
**Files:**

- Create: `src/lib/contrast.ts`
- Test: `tests/design-system/contrast.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

`tests/design-system/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

const BACKGROUND = '#0a0a0a';
const SURFACE = '#171717';

describe('contrastRatio', () => {
  it('matches the WCAG 2.1 reference for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#f59e0b', BACKGROUND)).toBeCloseTo(
      contrastRatio(BACKGROUND, '#f59e0b'),
      5,
    );
  });
});

describe('palette contrast, as declared in DESIGN-GUIDELINES.md', () => {
  const PASSING: Array<[string, string, string, number]> = [
    ['foreground', '#fafafa', BACKGROUND, 18.97],
    ['muted-foreground', '#a3a3a3', BACKGROUND, 7.85],
    ['muted-foreground on surface', '#a3a3a3', SURFACE, 7.11],
    ['primary', '#f59e0b', BACKGROUND, 9.22],
    ['primary on surface', '#f59e0b', SURFACE, 8.35],
    ['success', '#22c55e', BACKGROUND, 8.69],
    ['destructive', '#ef4444', BACKGROUND, 5.26],
  ];

  it.each(PASSING)('%s hits the documented ratio', (_name, fg, bg, expected) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(expected, 1);
  });

  it.each(PASSING)('%s clears WCAG AA for body text', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('confirms border fails AA, which is why it can never delimit a target alone', () => {
    const ratio = contrastRatio('#262626', BACKGROUND);
    expect(ratio).toBeCloseTo(1.31, 1);
    expect(ratio).toBeLessThan(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/contrast.test.ts`
Expected: FAIL com `Failed to resolve import "../../src/lib/contrast"`.

**Step 3: Write minimal implementation**

`src/lib/contrast.ts`:

```ts
/** WCAG 2.1 relative luminance and contrast ratio. */

const parseHex = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    throw new Error(`Expected a 6-digit hex color, received "${hex}"`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
};

const linearize = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex).map(linearize) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/contrast.test.ts`
Expected: PASS. Se algum par divergir do documentado, a divergência é do documento e
precisa ser corrigida em `DESIGN-GUIDELINES.md` antes de seguir — não relaxar o teste.

**Step 5: Commit**

Run: `/git commit`

---

### Task 4: Portão contra literal fora da escala

**Requirement:** REQ-002
**Files:**

- Create: `tests/design-system/no-ad-hoc-values.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/design-system/no-ad-hoc-values.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const TOKEN_FILE = 'src/styles/global.css';

const collectSources = async (): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of glob('src/**/*.{astro,css,ts}')) {
    if (relative('.', entry) !== TOKEN_FILE) files.push(entry);
  }
  return files;
};

describe('no ad-hoc values outside the scale', () => {
  it('never hardcodes a hex color outside the token file', async () => {
    const offenders: string[] = [];

    for (const file of await collectSources()) {
      const source = readFileSync(file, 'utf8');
      const matches = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });

  it('never uses a Tailwind arbitrary value, which bypasses the scale', async () => {
    const offenders: string[] = [];

    for (const file of await collectSources()) {
      const source = readFileSync(file, 'utf8');
      const matches = source.match(/\b(p|m|gap|w|h|text|rounded)[a-z]*-\[[^\]]+\]/g) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });
});
```

`join` fica importado para uso posterior no relatório; se o lint reclamar de import não
usado, remover — não silenciar a regra.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/no-ad-hoc-values.test.ts`
Expected: FAIL na primeira asserção, porque `src/pages/index.astro` da sprint 1 ainda é
placeholder. Se por acaso passar de primeira, introduzir deliberadamente um
`bg-[#ff0000]` num arquivo de teste temporário para provar que o portão pega, e só
então removê-lo. Um portão que nunca ficou vermelho não é portão.

**Step 3: Write minimal implementation**

Nenhuma implementação de produção: esta tarefa entrega o portão. O verde vem quando a
Task 14 limpar a home placeholder.

**Step 4: Run test to verify it passes**

Não se aplica nesta tarefa. O teste fica vermelho até a Task 14 e isso é esperado;
registrar no commit.

**Step 5: Commit**

Run: `/git commit`

---

### Task 5: Fontes locais

**Requirement:** REQ-005
**Files:**

- Create: `public/fonts/inter-latin-400.woff2`
- Create: `public/fonts/inter-latin-500.woff2`
- Create: `public/fonts/inter-latin-600.woff2`
- Create: `public/fonts/jetbrains-mono-latin-400.woff2`
- Create: `public/fonts/jetbrains-mono-latin-500.woff2`
- Modify: `src/styles/global.css`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `security-reviewer`, `type-safety-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/design-system/fonts.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

const FONT_FILES = [
  'public/fonts/inter-latin-400.woff2',
  'public/fonts/inter-latin-500.woff2',
  'public/fonts/inter-latin-600.woff2',
  'public/fonts/jetbrains-mono-latin-400.woff2',
  'public/fonts/jetbrains-mono-latin-500.woff2',
];

describe('fonts', () => {
  it.each(FONT_FILES)('ships %s from our own origin', (file) => {
    expect(existsSync(file)).toBe(true);
  });

  it('never requests a font from a third-party host', () => {
    expect(css).not.toContain('fonts.googleapis.com');
    expect(css).not.toContain('fonts.gstatic.com');
    expect(css).not.toMatch(/@import\s+url\(\s*["']?https?:/);
  });

  it('swaps rather than blocking, so text is never invisible while loading', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(faces.length).toBe(FONT_FILES.length);
    for (const face of faces) {
      expect(face).toContain('font-display: swap');
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/fonts.test.ts`
Expected: FAIL, os cinco `it.each` de existência vermelhos.

**Step 3: Write minimal implementation**

Baixar os arquivos woff2 com subset latino (Inter 400/500/600, JetBrains Mono 400/500)
para `public/fonts/`. Usar as distribuições oficiais dos projetos, não um CDN de
terceiro em runtime.

Acrescentar em `src/styles/global.css`, antes do bloco `@theme`:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}

@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}

@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-600.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-latin-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-latin-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}
```

O `unicode-range` cobre latino básico mais os acentos do português. Sem ele, o subset
não é subset.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/fonts.test.ts`
Expected: PASS, `Tests 7 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 6: Layout base com skip link e container

**Requirement:** REQ-011, REQ-012, REQ-015
**Files:**

- Create: `src/layouts/BaseLayout.astro`
- Test: `tests/design-system/base-layout.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2, Task 5

**Step 1: Write the failing test**

`tests/design-system/base-layout.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: { title: 'Título', description: 'Descrição da página' },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('BaseLayout', () => {
  it('declares the page language as Brazilian Portuguese', async () => {
    expect(await render()).toContain('lang="pt-BR"');
  });

  it('offers a skip link as the first focusable element', async () => {
    const html = await render();
    const skipIndex = html.indexOf('href="#main"');
    const mainIndex = html.indexOf('id="main"');

    expect(skipIndex).toBeGreaterThan(-1);
    expect(skipIndex).toBeLessThan(mainIndex);
  });

  it('exposes exactly one main landmark', async () => {
    const html = await render();
    expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
  });

  it('prevents horizontal overflow on the page body', async () => {
    expect(await render()).toContain('overflow-x-hidden');
  });

  it('caps the container width at the layout token', async () => {
    expect(await render()).toContain('max-w-(--container-page)');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/base-layout.test.ts`
Expected: FAIL com `Failed to resolve import "../../src/layouts/BaseLayout.astro"`.

**Step 3: Write minimal implementation**

`src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  noindex?: boolean;
}

const { title, description, noindex = false } = Astro.props;
---

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex" />}
    <link
      rel="preload"
      href="/fonts/inter-latin-400.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
  </head>
  <body class="overflow-x-hidden bg-background text-foreground">
    <a
      href="#main"
      class="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-md focus-visible:left-md focus-visible:z-10 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-md focus-visible:py-sm focus-visible:text-primary-foreground"
    >
      Pular para o conteúdo
    </a>

    <div class="mx-auto w-full max-w-(--container-page) px-md">
      <main id="main">
        <slot />
      </main>
    </div>
  </body>
</html>
```

O skip link fica visualmente escondido até receber foco, e aparece com `primary` de
fundo (9,22:1 sobre o fundo da página).

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/base-layout.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 7: Movimento e `prefers-reduced-motion`

**Requirement:** REQ-009, REQ-010
**Files:**

- Modify: `src/styles/global.css`
- Test: `tests/design-system/motion.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/design-system/motion.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

describe('motion', () => {
  it('honours the reduced-motion preference', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('keeps state changes visible when motion is suppressed', () => {
    const block = css.slice(css.indexOf('prefers-reduced-motion'));
    expect(block).toContain('animation-duration: 0.01ms');
    expect(block).toContain('transition-duration: 0.01ms');
    expect(block).not.toContain('display: none');
  });

  it('only ever transitions transform and opacity by default', () => {
    expect(css).toContain('transition-property: transform, opacity');
  });
});
```

Suprimir movimento com duração de 0.01ms em vez de `none` preserva o disparo dos
eventos de transição, que alguns componentes usam para saber que o estado mudou.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/motion.test.ts`
Expected: FAIL nas três asserções.

**Step 3: Write minimal implementation**

Acrescentar ao final de `src/styles/global.css`:

```css
@layer base {
  .motion-safe-default {
    transition-property: transform, opacity;
    transition-duration: var(--duration-fast);
    transition-timing-function: var(--ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/motion.test.ts`
Expected: PASS, `Tests 3 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 8: Componente `Button`

**Requirement:** REQ-006, REQ-007
**Files:**

- Create: `src/components/ui/Button.astro`
- Test: `tests/components/button.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2, Task 7

**Step 1: Write the failing test**

`tests/components/button.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from '../../src/components/ui/Button.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(Button, {
    props,
    slots: { default: 'Ver projetos' },
  });
};

describe('Button', () => {
  it('renders an anchor when given an href, and a button otherwise', async () => {
    expect(await render({ href: '/projetos' })).toContain('<a');
    expect(await render()).toContain('<button');
  });

  it.each(['hover:', 'focus-visible:', 'active:', 'disabled:'])(
    'declares the %s state',
    async (state) => {
      expect(await render()).toContain(state);
    },
  );

  it('uses the accent as the focus indicator', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('meets the 44px touch target', async () => {
    expect(await render()).toContain('min-h-11');
  });

  it('never relies on the low-contrast border alone to delimit itself', async () => {
    const html = await render({ variant: 'secondary' });
    expect(html).toContain('border-border-strong');
    expect(html).not.toMatch(/\bborder-border\b/);
  });

  it('keeps a disabled button readable rather than merely faded', async () => {
    const html = await render({ disabled: true });
    expect(html).toContain('disabled');
    expect(html).toContain('aria-disabled="true"');
  });
});
```

`min-h-11` equivale a 2.75rem, ou seja 44px, com a base de 4px do Tailwind.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/button.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/ui/Button.astro`:

```astro
---
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  label?: string;
}

const { href, variant = 'primary', disabled = false, label } = Astro.props;

const base = [
  'inline-flex items-center justify-center gap-xs',
  'min-h-11 min-w-11 px-md py-sm',
  'rounded-md text-body font-medium',
  'transition-[transform,opacity,background-color,border-color]',
  'duration-[--duration-fast] ease-[--ease-out]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const variants = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 active:opacity-80',
  secondary:
    'border border-border-strong bg-surface text-foreground hover:border-primary active:bg-surface-elevated',
  ghost: 'text-foreground hover:text-primary active:opacity-80',
} as const;

const className = `${base} ${variants[variant]}`;
const Tag = href ? 'a' : 'button';
---

<Tag
  class={className}
  href={href}
  aria-label={label}
  aria-disabled={disabled ? 'true' : undefined}
  disabled={!href && disabled ? true : undefined}
>
  <slot />
</Tag>
```

A variante `secondary` usa `border-strong` (contraste suficiente) e nunca `border`,
conforme REQ-004.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/button.test.ts`
Expected: PASS, `Tests 9 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 9: Componentes `TechBadge` e `SectionHeader`

**Requirement:** REQ-002, REQ-004
**Files:**

- Create: `src/components/ui/TechBadge.astro`
- Create: `src/components/ui/SectionHeader.astro`
- Test: `tests/components/badge-and-header.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/components/badge-and-header.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionHeader from '../../src/components/ui/SectionHeader.astro';
import TechBadge from '../../src/components/ui/TechBadge.astro';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, { props });
};

describe('TechBadge', () => {
  it('always carries the technology name as text, never colour alone', async () => {
    expect(await render(TechBadge, { name: 'Astro' })).toContain('Astro');
  });

  it('wraps a long name instead of pushing the layout sideways', async () => {
    const html = await render(TechBadge, { name: 'model-context-protocol-sdk' });
    expect(html).toContain('break-words');
    expect(html).toContain('max-w-full');
  });

  it('uses the mono family, per the typography rules', async () => {
    expect(await render(TechBadge, { name: 'Zod' })).toContain('font-mono');
  });
});

describe('SectionHeader', () => {
  it('renders the heading level it is told to, so hierarchy never skips', async () => {
    const html = await render(SectionHeader, { title: 'Projetos', level: 2 });
    expect(html).toContain('<h2');
  });

  it('hides the terminal-style numbering from assistive technology', async () => {
    const html = await render(SectionHeader, { title: 'Projetos', level: 2, index: 1 });
    expect(html).toContain('aria-hidden="true"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/badge-and-header.test.ts`
Expected: FAIL com imports não resolvidos.

**Step 3: Write minimal implementation**

`src/components/ui/TechBadge.astro`:

```astro
---
interface Props {
  name: string;
}

const { name } = Astro.props;
---

<span
  class="inline-block max-w-full rounded-sm border border-border bg-surface px-sm py-xs font-mono text-small break-words text-muted-foreground"
>
  {name}
</span>
```

Aqui `border` é aceitável: o badge é decorativo e não é alvo interativo, então a regra
de REQ-004 não se aplica.

`src/components/ui/SectionHeader.astro`:

```astro
---
interface Props {
  title: string;
  level?: 2 | 3;
  index?: number;
  description?: string;
}

const { title, level = 2, index, description } = Astro.props;
const Heading = `h${level}` as 'h2' | 'h3';
const sizes = { 2: 'text-h2', 3: 'text-h3' } as const;
---

<header class="mb-lg flex flex-col gap-xs">
  <Heading class={`${sizes[level]} font-semibold text-foreground`}>
    {index !== undefined && (
      <span class="mr-sm font-mono text-small text-primary" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
    )}
    {title}
  </Heading>
  {description && <p class="text-body text-muted-foreground">{description}</p>}
</header>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/badge-and-header.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 10: Componentes `CodeBlock` e `StatItem`

**Requirement:** REQ-002
**Files:**

- Create: `src/components/ui/CodeBlock.astro`
- Create: `src/components/ui/StatItem.astro`
- Test: `tests/components/code-and-stat.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/components/code-and-stat.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CodeBlock from '../../src/components/ui/CodeBlock.astro';
import StatItem from '../../src/components/ui/StatItem.astro';

const render = async (
  component: unknown,
  props: Record<string, unknown>,
  slot?: string,
) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, {
    props,
    slots: slot ? { default: slot } : undefined,
  });
};

describe('CodeBlock', () => {
  it('labels the language, so the reader knows what they are looking at', async () => {
    const html = await render(CodeBlock, { language: 'bash' }, 'curl /api/mcp');
    expect(html).toContain('bash');
  });

  it('scrolls inside its own container instead of widening the page', async () => {
    const html = await render(CodeBlock, { language: 'json' }, '{}');
    expect(html).toContain('overflow-x-auto');
  });
});

describe('StatItem', () => {
  it('refuses a number without context, which RISK-004 forbids', async () => {
    await expect(render(StatItem, { value: '964' })).rejects.toThrow(/context/i);
  });

  it('renders the number together with the narrative that explains it', async () => {
    const html = await render(StatItem, {
      value: '964',
      label: 'estrelas no GitHub',
      context: 'cerca de 700 vêm de temas Jekyll de 2018',
    });

    expect(html).toContain('964');
    expect(html).toContain('estrelas no GitHub');
    expect(html).toContain('cerca de 700 vêm de temas Jekyll de 2018');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/code-and-stat.test.ts`
Expected: FAIL com imports não resolvidos.

**Step 3: Write minimal implementation**

`src/components/ui/CodeBlock.astro`:

```astro
---
interface Props {
  language: string;
}

const { language } = Astro.props;
---

<figure class="my-lg overflow-hidden rounded-lg border border-border bg-surface">
  <figcaption
    class="border-b border-border px-md py-sm font-mono text-small text-muted-foreground"
  >
    {language}
  </figcaption>
  <pre class="overflow-x-auto p-md font-mono text-mono text-foreground"><code><slot /></code></pre>
</figure>
```

`src/components/ui/StatItem.astro`:

```astro
---
interface Props {
  value: string;
  label: string;
  context: string;
}

const { value, label, context } = Astro.props;

if (!label || !context) {
  throw new Error(
    'StatItem requires both label and context: a bare number misleads (RISK-004).',
  );
}
---

<div class="flex flex-col gap-xs">
  <span class="font-mono text-h1 text-primary">{value}</span>
  <span class="text-body text-foreground">{label}</span>
  <span class="text-small text-muted-foreground">{context}</span>
</div>
```

O componente falha em build se alguém tentar renderizar número solto. É a regra de
RISK-004 codificada, não confiada à disciplina.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/code-and-stat.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 11: Fallback determinístico de imagem

**Requirement:** REQ-002 (edge case "ProjectCard sem imagem")
**Files:**

- Create: `src/lib/image-fallback.ts`
- Test: `tests/design-system/image-fallback.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `business-logic-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`tests/design-system/image-fallback.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { initialsFromSlug } from '../../src/lib/image-fallback';

describe('initialsFromSlug', () => {
  it('takes the first letter of each hyphen-separated word', () => {
    expect(initialsFromSlug('amnesia-claude-code')).toBe('AC');
  });

  it('falls back to the first two letters for a single-word slug', () => {
    expect(initialsFromSlug('forja')).toBe('FO');
  });

  it('is deterministic: the same slug always yields the same initials', () => {
    expect(initialsFromSlug('devkit-claude-plugins')).toBe(
      initialsFromSlug('devkit-claude-plugins'),
    );
  });

  it('never returns more than two characters', () => {
    expect(initialsFromSlug('a-b-c-d-e-f')).toHaveLength(2);
  });

  it('rejects an empty slug rather than rendering a blank card', () => {
    expect(() => initialsFromSlug('')).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/image-fallback.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/image-fallback.ts`:

```ts
/**
 * Deterministic visual fallback for a project without an image.
 * The same slug must always produce the same initials, so a returning
 * visitor never sees the card change identity between visits.
 */
export const initialsFromSlug = (slug: string): string => {
  const words = slug.split('-').filter(Boolean);

  if (words.length === 0) {
    throw new Error('Cannot derive initials from an empty slug');
  }

  const initials =
    words.length === 1
      ? words[0].slice(0, 2)
      : words
          .slice(0, 2)
          .map((word) => word[0])
          .join('');

  return initials.toUpperCase();
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/design-system/image-fallback.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 12: Componentes `ProjectCard` e `Prose`

**Requirement:** REQ-004, REQ-007, REQ-014
**Files:**

- Create: `src/components/ui/ProjectCard.astro`
- Create: `src/components/ui/Prose.astro`
- Test: `tests/components/card-and-prose.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 9, Task 11

**Step 1: Write the failing test**

`tests/components/card-and-prose.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ProjectCard from '../../src/components/ui/ProjectCard.astro';
import Prose from '../../src/components/ui/Prose.astro';

const base = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  tech: ['Rust', 'Tauri'],
};

const renderCard = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectCard, { props: { ...base, ...props } });
};

describe('ProjectCard', () => {
  it('links the whole card to the case page', async () => {
    expect(await renderCard()).toContain('href="/projetos/forja"');
  });

  it('shows the deterministic fallback when there is no image', async () => {
    const html = await renderCard({ image: undefined });
    expect(html).toContain('FO');
    expect(html).not.toContain('<img');
  });

  it('shows the image when there is one', async () => {
    const html = await renderCard({
      image: { src: '/img/forja.png', alt: 'Tela do Forja' },
    });
    expect(html).toContain('<img');
    expect(html).toContain('alt="Tela do Forja"');
  });

  it('delimits its interactive surface with a perceivable border, not #262626', async () => {
    const html = await renderCard();
    expect(html).toContain('hover:border-border-strong');
  });

  it('exposes a visible focus ring, since the card is a link', async () => {
    expect(await renderCard()).toContain('focus-visible:outline-primary');
  });
});

describe('Prose', () => {
  it('caps the measure so long-form case text stays readable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, {
      slots: { default: '<p>texto</p>' },
    });

    expect(html).toContain('max-w-[68ch]');
  });
});
```

A medida de 68ch fica dentro da faixa de 65 a 75 caracteres pedida em
`DESIGN-GUIDELINES.md`. É a única exceção autorizada ao portão de valor arbitrário da
Task 4, porque `ch` é unidade relativa à fonte e não pertence à escala de espaçamento;
acrescentar `max-w-\[\d+ch\]` à allowlist do teste.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/card-and-prose.test.ts`
Expected: FAIL com imports não resolvidos.

**Step 3: Write minimal implementation**

`src/components/ui/ProjectCard.astro`:

```astro
---
import { initialsFromSlug } from '../../lib/image-fallback';
import TechBadge from './TechBadge.astro';

interface Props {
  slug: string;
  title: string;
  summary: string;
  tech: string[];
  image?: { src: string; alt: string };
}

const { slug, title, summary, tech, image } = Astro.props;
const initials = initialsFromSlug(slug);
---

<a
  href={`/projetos/${slug}`}
  class="group flex flex-col gap-md rounded-md border border-border bg-surface p-lg transition-[border-color,transform] duration-[--duration-fast] ease-[--ease-out] hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  {
    image ? (
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        class="aspect-video w-full rounded-sm object-cover"
      />
    ) : (
      <div
        class="flex aspect-video w-full items-center justify-center rounded-sm border border-border-strong bg-background font-mono text-h1 text-muted-foreground"
        aria-hidden="true"
      >
        {initials}
      </div>
    )
  }

  <h3 class="text-h3 font-semibold text-foreground">{title}</h3>
  <p class="text-body text-muted-foreground">{summary}</p>

  <ul class="flex flex-wrap gap-sm">
    {tech.map((item) => (
      <li>
        <TechBadge name={item} />
      </li>
    ))}
  </ul>
</a>
```

O fallback é `aria-hidden`: as iniciais são decoração, e o nome real do projeto já está
no `h3` logo abaixo. Anunciá-las ao leitor de tela seria ruído.

`src/components/ui/Prose.astro`:

```astro
---
---

<div
  class="max-w-[68ch] text-body leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-xl [&_h2]:text-h2 [&_h3]:mt-lg [&_h3]:text-h3 [&_p]:mt-md [&_table]:block [&_table]:overflow-x-auto"
>
  <slot />
</div>
```

`[&_table]:overflow-x-auto` é o que mantém tabela larga dentro do próprio container,
sem fazer o corpo da página rolar na horizontal (REQ-012).

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/card-and-prose.test.ts`
Expected: PASS, `Tests 6 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 13: Portão de zero JavaScript de cliente

**Requirement:** REQ-008
**Files:**

- Create: `tests/design-system/no-client-js.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 12

**Step 1: Write the failing test**

`tests/design-system/no-client-js.test.ts`:

```ts
import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CLIENT_ASSETS = 'dist/client/_astro';

describe('client bundle', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist')).toBe(true);
  });

  it('ships no client-side JavaScript, per the P0 architecture decision', () => {
    if (!existsSync(CLIENT_ASSETS)) return;

    const scripts = readdirSync(CLIENT_ASSETS).filter((file) => file.endsWith('.js'));
    expect(scripts).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/no-client-js.test.ts`
Expected: FAIL na primeira asserção se `dist/` não existir.

**Step 3: Write minimal implementation**

Nenhum código de produção: o portão só afirma o que já é verdade por decisão de
arquitetura. Ele existe para o dia em que alguém adicionar uma diretiva `client:*` sem
perceber a consequência. Acrescentar ao `package.json`:

```json
{
  "scripts": {
    "verify": "npm run check && npm run build && npm test"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npx vitest run tests/design-system/no-client-js.test.ts`
Expected: PASS, `Tests 2 passed`.

Nunca declarar este portão verde a partir do código de saída de um comando com pipe: o
status de um pipeline é o do último estágio. A evidência é a linha `Tests 2 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 14: Migrar a home placeholder para o layout base

**Requirement:** REQ-002, REQ-011
**Files:**

- Modify: `src/pages/index.astro`
- Test: `tests/design-system/no-ad-hoc-values.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 4, Task 6, Task 8

**Step 1: Write the failing test**

Reutiliza o portão da Task 4, que ainda está vermelho por causa do placeholder da
sprint 1.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design-system/no-ad-hoc-values.test.ts`
Expected: FAIL, apontando `src/pages/index.astro`.

**Step 3: Write minimal implementation**

`src/pages/index.astro`:

```astro
---
import Button from '../components/ui/Button.astro';
import SectionHeader from '../components/ui/SectionHeader.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="nandomoreira.dev"
  description="Engenheiro de produto com agentes de IA."
  noindex
>
  <SectionHeader
    title="nandomoreira.dev"
    level={2}
    description="Fundação do design system no ar. O conteúdo entra na sprint 3."
  />

  <Button href="/api/health" variant="secondary">Ver /api/health</Button>
</BaseLayout>
```

Segue com `noindex`: o conteúdo continua placeholder. A meta sai em
`launch-hardening`.

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS. Toda a suíte verde, incluindo o portão da Task 4, que finalmente fecha.

**Step 5: Commit**

Run: `/git commit`

---

## Depois do plano

Os três portões (contraste, literal fora da escala, zero JavaScript) passam a rodar em
`npm run verify` e valem para todas as sprints seguintes. `project-catalog` e
`home-page` consomem `BaseLayout` e os sete componentes sem redefinir nada.

REQ-016 (página interna de referência visual) fica pendente como P3. Reavaliar quando o
catálogo passar de oito cases.
