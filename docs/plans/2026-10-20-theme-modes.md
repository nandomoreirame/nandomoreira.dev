# Plan: theme-modes (Noir e Paper)

> **Spec:** docs/specs/theme-modes/SPEC.md

**Goal:** Dar ao site os temas Noir (atual) e Paper (variante clara do Terminal Noir), seguindo o sistema na primeira visita, com escolha lembrada e sem flash.
**Architecture:** Os tokens de cor continuam no `@theme`; dois blocos sem camada re-apontam os tokens para a Paper (`@media (prefers-color-scheme: light)` com `:root:not([data-theme="noir"])` e `:root[data-theme="paper"]`). Um script inline no `<head>` (quarta exceção nomeada de JS, marcador `data-theme-boot`) resolve o tema antes do paint e é dono do clique do botão, por delegação. O Shiki passa a emitir as duas variantes como variáveis CSS.
**Tech Stack:** Astro 7, Tailwind 4, Shiki (dual theme com os temas do Terminal Noir), Vitest, happy-dom, astro-icon (lucide).
**Total Tasks:** 12 (mais 5 no Terminal Noir, em `contrast-gate`)
**Estimated Complexity:** large
**Depends on:** `contrast-gate` do Terminal Noir (`~/dev/projects/terminalnoir/docs/plans/2026-10-20-contrast-gate.md`), implementada antes da tarefa 8: ela corrige a Paper e gera o port Shiki que este plano copia. Também `i18n-foundation` (plan-complete) também mexe em `src/layouts/BaseLayout.astro` e no header. Sequenciar: quem for implementado depois refaz o merge nesses dois arquivos.

---

## Notas para quem implementa

- Leia o `CLAUDE.md` do repositório antes. Os portões de design system nunca são relaxados.
- **Pare o dev server antes de começar** (`./node_modules/.bin/astro dev status`; se estiver rodando, `./node_modules/.bin/astro dev stop`). Esta feature não muda schema, mas a tarefa 8 muda o pipeline de markdown, e o dev serve o HTML antigo do store (ver "Armadilhas já pagas").
- Comandos com `./node_modules/.bin/vitest`, nunca `vitest` solto (shim do mise).
- Evidência de verificação é a linha de marca ou a contagem de testes no log, nunca o código de saída de um pipeline.
- Hex só em `src/styles/global.css` (portão `no-ad-hoc-values`).
- Comentários e identificadores em inglês; texto visível em pt-BR.

## Ordem e dependências

| Lote | Tarefas | Depende de |
|---|---|---|
| A | 1, 2 | nada |
| B | 3, 4, 5 | 1 (3), nada (4, 5) |
| C | 6, 7 | 4 (CSS do botão fica junto dos tokens) |
| D | 8 | 4 (bloco Paper já existe) e `contrast-gate` do Terminal Noir concluída |
| E | 9, 10 | 6, 7 |
| F | 11, 12 | todas |

---

### Task 1: Script de boot do tema

**Requirement:** REQ-003, REQ-005, REQ-006
**Files:**
- Create: `src/lib/theme/boot.ts`
- Test: `tests/theme/boot.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails, security-reviewer

**Step 1: Write the failing test**
```ts
import { Script, createContext } from 'node:vm';
import { gzipSync } from 'node:zlib';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { THEME_BOOT_BUDGET_BYTES, THEME_BOOT_MARKER, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';

interface BootOptions {
  stored?: string | null;
  light?: boolean;
  storageThrows?: boolean;
}

/**
 * Runs the real inline script against a fresh happy-dom window, so every test
 * starts with one click listener on its own document. vm is test-only: the
 * production page runs the same string as a plain <script>.
 */
const boot = ({ stored = null, light = false, storageThrows = false }: BootOptions = {}) => {
  const window = new Window();
  const { document } = window;
  document.body.innerHTML =
    '<button type="button" data-theme-toggle><svg><path></path></svg></button><p id="other">texto</p>';
  const listeners: Array<() => void> = [];
  const system = { matches: light, addEventListener: (_type: string, fn: () => void) => listeners.push(fn) };
  const store = new Map<string, string>(stored === null ? [] : [['theme', stored]]);
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error('blocked');
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (storageThrows) throw new Error('blocked');
      store.set(key, value);
    },
  };
  new Script(THEME_BOOT_SCRIPT).runInContext(
    createContext({ document, Element: window.Element, localStorage, matchMedia: () => system }),
  );
  const click = (selector: string) =>
    document.querySelector(selector)!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const changeSystem = (matches: boolean) => {
    system.matches = matches;
    listeners.forEach(fn => fn());
  };
  return { root: document.documentElement, store, click, changeSystem };
};

describe('theme boot script', () => {
  it('follows the system when nothing is stored (REQ-002, REQ-003)', () => {
    expect(boot({ light: true }).root.dataset.theme).toBe('paper');
    expect(boot({ light: false }).root.dataset.theme).toBe('noir');
  });

  it('lets a stored choice win over the system', () => {
    expect(boot({ stored: 'noir', light: true }).root.dataset.theme).toBe('noir');
    expect(boot({ stored: 'paper', light: false }).root.dataset.theme).toBe('paper');
  });

  it('treats an unknown stored value as no choice', () => {
    expect(boot({ stored: 'sepia', light: true }).root.dataset.theme).toBe('paper');
  });

  it('survives blocked storage and still follows the system', () => {
    expect(boot({ storageThrows: true, light: true }).root.dataset.theme).toBe('paper');
  });

  it('marks the root once it ran, which is what shows the toggle', () => {
    expect(boot().root.hasAttribute(THEME_BOOT_MARKER)).toBe(true);
  });

  it('flips the theme and stores it on a click inside the toggle (REQ-005)', () => {
    const page = boot({ light: false });
    page.click('[data-theme-toggle] path');
    expect(page.root.dataset.theme).toBe('paper');
    expect(page.store.get('theme')).toBe('paper');
    page.click('[data-theme-toggle]');
    expect(page.root.dataset.theme).toBe('noir');
    expect(page.store.get('theme')).toBe('noir');
  });

  it('ignores clicks elsewhere', () => {
    const page = boot({ light: false });
    page.click('#other');
    expect(page.root.dataset.theme).toBe('noir');
    expect(page.store.has('theme')).toBe(false);
  });

  it('still flips for this page when storage is blocked', () => {
    const page = boot({ storageThrows: true, light: false });
    page.click('[data-theme-toggle]');
    expect(page.root.dataset.theme).toBe('paper');
  });

  it('follows a live system change only while nothing is chosen (REQ-006)', () => {
    const free = boot({ light: false });
    free.changeSystem(true);
    expect(free.root.dataset.theme).toBe('paper');

    const chosen = boot({ stored: 'noir', light: false });
    chosen.changeSystem(true);
    expect(chosen.root.dataset.theme).toBe('noir');

    const clicked = boot({ light: false });
    clicked.click('[data-theme-toggle]');
    clicked.changeSystem(false);
    expect(clicked.root.dataset.theme).toBe('paper');
  });

  it('carries its marker and stays within budget (REQ-010)', () => {
    expect(THEME_BOOT_SCRIPT).toContain(THEME_BOOT_MARKER);
    expect(gzipSync(THEME_BOOT_SCRIPT).length).toBeLessThanOrEqual(THEME_BOOT_BUDGET_BYTES);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/theme/boot.test.ts`
Expected: FAIL with "Failed to load url ../../src/lib/theme/boot" (o módulo não existe).

**Step 3: Write minimal implementation**
```ts
/**
 * Theme boot (docs/specs/theme-modes, REQ-003, REQ-005, REQ-006, REQ-010).
 *
 * Inlined in <head> by both layouts, so it runs before the first paint on every
 * route, pre-rendered ones included: a stored choice wins, otherwise the system
 * scheme decides. It also owns the toggle's click, by delegation on document,
 * so the pointer script's budget stays untouched. Storage can throw (private
 * window, blocked site data); the theme then lives for this page only.
 */
export const THEME_STORAGE_KEY = 'theme';
export const THEME_BOOT_MARKER = 'data-theme-boot';
export const THEME_BOOT_BUDGET_BYTES = 512;

export const THEME_BOOT_SCRIPT = `(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: light)');
  let stored = null;
  try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch {}
  const pick = () => (stored === 'noir' || stored === 'paper' ? stored : system.matches ? 'paper' : 'noir');
  root.dataset.theme = pick();
  root.setAttribute('${THEME_BOOT_MARKER}', '');
  system.addEventListener('change', () => { root.dataset.theme = pick(); });
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-theme-toggle]')) return;
    stored = root.dataset.theme === 'paper' ? 'noir' : 'paper';
    root.dataset.theme = stored;
    try { localStorage.setItem('${THEME_STORAGE_KEY}', stored); } catch {}
  });
})();`;
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/theme/boot.test.ts`
Expected: PASS (10 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 2: Quarta exceção no portão de JavaScript

**Requirement:** REQ-010
**Files:**
- Modify: `tests/helpers/client-scripts.ts:33-52`
- Modify: `tests/design-system/no-client-js.build-test.ts:96-104`
- Test: `tests/helpers/client-scripts.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, security-reviewer

**Step 1: Write the failing test**
Acrescente ao fim de `tests/helpers/client-scripts.test.ts`:
```ts
import { THEME_BOOT_BUDGET_BYTES, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';

describe('theme boot exception (theme-modes, REQ-010)', () => {
  it('accepts the theme boot on every page', () => {
    expect(
      scriptViolations([
        { route: '/', scripts: [THEME_BOOT_SCRIPT] },
        { route: '/sobre', scripts: [THEME_BOOT_SCRIPT] },
        { route: '/portfolio/forja', scripts: [THEME_BOOT_SCRIPT] },
      ]),
    ).toEqual([]);
  });

  it('rejects a theme boot over budget', () => {
    const bloated = `${THEME_BOOT_SCRIPT}/*${randomBytes(THEME_BOOT_BUDGET_BYTES * 2).toString('base64')}*/`;
    const [violation] = scriptViolations([{ route: '/', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/: theme boot is \d+ B gzip, budget 512$/);
  });
});
```
(O `import` vai para o topo do arquivo, junto dos outros.)

E, em `tests/design-system/no-client-js.build-test.ts`, logo depois do `it.each(['/', '/lab', '/sobre'] ...)`:
```ts
  it.each(['/', '/sobre', '/servicos'])('runs the theme boot inside <head> on %s (theme-modes, REQ-003)', async route => {
    const html = await (await fetch(`${BASE}${route}`)).text();
    const boot = html.indexOf(THEME_BOOT_MARKER);
    expect(boot).toBeGreaterThan(-1);
    expect(boot).toBeLessThan(html.indexOf('</head>'));
  });

  it('runs the theme boot inside <head> on every pre-rendered page', () => {
    for (const page of prerendered()) {
      expect(page.scripts.some(script => script.includes(THEME_BOOT_MARKER)), page.route).toBe(true);
    }
  });
```
com `import { THEME_BOOT_MARKER } from '../../src/lib/theme/boot';` no topo.

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/helpers/client-scripts.test.ts`
Expected: FAIL com `expected [ '/: script outside the allowlist', … ] to deeply equal []`.

**Step 3: Write minimal implementation**
Em `tests/helpers/client-scripts.ts`, importe e trate o boot antes do ponteiro:
```ts
import { THEME_BOOT_BUDGET_BYTES, THEME_BOOT_MARKER } from '../../src/lib/theme/boot';
```
```ts
/** The site-wide exceptions (generative-case-art REQ-012, theme-modes REQ-010) plus the /now one. */
export const scriptViolations = (pages: PageScripts[]): string[] =>
  pages.flatMap(({ route, scripts }) =>
    scripts.flatMap(script => {
      // Fourth named exception: the theme boot, inline in <head> on every page.
      if (script.includes(THEME_BOOT_MARKER)) {
        const size = gzipSync(script).length;
        return size > THEME_BOOT_BUDGET_BYTES
          ? [`${route}: theme boot is ${size} B gzip, budget ${THEME_BOOT_BUDGET_BYTES}`]
          : [];
      }
      if (script.includes(NOW_PREVIEW_MARKER)) {
        // … (inalterado daqui para baixo)
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/helpers/client-scripts.test.ts`
Expected: PASS. O build test só fica verde depois da tarefa 3 (roda na tarefa 12).

**Step 5: Commit**
Run: `/git commit`

---

### Task 3: Boot e `color-scheme` no `<head>` dos dois layouts

**Requirement:** REQ-003, REQ-001
**Depends on:** Task 1
**Files:**
- Modify: `src/layouts/BaseLayout.astro:1-23,76-80`
- Modify: `src/layouts/SalesLayout.astro:1-14,46-50`
- Test: `tests/design-system/base-layout.test.ts`, `tests/sales/layout.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
Em `tests/design-system/base-layout.test.ts` (dentro do `describe('BaseLayout')`), e o mesmo bloco em `tests/sales/layout.test.ts` usando o `render()` daquele arquivo:
```ts
  it('runs the theme boot inside <head>, before the title (theme-modes, REQ-003)', async () => {
    const html = await render();
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain(THEME_BOOT_SCRIPT);
    expect(head.indexOf(THEME_BOOT_MARKER)).toBeLessThan(head.indexOf('<title>'));
  });

  it('declares both colour schemes, so form controls and scrollbars follow the theme', async () => {
    expect(await render()).toContain('<meta name="color-scheme" content="dark light">');
  });
```
com `import { THEME_BOOT_MARKER, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';`.

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/design-system/base-layout.test.ts tests/sales/layout.test.ts`
Expected: FAIL com `expected '<!DOCTYPE html>…' to contain '(() => {…'`.

**Step 3: Write minimal implementation**
Nos dois layouts, importe no frontmatter:
```ts
import { THEME_BOOT_SCRIPT } from '../lib/theme/boot';
```
e logo depois de `<meta name="viewport" … />`:
```astro
    <meta name="color-scheme" content="dark light" />
    {/* Theme boot (theme-modes): blocking on purpose, so the stored theme is
        on <html> before the first paint, on pre-rendered routes too. */}
    <script is:inline set:html={THEME_BOOT_SCRIPT} />
```
Se o AstroContainer serializar a meta com ` />`, ajuste a asserção para `/<meta name="color-scheme" content="dark light"\s*\/?>/` (regex), sem mudar o markup.

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/design-system/base-layout.test.ts tests/sales/layout.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

### Task 4: Tokens Paper e portão de contraste dos dois temas

**Requirement:** REQ-001, REQ-002, REQ-008
**Depends on:** `contrast-gate` (Terminal Noir) para os valores de `success` e `border-strong`; se ela ainda não tiver sido implementada, use os valores daqui mesmo assim, eles são os da spec dela.
**Files:**
- Modify: `src/styles/global.css:163-165` (inserir entre o fim do `@theme` e `/* Photo column capped at 20rem`)
- Test: `tests/design-system/paper-contrast.test.ts` (Create)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

/**
 * Paper, the light variant of Terminal Noir (docs/specs/theme-modes). Read from
 * the stylesheet like contrast.test.ts, never copied: the ratios are the ones the
 * browser renders. Two blocks carry the palette (the system-light media query and
 * the explicit choice), so this gate also fails when they drift apart.
 */
const CSS = readFileSync('src/styles/global.css', 'utf8');

const SYSTEM_SELECTOR = ':root:not([data-theme="noir"])';
const CHOSEN_SELECTOR = ':root[data-theme="paper"]';

const body = (selector: string): string => {
  const at = CSS.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`${selector} not found in global.css`);
  return CSS.slice(at, CSS.indexOf('}', at));
};

const tokensOf = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, hex]) => [name, hex!.toLowerCase()]),
  );

const noirTokens = tokensOf(body('@theme'));
const paper = tokensOf(body(CHOSEN_SELECTOR));
const t = (name: string): string => {
  const hex = paper[name];
  if (!hex) throw new Error(`--color-${name} missing from the Paper block`);
  return hex;
};

describe('Paper palette (theme-modes, REQ-001)', () => {
  it('re-points every colour token the Noir theme declares', () => {
    expect(Object.keys(paper).sort()).toEqual(Object.keys(noirTokens).sort());
  });

  it('takes the Terminal Noir light values', () => {
    expect(paper).toMatchObject({
      background: '#fbfaf7',
      surface: '#f1efea',
      'surface-elevated': '#e9e6df',
      border: '#dcd8cf',
      'border-strong': '#88837a',
      selection: '#d6d2c8',
      foreground: '#1c1a17',
      'muted-foreground': '#5e5a53',
      primary: '#865700',
      'primary-foreground': '#fbfaf7',
      success: '#0b7656',
      warning: '#8a5300',
      destructive: '#b42318',
      whatsapp: '#075e54',
      'whatsapp-foreground': '#fbfaf7',
    });
  });

  it('keeps the system-light block identical to the chosen one (REQ-008)', () => {
    expect(tokensOf(body(SYSTEM_SELECTOR))).toEqual(paper);
  });

  it('applies the system block only under prefers-color-scheme: light (REQ-002)', () => {
    const media = CSS.lastIndexOf('@media (prefers-color-scheme: light)', CSS.indexOf(`${SYSTEM_SELECTOR} {`));
    expect(media).toBeGreaterThan(-1);
  });

  it('switches the colour scheme to light in both blocks, while html stays dark by default', () => {
    expect(body(SYSTEM_SELECTOR)).toMatch(/color-scheme:\s*light/);
    expect(body(CHOSEN_SELECTOR)).toMatch(/color-scheme:\s*light/);
    expect(CSS).toMatch(/html\s*\{[^}]*scheme-dark/);
  });
});

/** Every readable pair, in both themes, on every surface it can sit on (REQ-008). */
const THEMES = { noir: noirTokens, paper } as const;
const SURFACES = ['background', 'surface', 'surface-elevated'] as const;
const TEXT = ['foreground', 'muted-foreground', 'primary', 'success', 'warning', 'destructive'] as const;
const GRAPHIC = ['border-strong', 'whatsapp'] as const;

describe.each(Object.entries(THEMES))('%s contrast (theme-modes, REQ-008)', (_theme, tokens) => {
  const c = (name: string): string => {
    const hex = tokens[name];
    if (!hex) throw new Error(`--color-${name} missing`);
    return hex;
  };

  it.each(TEXT.flatMap(fg => SURFACES.map(bg => [fg, bg] as const)))('%s on %s clears 4.5:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHIC.flatMap(fg => SURFACES.map(bg => [fg, bg] as const)))('%s on %s clears 3:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ['primary-foreground', 'primary'],
    ['whatsapp-foreground', 'whatsapp'],
    ['foreground', 'selection'],
  ])('%s on %s clears 4.5:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps border decorative', () => {
    expect(contrastRatio(c('border'), c('background'))).toBeLessThan(3);
  });
});

describe('Paper worst cases, as measured in the spec', () => {
  it.each([
    ['foreground', 13.93],
    ['muted-foreground', 5.5],
    ['primary', 4.99],
    ['success', 4.51],
    ['warning', 5.08],
    ['destructive', 5.27],
  ])('%s on surface-elevated is %s:1', (name, expected) => {
    expect(contrastRatio(t(name), t('surface-elevated'))).toBeCloseTo(expected, 1);
  });

  it('proves the gate can fail: the pre-contrast-gate values and the WhatsApp brand green', () => {
    expect(contrastRatio('#047857', t('surface-elevated'))).toBeLessThan(4.5);
    expect(contrastRatio('#8a857c', t('surface-elevated'))).toBeLessThan(3);
    expect(contrastRatio(noirTokens.whatsapp!, t('background'))).toBeLessThan(3);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/design-system/paper-contrast.test.ts`
Expected: FAIL com `:root[data-theme="paper"] not found in global.css`.

**Step 3: Write minimal implementation**
Em `src/styles/global.css`, depois do `}` que fecha o `@theme` e antes de `/* Photo column capped at 20rem`:
```css
/* Paper, the light variant of Terminal Noir (docs/specs/theme-modes). Unlayered,
   so it beats the @theme tokens; the reading mode's palettes carry ids in their
   :has() and still win over it (REQ-009). The two blocks must stay identical:
   tests/design-system/paper-contrast.test.ts compares them. Values from Terminal
   Noir after its contrast-gate: every text token clears 4.5:1 on every surface.
   The WhatsApp brand green is 1.90:1 on paper, so the button takes the brand's
   dark teal. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="noir"]) {
    color-scheme: light;
    --color-background: #fbfaf7;
    --color-surface: #f1efea;
    --color-surface-elevated: #e9e6df;
    --color-border: #dcd8cf;
    --color-border-strong: #88837a;
    --color-selection: #d6d2c8;
    --color-foreground: #1c1a17;
    --color-muted-foreground: #5e5a53;
    --color-primary: #865700;
    --color-primary-foreground: #fbfaf7;
    --color-success: #0b7656;
    --color-whatsapp: #075e54;
    --color-whatsapp-foreground: #fbfaf7;
    --color-warning: #8a5300;
    --color-destructive: #b42318;
  }
}

:root[data-theme="paper"] {
  color-scheme: light;
  --color-background: #fbfaf7;
  --color-surface: #f1efea;
  --color-surface-elevated: #e9e6df;
  --color-border: #dcd8cf;
  --color-border-strong: #88837a;
  --color-selection: #d6d2c8;
  --color-foreground: #1c1a17;
  --color-muted-foreground: #5e5a53;
  --color-primary: #865700;
  --color-primary-foreground: #fbfaf7;
  --color-success: #0b7656;
  --color-whatsapp: #075e54;
  --color-whatsapp-foreground: #fbfaf7;
  --color-warning: #8a5300;
  --color-destructive: #b42318;
}
```
O `contrast.test.ts` e o `tokens.test.ts` continuam lendo o primeiro match de cada token, que segue sendo o do `@theme` (Noir), porque o bloco Paper vem depois.

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/design-system`
Expected: PASS em `paper-contrast.test.ts`, `contrast.test.ts`, `tokens.test.ts` e `no-ad-hoc-values.test.ts`. A falha pré-existente de `motion.test.ts` (reduced-motion da paleta de comandos, presente antes desta feature) não conta; se ainda estiver lá, registre no STATE e não a corrija aqui.

**Step 5: Commit**
Run: `/git commit`

---

### Task 5: Modo leitura vence o tema do site

**Requirement:** REQ-009
**Files:**
- Modify: `src/styles/global.css:254-264` (bloco `#reader-theme-black`)
- Test: `tests/posts/reader-mode.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
Acrescente a `tests/posts/reader-mode.test.ts` (o arquivo já lê o CSS; se o nome da variável for outro, use o dele):
```ts
describe('reading mode over the site theme (theme-modes, REQ-009)', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');
  const block = (selector: string) => {
    const at = css.indexOf(`${selector} {`);
    return css.slice(at, css.indexOf('}', at));
  };

  it('outranks the Paper blocks: every reader palette selector carries ids, Paper carries none', () => {
    expect(block(':root[data-theme="paper"]')).not.toContain('#');
    for (const theme of ['black', 'sepia', 'light']) {
      expect(css).toContain(`:root:has(#reader-on:checked):has(#reader-theme-${theme}:checked) {`);
    }
  });

  it('turns the colour scheme back to dark on black, since Paper may have set light', () => {
    expect(block(':root:has(#reader-on:checked):has(#reader-theme-black:checked)')).toMatch(/color-scheme:\s*dark/);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/posts/reader-mode.test.ts`
Expected: FAIL em "turns the colour scheme back to dark".

**Step 3: Write minimal implementation**
No bloco `:root:has(#reader-on:checked):has(#reader-theme-black:checked) {`, primeira linha:
```css
  color-scheme: dark;
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/posts/reader-mode.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

### Task 6: Componente `ThemeToggle`

**Requirement:** REQ-004
**Depends on:** Task 4
**Files:**
- Create: `src/lib/theme/copy.ts`
- Create: `src/components/layout/ThemeToggle.astro`
- Modify: `src/styles/global.css` (logo depois dos blocos Paper da tarefa 4)
- Test: `tests/layout/theme-toggle.test.ts` (Create)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ThemeToggle from '../../src/components/layout/ThemeToggle.astro';
import { THEME_COPY } from '../../src/lib/theme/copy';

const render = async () => (await AstroContainer.create()).renderToString(ThemeToggle);
const css = readFileSync('src/styles/global.css', 'utf8');

describe('ThemeToggle (theme-modes, REQ-004)', () => {
  it('is a real button the boot script listens to', async () => {
    const html = await render();
    expect(html).toMatch(/<button[^>]*type="button"[^>]*data-theme-toggle/);
  });

  it('names the theme it switches to, one name per state', async () => {
    const html = await render();
    expect(THEME_COPY).toEqual({ toPaper: 'Usar tema claro', toNoir: 'Usar tema escuro' });
    expect(html).toMatch(/data-theme-when="noir"[\s\S]*Usar tema claro/);
    expect(html).toMatch(/data-theme-when="paper"[\s\S]*Usar tema escuro/);
  });

  it('keeps the icons out of the accessible name', async () => {
    const svgs = (await render()).match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  });

  it('is a 44px target with a visible focus ring', async () => {
    const button = (await render()).match(/<button[^>]*>/)?.[0] ?? '';
    expect(button).toContain('size-11');
    expect(button).toContain('focus-visible:outline-primary');
  });

  it('stays hidden until the boot ran, and shows only the current state', () => {
    const rule = css.match(/([^{}]*\[data-theme-toggle\][^{}]*)\{\s*display:\s*none;\s*\}/)?.[1] ?? '';
    expect(rule).toContain(':root:not([data-theme-boot]) [data-theme-toggle]');
    expect(rule).toContain(':root[data-theme="noir"] [data-theme-when="paper"]');
    expect(rule).toContain(':root[data-theme="paper"] [data-theme-when="noir"]');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/layout/theme-toggle.test.ts`
Expected: FAIL com "Failed to load url ../../src/components/layout/ThemeToggle.astro".

**Step 3: Write minimal implementation**
`src/lib/theme/copy.ts`:
```ts
/** Visible names of the theme switch (theme-modes, REQ-004, REQ-011): each names the theme it turns on. */
export const THEME_COPY = {
  toPaper: 'Usar tema claro',
  toNoir: 'Usar tema escuro',
} as const;
```
`src/components/layout/ThemeToggle.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import { THEME_COPY } from '../../lib/theme/copy';
---

{/* The theme boot script owns the click (src/lib/theme/boot.ts) and global.css
    hides the button until that script ran, so without JS it never promises an
    action. Each state names the theme it switches to; CSS shows only the
    current one, and display:none also drops the other name from the tree. */}
<button
  type="button"
  data-theme-toggle
  class="inline-flex size-11 shrink-0 items-center justify-center text-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  <span data-theme-when="noir" class="contents">
    <Icon name="lucide:sun" aria-hidden="true" class="size-5" />
    <span class="sr-only">{THEME_COPY.toPaper}</span>
  </span>
  <span data-theme-when="paper" class="contents">
    <Icon name="lucide:moon" aria-hidden="true" class="size-5" />
    <span class="sr-only">{THEME_COPY.toNoir}</span>
  </span>
</button>
```
Em `global.css`, depois dos blocos Paper:
```css
/* Theme switch (theme-modes, REQ-004). Unlayered, so hiding wins over the
   display utilities: hidden until the boot script marked <html>, then only the
   current theme's icon and name show. */
:root:not([data-theme-boot]) [data-theme-toggle],
:root[data-theme="noir"] [data-theme-when="paper"],
:root[data-theme="paper"] [data-theme-when="noir"] {
  display: none;
}
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/layout/theme-toggle.test.ts tests/design-system/no-ad-hoc-values.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

### Task 7: Botão nos headers dos dois layouts

**Requirement:** REQ-004
**Depends on:** Task 6
**Files:**
- Modify: `src/components/layout/SiteHeader.astro:1-5,41-43`
- Modify: `src/layouts/SalesLayout.astro:76-97`
- Test: `tests/layout/site-header.test.ts`, `tests/sales/layout.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
Em `tests/layout/site-header.test.ts`:
```ts
  it('carries one theme switch, after the navigation (theme-modes, REQ-004)', async () => {
    const html = await render({ availability: { status: 'open', label: 'Disponível' } });
    expect(html.match(/data-theme-toggle/g) ?? []).toHaveLength(1);
    expect(html.indexOf('data-theme-toggle')).toBeGreaterThan(html.indexOf('<nav'));
  });
```
(Se o tipo `Availability` exigir mais campos, copie o objeto de outro teste do mesmo arquivo.)

Em `tests/sales/layout.test.ts`:
```ts
  it('carries one theme switch in the header, before the quote button (theme-modes, REQ-004)', async () => {
    const html = await render();
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    expect(header.match(/data-theme-toggle/g) ?? []).toHaveLength(1);
    expect(header.indexOf('data-theme-toggle')).toBeLessThan(header.indexOf('Orçamento'));
  });
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/layout/site-header.test.ts tests/sales/layout.test.ts`
Expected: FAIL com `expected [] to have a length of 1`.

**Step 3: Write minimal implementation**
`SiteHeader.astro`: importe `import ThemeToggle from './ThemeToggle.astro';` e, depois da linha do `AvailabilityPill` com `data-header-availability`:
```astro
    {/* Below md the menu button takes order-last, so this sits just before it. */}
    <ThemeToggle />
```
`SalesLayout.astro`: importe `import ThemeToggle from '../components/layout/ThemeToggle.astro';` e envolva o link "Orçamento":
```astro
        <div class="flex items-center gap-sm">
          <ThemeToggle />
          <a
            href={contact}
            class="inline-flex min-h-11 items-center rounded-md bg-primary px-md text-small font-medium text-primary-foreground transition-[min-height] duration-(--duration-base) ease-out group-data-scrolled:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Orçamento
          </a>
        </div>
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/layout tests/sales tests/home/single-primary-cta.test.ts`
Expected: PASS (o portão de CTA primário não muda: o botão de tema não é `primary`).

**Step 5: Commit**
Run: `/git commit`

---

### Task 8: Shiki com os temas do Terminal Noir

**Requirement:** REQ-007, REQ-013
**Depends on:** Task 4 e a `contrast-gate` do Terminal Noir concluída (`ports/shiki/*.json` existe lá)
**Files:**
- Create: `src/lib/code/themes/terminal-noir.json`, `src/lib/code/themes/terminal-noir-paper.json` (cópias de `~/dev/projects/terminalnoir/ports/shiki/`)
- Modify: `astro.config.mjs:1-15,90-103`
- Modify: `src/styles/global.css:560-565` (bloco `.astro-code`) e logo depois de `.astro-code code { … }`
- Modify: `tests/design-system/code-contrast.test.ts` (reescrita)
- Modify: `tests/design-system/code-blocks.test.ts:12-13` (constante `CODE_BACKGROUND`)
- Test: `tests/code/shiki-themes.test.ts` (Create)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails, consequences-reviewer

**Step 1: Write the failing tests**
`tests/code/shiki-themes.test.ts`:
```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

/**
 * The code themes are Terminal Noir's own Shiki port, copied in (theme-modes,
 * REQ-007, REQ-013). The copy must match its source whenever the sibling repo is
 * checked out; in CI it is not, so that check is skipped with its reason.
 */
const FILES = ['terminal-noir.json', 'terminal-noir-paper.json'] as const;
const LOCAL = 'src/lib/code/themes';
const SOURCE = '../terminalnoir/ports/shiki';

interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: Array<{ name: string; settings: { foreground?: string } }>;
}

const read = (file: string): Theme => JSON.parse(readFileSync(`${LOCAL}/${file}`, 'utf8'));

describe('Shiki themes from Terminal Noir', () => {
  it.each(FILES)('%s puts every token at AA on its own background', file => {
    const theme = read(file);
    const background = theme.colors['editor.background']!;
    const tokens = theme.tokenColors.filter(token => token.settings.foreground);
    expect(tokens.length).toBeGreaterThan(10);
    for (const token of tokens) {
      expect(contrastRatio(token.settings.foreground!, background), `${file} ${token.name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('sits each theme on its site background', () => {
    expect(read('terminal-noir.json').colors['editor.background']!.toLowerCase()).toBe('#0b0b0c');
    expect(read('terminal-noir-paper.json').colors['editor.background']!.toLowerCase()).toBe('#fbfaf7');
  });

  it.skipIf(!existsSync(SOURCE))('matches the Terminal Noir port byte for byte (REQ-013)', () => {
    for (const file of FILES) {
      expect(readFileSync(`${LOCAL}/${file}`, 'utf8'), file).toBe(readFileSync(`${SOURCE}/${file}`, 'utf8'));
    }
  });
});
```
Substitua o conteúdo de `tests/design-system/code-contrast.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import { contrastRatio } from '../../src/lib/contrast';
import PostPage from '../../src/pages/[slug].astro';

/**
 * The palette gate reads the tokens, so it never sees the syntax highlighter:
 * Shiki writes its colours inline, from its own themes. That blind spot shipped
 * once (Lighthouse: #6a737d on #24292e, 3.04:1). Since theme-modes (REQ-007) every
 * block carries both Terminal Noir themes as --shiki-dark / --shiki-light and CSS
 * picks one, so this renders the real page and measures both variants.
 */
const AA_NORMAL_TEXT = 4.5;
const VARIANTS = ['dark', 'light'] as const;
type Variant = (typeof VARIANTS)[number];

const render = async (entry: Awaited<ReturnType<typeof getAllPostEntries>>[number]) => {
  const container = await AstroContainer.create();
  return container.renderToString(PostPage, { props: { entry }, params: { slug: entry.data.slug } });
};

const tokenColours = (html: string, variant: Variant): string[] => [
  ...new Set([...html.matchAll(new RegExp(`--shiki-${variant}:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map(m => m[1]!)),
];

const blockBackground = (html: string, variant: Variant): string | undefined =>
  new RegExp(`<pre[^>]*style="[^"]*--shiki-${variant}-bg:\\s*(#[0-9a-fA-F]{6})`).exec(html)?.[1];

const withCode = async () =>
  (await getAllPostEntries()).filter(entry => (entry.body ?? '').includes('```'));

describe('highlighted code meets AA in both themes', () => {
  it('finds published posts with fenced code, or this gate proves nothing', async () => {
    expect((await withCode()).length).toBeGreaterThan(0);
  });

  it.each(VARIANTS)('renders the %s variant as CSS variables, with no fixed inline colour', async variant => {
    const [first] = (await withCode()).filter(entry => /```[a-z]/.test(entry.body ?? ''));
    const html = await render(first!);
    expect(blockBackground(html, variant), 'no <pre> background: the selector drifted').toBeDefined();
    expect(tokenColours(html, variant).length).toBeGreaterThan(1);
    expect(html).not.toMatch(/<span style="color:#/);
  });

  it.each(VARIANTS)('gives every %s token enough contrast against its block', async variant => {
    for (const entry of await withCode()) {
      const html = await render(entry);
      const background = blockBackground(html, variant);
      if (!background) continue;
      for (const colour of tokenColours(html, variant)) {
        expect(contrastRatio(colour, background), `${entry.data.slug} ${variant}: ${colour} on ${background}`)
          .toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  }, 120_000);

  it('points the block at the dark variant by default and at light under Paper', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(/\.astro-code\s*\{[^}]*color:\s*var\(--shiki-dark\)[^}]*background-color:\s*var\(--shiki-dark-bg\)/);
    expect(css).toMatch(/:root\[data-theme="paper"\] \.astro-code\s*\{[^}]*var\(--shiki-light-bg\)/);
    expect(css).toMatch(/:root:not\(\[data-theme="noir"\]\) \.astro-code\s*\{[^}]*var\(--shiki-light-bg\)/);
  });

  it('proves the gate can fail', () => {
    expect(contrastRatio('#6a737d', '#24292e')).toBeLessThan(AA_NORMAL_TEXT);
  });
});
```

**Step 2: Run tests to verify they fail**
Run: `./node_modules/.bin/vitest run tests/code/shiki-themes.test.ts tests/design-system/code-contrast.test.ts`
Expected: FAIL com `ENOENT … src/lib/code/themes/terminal-noir.json` e "no <pre> background: the selector drifted".

**Step 3: Write minimal implementation**
```bash
mkdir -p src/lib/code/themes
cp ../terminalnoir/ports/shiki/terminal-noir.json ../terminalnoir/ports/shiki/terminal-noir-paper.json src/lib/code/themes/
```
`astro.config.mjs`, imports no topo:
```js
import terminalNoir from './src/lib/code/themes/terminal-noir.json' with { type: 'json' };
import terminalNoirPaper from './src/lib/code/themes/terminal-noir-paper.json' with { type: 'json' };
```
e o `shikiConfig` (reescreva também o comentário acima dele):
```js
    // Terminal Noir's own Shiki port, copied in (theme-modes, REQ-007): both
    // variants as CSS variables, and global.css picks the one of the current
    // site theme. Every token is held to AA by code-contrast.test.ts here and by
    // tests/contrast.bats in Terminal Noir.
    shikiConfig: {
      themes: { dark: terminalNoir, light: terminalNoirPaper },
      defaultColor: false,
      // Raw and Copy icon actions on every block (src/lib/code/toolbar.ts).
      transformers: [codeToolbar()],
    },
```
`global.css`, dentro do bloco `.astro-code { … }` existente (mantendo as quatro propriedades atuais):
```css
    color: var(--shiki-dark);
    background-color: var(--shiki-dark-bg);
```
e, logo depois de `.astro-code code { counter-reset: code-line; }`:
```css
  /* Token colours come as variables only (defaultColor: false). The raw view
     below still wins with its !important inherit. */
  .astro-code span {
    color: var(--shiki-dark);
  }

  /* Paper takes the light variant, under the same two conditions as the
     palette (theme-modes, REQ-007). */
  @media (prefers-color-scheme: light) {
    :root:not([data-theme="noir"]) .astro-code {
      color: var(--shiki-light);
      background-color: var(--shiki-light-bg);
    }

    :root:not([data-theme="noir"]) .astro-code span {
      color: var(--shiki-light);
    }
  }

  :root[data-theme="paper"] .astro-code {
    color: var(--shiki-light);
    background-color: var(--shiki-light-bg);
  }

  :root[data-theme="paper"] .astro-code span {
    color: var(--shiki-light);
  }
```
`tests/design-system/code-blocks.test.ts`: o comentário e a constante passam a ser `// Terminal Noir's Shiki theme paints every block on the page background.` e `const CODE_BACKGROUND = '#0b0b0c';`. A contagem de linha (`muted-foreground`) continua acima de 4,5:1 nos dois fundos (7,68 no Noir, 6,57 no Paper).

Se o carregador do config recusar `with { type: 'json' }`, troque os dois imports por `JSON.parse(readFileSync(new URL('./src/lib/code/themes/<arquivo>.json', import.meta.url), 'utf8'))`.

**Step 4: Run tests to verify they pass**
O `code-contrast.test.ts` lê o HTML renderizado dos posts no `.astro/data-store.json`, e mudar o Shiki não invalida esse HTML (ver "Armadilhas já pagas" no `CLAUDE.md`). Antes de rodar, regenere o store: `./node_modules/.bin/astro dev stop; rm -f .astro/data-store.json`, suba o dev (subir dev server pede o ok do Fernando, Rule 04), espere o "ready" e pare com `./node_modules/.bin/astro dev stop`: o store só é gravado no shutdown.
Run: `./node_modules/.bin/vitest run tests/code tests/design-system/code-contrast.test.ts tests/design-system/code-blocks.test.ts`
Expected: PASS, com "matches the Terminal Noir port byte for byte" executado (não pulado) nesta máquina.

**Step 5: Commit**
Run: `/git commit`

---

### Task 9: Ação de tema no controlador da paleta

**Requirement:** REQ-011
**Depends on:** Task 6
**Files:**
- Modify: `src/lib/search/controller.ts:4-28,31-40`
- Modify: `src/lib/search/copy.ts:1,24-32`
- Test: `tests/search/controller.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
  describe('theme action (theme-modes, REQ-011)', () => {
    it('offers the theme it switches to, last in General, on T', () => {
      const onNoir = viewFor(index, '', { theme: 'noir' })[0]?.options.at(-1);
      expect(onNoir).toEqual({ id: 'opt-theme', label: 'Usar tema claro', action: 'toggle-theme', keys: ['T'] });
      const onPaper = viewFor(index, '', { theme: 'paper' })[0]?.options.at(-1);
      expect(onPaper?.label).toBe('Usar tema escuro');
    });

    it('leaves it out when the page does not know its theme (no boot, no button)', () => {
      const labels = (viewFor(index, '')[0]?.options ?? []).map(option => option.label);
      expect(labels).not.toContain('Usar tema claro');
    });

    it('finds it by typing', () => {
      expect(viewFor(index, 'tema', { theme: 'noir' })[0]?.options[0]?.id).toBe('opt-theme');
    });
  });
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/search/controller.test.ts`
Expected: FAIL com `expected { id: 'opt-copy-link', … } to deeply equal { id: 'opt-theme', … }`.

**Step 3: Write minimal implementation**
`copy.ts`: `import { THEME_COPY } from '../theme/copy';` e, em `actions`:
```ts
    themePaper: THEME_COPY.toPaper,
    themeNoir: THEME_COPY.toNoir,
```
`controller.ts`:
```ts
  action?: 'copy-link' | 'toggle-theme';
```
```ts
export interface PageViews {
  mdPath?: string;
  aiPath?: string;
  /** Set on the AI view instead of aiPath: the way back to the page. */
  humanPath?: string;
  /** Current site theme, known only once the theme boot ran (theme-modes). */
  theme?: 'noir' | 'paper';
}
```
```ts
const general = ({ mdPath, aiPath, humanPath, theme }: PageViews): PaletteOption[] => [
  // … opções atuais, inalteradas …
  ...(theme
    ? [
        {
          id: 'opt-theme',
          label: theme === 'paper' ? PALETTE_COPY.actions.themeNoir : PALETTE_COPY.actions.themePaper,
          action: 'toggle-theme' as const,
          keys: ['T'],
        },
      ]
    : []),
];
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/search/controller.test.ts tests/search/copy.test.ts`
Expected: PASS (os testes que comparam a lista exata do Geral não passam `theme`, então não mudam).

**Step 5: Commit**
Run: `/git commit`

---

### Task 10: Paleta executa a troca

**Requirement:** REQ-011
**Depends on:** Task 9
**Files:**
- Modify: `src/scripts/palette.ts:38-42,126-128`
- Test: `tests/search/palette-module.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
describe('theme action (theme-modes, REQ-011)', () => {
  const withToggle = () => {
    const button = document.createElement('button');
    button.setAttribute('data-theme-toggle', '');
    document.body.append(button);
    const click = vi.fn();
    button.addEventListener('click', click);
    return click;
  };

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('lists the switch with the name of the other theme', async () => {
    document.documentElement.dataset.theme = 'paper';
    withToggle();
    const palette = await load();
    await palette.open(null);
    expect(listbox().textContent).toContain('Usar tema escuro');
  });

  it('closes and presses the header switch on T, so the boot script does the work', async () => {
    document.documentElement.dataset.theme = 'noir';
    const click = withToggle();
    const palette = await load();
    await palette.open(null);
    palette.press('T', 5000);
    expect(click).toHaveBeenCalledTimes(1);
    expect(dialog().hasAttribute('open')).toBe(false);
  });

  it('offers nothing when the theme is unknown', async () => {
    const palette = await load();
    await palette.open(null);
    expect(listbox().textContent).not.toContain('Usar tema');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/search/palette-module.test.ts`
Expected: FAIL com `expected '…' to contain 'Usar tema escuro'`.

**Step 3: Write minimal implementation**
```ts
const currentTheme = (): 'noir' | 'paper' | undefined => {
  const theme = document.documentElement.dataset.theme;
  return theme === 'noir' || theme === 'paper' ? theme : undefined;
};

const pageViews = () => ({
  mdPath: dialog.dataset.paletteMd,
  aiPath: dialog.dataset.paletteAi,
  humanPath: dialog.dataset.paletteHuman,
  theme: currentTheme(),
});
```
No início de `choose`:
```ts
  if (option.action === 'toggle-theme') {
    dialog.close();
    // One switch, one code path: the theme boot script handles this click.
    document.querySelector<HTMLElement>('[data-theme-toggle]')?.click();
    return;
  }
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/search`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

### Task 11: Documentação

**Requirement:** REQ-012
**Files:**
- Modify: `CLAUDE.md` (seção "Restrições que não são preferência": itens "JavaScript de cliente" e "Tema escuro único")
- Modify: `docs/DESIGN-GUIDELINES.md:99-160` (depois de "Contraste verificado" e antes de "Modo leitura")
- Modify: `docs/specs/theme-modes/STATE.md`

**Team:**
- Track: docs
- Implementer: rpi-implementer (direct)
- Reviewers: self-review

**Step 1: Write the failing test**
Acrescente a `tests/design-system/paper-contrast.test.ts`:
```ts
describe('documentation (theme-modes, REQ-012)', () => {
  it('no longer promises a single dark theme, and names the theme boot exception', () => {
    const guide = readFileSync('CLAUDE.md', 'utf8');
    expect(guide).not.toContain('Tema escuro único');
    expect(guide).toContain('data-theme-boot');
  });

  it('documents the Paper palette with its measured ratios', () => {
    expect(readFileSync('docs/DESIGN-GUIDELINES.md', 'utf8')).toMatch(/### Paper[\s\S]*16,63:1/);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/design-system/paper-contrast.test.ts`
Expected: FAIL em "no longer promises a single dark theme".

**Step 3: Write minimal implementation**
- `CLAUDE.md`, substituir o item "Tema escuro único" por:
  > - **Dois temas, Noir e Paper** (theme-modes, 2026-10-20, decisão do Fernando). A primeira visita segue `prefers-color-scheme`; o botão do header e a ação `T` da paleta trocam e lembram em `localStorage.theme`. Os tokens Paper vivem em dois blocos idênticos em `global.css` (`@media` do sistema e `[data-theme="paper"]`), comparados por `tests/design-system/paper-contrast.test.ts`. O modo leitura dos posts continua com preto, sépia e claro, e vence o tema do site enquanto está ligado.
- No item "JavaScript de cliente só por exceção nomeada", acrescentar: "e o boot de tema (theme-modes, REQ-010, 2026-10-20), inline no `<head>` de todas as páginas, marcado por `data-theme-boot`, em até 512 B gzip, dono também do clique do botão de tema".
- `DESIGN-GUIDELINES.md`, nova subseção `### Paper (tema claro, 2026-10-20)` com a tabela de pares e razões da spec (foreground 16,63:1; muted 6,57:1; primary 5,96:1; success 5,25:1; warning 6,06:1; destructive 6,30:1; border-strong 3,51:1; border 1,36:1 reprova, mesma regra do Noir; WhatsApp `#075e54` 7,35:1), a regra de que todo token de texto passa 4,5:1 sobre as três superfícies nos dois temas, a origem dos valores (`contrast-gate` do Terminal Noir), o motivo do verde-petróleo e que os blocos de código usam o port Shiki do Terminal Noir.
- `STATE.md`: `phase: implement`, transição com a data.

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/design-system/paper-contrast.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

### Task 12: Portão completo e conferência no navegador

**Requirement:** REQ-001 a REQ-013
**Depends on:** todas
**Files:**
- Modify: `docs/specs/theme-modes/STATE.md`, `docs/specs/theme-modes/SPEC.md` (status da rastreabilidade)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, consequences-reviewer

**Step 1: Write the failing test**
Nenhum teste novo: esta tarefa roda os portões que as anteriores escreveram, inclusive os de build (tarefa 2).

**Step 2: Run the gates**
Run: `npm run verify > /tmp/verify.log 2>&1; grep -E "Test Files|Tests |FAIL" /tmp/verify.log`
Expected: nenhum `FAIL` além do `motion.test.ts` pré-existente, se ele ainda não tiver sido corrigido por outra feature. Como esse teste interrompe o `verify` antes do build, rode também:
`npm run build > /tmp/build.log 2>&1; npm run test:build > /tmp/tb.log 2>&1; grep -E "Test Files|Tests |FAIL" /tmp/tb.log`
Expected: `no-client-js.build-test.ts` verde, inclusive "runs the theme boot inside <head>" e o orçamento da paleta (4096 B).

**Step 3: Browser check (pedir ao Fernando para subir o dev server, ou usar `bash scripts/deploy-staging.sh`)**
Em 1280 e 390px, nos dois temas:
- Sistema em claro, sem escolha salva: abre em Paper sem piscar em `/`, num post (`/<slug>`) e num case (`/lab/terminal-noir`).
- Botão troca, recarregar mantém, sistema mudando ao vivo não sobrescreve a escolha.
- Tab até o botão: anel de foco visível; leitor de tela anuncia "Usar tema claro"/"Usar tema escuro".
- Bloco de código com o tema `terminal-noir-paper` na Paper e `terminal-noir` no Noir; modo Raw continua sem cores.
- Modo leitura em preto, sépia e claro vence o Paper e o Noir.
- `/servicos`: botão antes de "Orçamento", WhatsApp verde-petróleo na Paper.
- Ctrl K, "Usar tema claro", e `T` fora de campo.
- Arte gerada dos cases, retrato e grade de pontos legíveis no Paper (anotar o que precisar de ajuste como achado, sem corrigir fora do escopo).

**Step 4: Record**
Rastreabilidade da spec com os REQs em "Feito"; `STATE.md` com `phase: review` e o resultado da conferência.

**Step 5: Commit**
Run: `/git commit`
