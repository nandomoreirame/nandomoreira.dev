# Plano: post-detail-tweaks

> **Spec:** docs/specs/post-detail-tweaks/SPEC.md

**Objetivo:** quatro ajustes na página de post: título e lead na largura toda, índice só "Índice", botão "Contato" na caixa do autor e blocos de código com barra de topo (nome do arquivo à esquerda, Raw e Copiar à direita), como no Stitch.
**Arquitetura:** as três primeiras são classes e markup em `[slug].astro`, `PostToc.astro` e `AuthorBox.astro`. A barra do código nasce no transformer do Shiki (`src/lib/code/toolbar.ts`), que lê `title="..."` do meta do fence (`this.options.meta.__raw`, repassado pelo satteri); a moldura sai do `<pre>` (classes do `Prose`) e vai para o `.code-block` em `global.css`.
**Stack:** Astro 7, Shiki, Tailwind 4, Vitest.
**Total de tarefas:** 5.
**Complexidade estimada:** medium.
**Depende de:** `post-detail-redesign` e `home-latest-post`, ambas sem commit na árvore.

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- Não pare nem reinicie o dev server (`astro dev`): o autor está usando. Mudança em `astro.config.mjs` não é necessária.
- TDD: cada tarefa começa pelo teste vermelho, que precisa falhar pelo motivo certo. Rode só os arquivos da tarefa (`npx vitest run <arquivos>`).
- Texto visível novo só o da spec. Nenhum hex, nenhum valor arbitrário novo do Tailwind, nenhum `<script>` novo. CSS novo com tokens (`var(--...)`).
- No fim: `npm run verify` sem erro novo (prettier e tsc já falhavam antes, por falta de config e por não lerem `.astro`).

---

### Tarefa 1: título e lead sem `max-w-list`

**Requisito:** REQ-001
**Arquivos:**
- Modificar: `src/pages/[slug].astro` (o `<h1>` e o `<p data-post-lead>`)
- Teste: `tests/posts/post-page.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer

**Passo 1: teste que falha.** No teste "puts the summary under the title as the lead", acrescente:
```ts
    const h1 = html.match(/<h1[^>]*>/)?.[0] ?? '';
    const leadTag = html.match(/<p[^>]*data-post-lead[^>]*>/)?.[0] ?? '';
    expect(h1).not.toContain('max-w-list');
    expect(leadTag).not.toContain('max-w-list');
```
**Passo 2:** `npx vitest run tests/posts/post-page.test.ts` → FAIL.
**Passo 3:** tire `max-w-list` das duas classes; nada mais muda.
**Passo 4:** o mesmo comando → PASS.
**Passo 5:** `/git commit`.

---

### Tarefa 2: índice só "Índice"

**Requisito:** REQ-002
**Arquivos:**
- Modificar: `src/components/posts/PostToc.astro`
- Teste: `tests/posts/toc.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer

**Passo 1: teste que falha.** Troque o teste "heads the card with the label and the number of sections" por:
```ts
  it('heads the card with the icon and "Índice" alone, no section count', async () => {
    const html = await render();
    expect(html).toMatch(/<p[^>]*>\s*<svg[^>]*data-icon="lucide:list"[\s\S]*?<\/svg>\s*Índice\s*<\/p>/);
    expect(html).not.toContain('seções');
    expect(html).not.toContain('Índice de conteúdo');
  });
```
(Ajuste o regex do ícone ao markup real do `astro-icon` se o `data-icon` vier em outra posição.)
**Passo 2:** `npx vitest run tests/posts/toc.test.ts` → FAIL.
**Passo 3:** em `PostToc.astro`, tire a `const sections` e o `<span>` "N seções"; o texto do `<p>` vira `Índice`. O `<div>` do cabeçalho pode perder o `justify-between` (fica só o `<p>`), mantendo a linha hairline embaixo.
**Passo 4:** o mesmo comando → PASS.
**Passo 5:** `/git commit`.

---

### Tarefa 3: botão "Contato" na caixa do autor

**Requisito:** REQ-003
**Arquivos:**
- Modificar: `src/components/posts/AuthorBox.astro`
- Teste: `tests/posts/author-box.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.** Troque `expect(html).not.toContain('bg-primary');` no teste "links the e-mail and the agent brief, both secondary" por:
```ts
    const row = html.slice(html.indexOf('href="/contato"'));
    expect(html.match(/bg-primary/g)).toHaveLength(1);
    expect(html.indexOf('href="/contato"')).toBeLessThan(html.indexOf('mailto:'));
    expect(row).toMatch(/^href="\/contato"[^>]*>[\s\S]*?Contato/);
    expect(html.match(/<a[^>]*href="mailto:[^"]*"[^>]*>/)?.[0]).not.toContain('bg-primary');
```
e acrescente:
```ts
  it('starts the row with the contact button, also without an e-mail', async () => {
    const html = await render({});
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?Contato[\s\S]*?<\/a>/);
  });
```
**Passo 2:** `npx vitest run tests/posts/author-box.test.ts` → FAIL.
**Passo 3:** importe `Button` (`../ui/Button.astro`) e ponha `<Button href="/contato">Contato</Button>` como primeiro item da fileira (`<div class="flex flex-wrap gap-sm">`), antes do e-mail. Os outros dois links não mudam.
**Passo 4:** o mesmo comando → PASS. Rode também `npx vitest run tests/design-system` (há portões de um CTA primário por página).
**Passo 5:** `/git commit`.

---

### Tarefa 4: barra de topo nos blocos de código

**Requisito:** REQ-004
**Arquivos:**
- Modificar: `src/lib/code/toolbar.ts` (`codeToolbar` e helpers; `icon`/`svgBody` podem ficar se outro teste os usa)
- Modificar: `src/styles/global.css` (bloco "Code toolbar": `.code-block`, `.code-toolbar`, `.code-action`, `.code-icon`, `.code-tooltip`)
- Modificar: `src/components/ui/Prose.astro` (array `code`: a moldura sai do `<pre>`)
- Teste: `tests/code/toolbar.test.ts`, `tests/design-system/code-toolbar-css.test.ts`, `tests/components/card-and-prose.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails, type-safety-reviewer

**Passo 1: testes que falham.** Em `tests/code/toolbar.test.ts`, troque o helper e os testes de toolbar por:
```ts
const highlight = (code: string, lang = 'python', meta?: string) =>
  codeToHtml(code, {
    lang,
    theme: 'github-dark-default',
    meta: meta ? { __raw: meta } : undefined,
    transformers: [codeToolbar()],
  });

describe('codeToolbar', () => {
  it('puts a header bar above the code, always in the markup', async () => {
    const html = await highlight('print("oi")');
    expect(html).toMatch(/^<div[^>]*class="code-block"[^>]*data-code-block/);
    expect(html).toMatch(/<div class="code-header">/);
    expect(html.indexOf('code-header')).toBeLessThan(html.indexOf('<pre'));
  });

  it('labels the bar with the fence title', async () => {
    const html = await highlight('wid=1', 'bash', 'title="bin/scratchpad.sh — scratchpad_toggle()"');
    expect(html).toMatch(/<span class="code-title">bin\/scratchpad\.sh — scratchpad_toggle\(\)<\/span>/);
  });

  it('falls back to the language, and to "texto" without one', async () => {
    expect(await highlight('a', 'bash')).toMatch(/<span class="code-title">bash<\/span>/);
    expect(await highlight('a', 'text')).toMatch(/<span class="code-title">texto<\/span>/);
    expect(await highlight('a', 'plaintext')).toMatch(/<span class="code-title">texto<\/span>/);
  });

  it('draws a decorative dot before the label', async () => {
    expect(await highlight('a')).toMatch(/<span class="code-dot" aria-hidden="true"><\/span>\s*<span class="code-title">/);
  });

  it('shows Raw and Copiar as text actions on the right, no tooltip', async () => {
    const html = await highlight('print("oi")');
    const actions = html.match(/<div class="code-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(actions).toMatch(/<label class="code-action"><input type="checkbox" class="code-raw-toggle sr-only"[^>]*>Raw<\/label>/);
    expect(actions).toMatch(/<button[^>]*class="code-action"[^>]*><span>Copiar<\/span><\/button>/);
    expect(html).not.toContain('code-tooltip');
  });

  it('copies the block through the site script, by the id of its <pre>', async () => {
    const html = await highlight('print("oi")');
    const id = html.match(/<pre[^>]*id="([^"]+)"/)?.[1];
    expect(id).toMatch(/^code-\d+$/);
    expect(html).toMatch(new RegExp(`<button[^>]*type="button"[^>]*data-copy="${id}"[^>]*hidden`));
    expect(html).toContain(`data-label-copied="${CODE_TOOLBAR_LABELS.copied}"`);
  });

  it('gives each block its own id', async () => {
    const ids = [await highlight('a = 1'), await highlight('b = 2')].map((html) => html.match(/<pre[^>]*id="([^"]+)"/)?.[1]);
    expect(new Set(ids).size).toBe(2);
  });

  it('labels the actions in Portuguese', () => {
    expect(CODE_TOOLBAR_LABELS).toEqual({ raw: 'Raw', copy: 'Copiar', copied: 'Copiado', plain: 'texto' });
  });
});
```
(Remova os testes antigos de tooltip e de "três SVGs"; mantenha os de `svgBody` e de "markdown pipeline". A ordem exata dos atributos no regex pode ter de seguir a saída real do hast; ajuste o regex, não o comportamento.)

Em `tests/design-system/code-toolbar-css.test.ts`, troque os testes de posição/hover/tooltip por:
```ts
  it('frames the whole block, header included, and clips the corners', () => {
    const block = rule('.code-block');
    expect(block).toMatch(/border:\s*1px solid var\(--color-border-strong\)/);
    expect(block).toMatch(/border-radius:\s*var\(--radius-md\)/);
    expect(block).toMatch(/overflow:\s*hidden/);
  });

  it('keeps the header visible, with a hairline under it', () => {
    const header = rule('.code-header');
    expect(header).toMatch(/display:\s*flex/);
    expect(header).toMatch(/border-bottom:\s*1px solid var\(--color-border\)/);
    expect(header).not.toMatch(/opacity:\s*0/);
    expect(css).not.toContain('.code-toolbar');
    expect(css).not.toContain('.code-tooltip');
  });

  it('draws the dot in the accent and pushes the actions right', () => {
    expect(rule('.code-dot')).toMatch(/background-color:\s*var\(--color-primary\)/);
    expect(rule('.code-actions')).toMatch(/margin-left:\s*auto/);
  });
```
(mantenha "focus ring", "raw view" e "raw action on").

Em `tests/components/card-and-prose.test.ts:28`, tire `'[&_pre]:rounded-md'`, `'[&_pre]:border'` e `'[&_pre]:border-border-strong'` da lista esperada e acrescente um `expect` de que o `Prose` não tem mais `[&_pre]:border`.

**Passo 2:** `npx vitest run tests/code/toolbar.test.ts tests/design-system/code-toolbar-css.test.ts tests/components/card-and-prose.test.ts` → FAIL.

**Passo 3: implementação.** Em `toolbar.ts`:
```ts
export const CODE_TOOLBAR_LABELS = {
  raw: 'Raw',
  copy: 'Copiar',
  copied: 'Copiado',
  /** Header label of a block with neither a title nor a language. */
  plain: 'texto',
} as const;

const PLAIN_LANGS = new Set(['text', 'plaintext', 'txt', 'plain']);

/** `title="..."` from the fence meta (```bash title="bin/x.sh"), if any. */
export const fenceTitle = (meta: string | undefined): string | undefined =>
  meta?.match(/title="([^"]+)"/)?.[1];

const headerLabel = (meta: string | undefined, lang: string | undefined): string =>
  fenceTitle(meta) ?? (lang && !PLAIN_LANGS.has(lang) ? lang : CODE_TOOLBAR_LABELS.plain);
```
e no `root(root)`:
```ts
    const label = headerLabel(this.options.meta?.__raw, this.options.lang);

    const raw = element('label', { className: ['code-action'] }, [
      element('input', { type: 'checkbox', className: ['code-raw-toggle', 'sr-only'] }),
      { type: 'text', value: CODE_TOOLBAR_LABELS.raw },
    ]);

    // The site script swaps the text of the first <span> for "Copiado".
    const copy = element(
      'button',
      {
        type: 'button',
        className: ['code-action'],
        dataCopy: id,
        dataLabelCopied: CODE_TOOLBAR_LABELS.copied,
        ariaLive: 'polite',
        hidden: true,
      },
      [element('span', {}, [{ type: 'text', value: CODE_TOOLBAR_LABELS.copy }])],
    );

    root.children = [
      element('div', { className: ['code-block'], dataCodeBlock: '' }, [
        element('div', { className: ['code-header'] }, [
          element('span', { className: ['code-dot'], ariaHidden: 'true' }),
          element('span', { className: ['code-title'] }, [{ type: 'text', value: label }]),
          element('div', { className: ['code-actions'] }, [raw, copy]),
        ]),
        pre,
      ]),
    ];
```
(`root(root)` precisa ser `function` para ter `this`; se já for método de objeto, `this` é o contexto do Shiki. Atualize o comentário do topo do arquivo: ações em texto numa barra de topo.)

Em `global.css`, substitua `.code-block`, `.code-toolbar`, `.code-block:hover .code-toolbar…`, `.code-action`, `.code-action:hover`, `.code-icon` e `.code-tooltip` (e o par hover/focus do tooltip) por:
```css
  /* Code block (src/lib/code/toolbar.ts, after the Stitch post screen): a bar
     on top with a dot, the file name (fence title, else the language) and the
     Raw and Copiar actions as text. The frame is the block's, bar included. */
  .code-block {
    overflow: hidden;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
  }

  .code-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-surface);
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  .code-dot {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--color-primary);
  }

  .code-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .code-actions {
    display: flex;
    flex-shrink: 0;
    gap: var(--spacing-xs);
    margin-left: auto;
  }

  .code-action {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding-inline: var(--spacing-sm);
    border: 0;
    border-radius: var(--radius-sm);
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: color var(--duration-fast) ease-out;
  }

  .code-action:hover {
    color: var(--color-primary);
  }
```
Mantenha `.code-action:has(:focus-visible)` (acrescente `.code-action:focus-visible` no mesmo seletor, porque o botão recebe o foco ele mesmo) e `.code-action:has(.code-raw-toggle:checked)` (só `color`, sem `border-color`).

Em `Prose.astro`, no array `code`, troque o primeiro item por:
```ts
  '[&_.code-block]:my-lg [&_pre]:my-0 [&_pre]:p-md [&_pre]:pl-sm [&_pre]:font-mono [&_pre]:text-small [&_pre]:leading-normal',
```
**Passo 4:** os mesmos testes → PASS; depois `npx vitest run tests/design-system tests/ai-view tests/posts` (contraste, visão de IA, página) → PASS.
**Passo 5:** `/git commit`.

---

### Tarefa 5: `title` nos blocos dos posts publicados

**Requisito:** REQ-005
**Depende de:** Tarefa 4
**Arquivos:**
- Modificar: os `src/content/posts/*.md` publicados correntes (`draft` e `archived` ausentes ou `false`) que tenham bloco de código
- Criar: `tests/content/post-code-titles.test.ts`

**Team:**
- Track: docs
- Implementer: rpi-implementer (skills: -)
- Reviewers: self-review (cada título conferido no texto)

**Passo 1: teste que falha**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('code block titles', () => {
  it('names the scratchpad post blocks by the files the text names', () => {
    const md = readFileSync('src/content/posts/scratchpad-no-niri-janelas-que-somem-com-um-atalho.md', 'utf8');
    expect(md).toMatch(/^```kdl title="config\.kdl"$/m);
  });

  it('only uses the title="..." form, never a bare file name in the fence', () => {
    const md = readFileSync('src/content/posts/scratchpad-no-niri-janelas-que-somem-com-um-atalho.md', 'utf8');
    for (const fence of md.match(/^```\S+ .+$/gm) ?? []) {
      expect(fence).toMatch(/^```\S+ title="[^"]+"$/);
    }
  });
});
```
**Passo 2:** `npx vitest run tests/content/post-code-titles.test.ts` → FAIL.
**Passo 3:** em cada post publicado corrente, para cada bloco cujo arquivo o texto nomeia (no parágrafo logo antes ou no próprio código), acrescente ` title="<arquivo>"` ao fence (ex.: ` ```kdl title="config.kdl" `). Quando o texto nomeia a função além do arquivo, o formato `arquivo — função()` é permitido (ex.: `bin/scratchpad.sh — scratchpad_toggle()`), só se os dois estiverem no texto. Sem arquivo nomeado, o fence fica como está. Não toque em rascunhos nem arquivados.
**Passo 4:** o mesmo comando → PASS; `curl -s localhost:4321/scratchpad-no-niri-janelas-que-somem-com-um-atalho | grep -o 'class="code-title">[^<]*'` mostra os rótulos (o dev server já no ar recarrega o `.md`; se o rótulo não aparecer, avise em vez de reiniciar o servidor).
**Passo 5:** `/git commit`.

---

## Fecho

`npm run verify` sem erro novo. Conferência visual no dev: `/scratchpad-no-niri-janelas-que-somem-com-um-atalho` (título largo, "Índice", botão "Contato", barras dos três blocos) em 1280px e 390px, e um case com bloco de código.
