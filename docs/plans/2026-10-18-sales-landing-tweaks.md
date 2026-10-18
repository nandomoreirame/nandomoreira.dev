# Plano: sales-landing-tweaks

> **Spec:** docs/specs/sales-landing-tweaks/SPEC.md

**Objetivo:** ajustes da landing de vendas antes do primeiro deploy: efeito do hero da home, header fixo que encolhe, botões flutuantes, prazo de entrega, duas ferramentas, foto, galeria, cards e o link de detalhe.
**Arquitetura:** só camada de apresentação e dados de `src/lib/sales/`. O efeito reaproveita o `PointerField` (o script único do site) e as regras `[data-pointer-field]`, `[data-parallax]`, `[data-tilt]` e `[data-site-header]` que já estão no `global.css`.
**Stack:** Astro 7, Tailwind 4, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 11 (10 e 11 acrescentadas em 2026-10-18).
**Complexidade estimada:** large.
**Depende de:** `sales-landing` (implementada).

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho.
- Nenhum hex fora do `@theme` do `global.css`, nenhum valor arbitrário `[...]`, nenhum `max-w-xs` a `max-w-3xl` (colidem com a escala de espaçamento), nenhum `<script>` novo.
- Texto visível em pt-BR com acentos; sem travessão.
- No fim de cada tarefa: `npx vitest run tests/sales tests/design-system tests/config` verde (a falha antiga de `tests/design-system/code-contrast.test.ts` não conta) e `npm run check` sem erro novo (o de `vitest.config.ts:12` é antigo).

---

### Tarefa 1: tirar o Gatman Corp da galeria

**Requisito:** REQ-002
**Arquivos:**
- Modificar: `src/lib/sales/proof.ts`, `tests/sales/proof.test.ts`, `tests/sales/sections-social.test.ts`
- Remover: `public/servicos/trabalhos/gatman-corp.webp`, `public/servicos/trabalhos/gatman-corp-ampliada.webp`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer

**Passo 1: teste que falha.** Em `tests/sales/proof.test.ts`, troque `expect(MORE_WORK.length).toBe(10);` por:

```ts
    expect(MORE_WORK.length).toBe(9);
    expect(MORE_WORK.map((work) => work.slug)).not.toContain('gatman-corp');
```

E acrescente ao `describe('MORE_WORK')`:

```ts
  it('ships no image for a work that left the gallery', () => {
    expect(existsSync('public/servicos/trabalhos/gatman-corp.webp')).toBe(false);
    expect(existsSync('public/servicos/trabalhos/gatman-corp-ampliada.webp')).toBe(false);
  });
```

Em `tests/sales/sections-social.test.ts`, troque toda contagem `10` por `9` (miniaturas, popovers, botões de abrir e de fechar).

**Passo 2:** `npx vitest run tests/sales/proof.test.ts tests/sales/sections-social.test.ts`. Esperado: FAIL (10 em vez de 9).

**Passo 3: implementação.** Em `src/lib/sales/proof.ts`, apague a linha do `gatman-corp` em `MORE_WORK`. Apague os dois arquivos:

```bash
rm public/servicos/trabalhos/gatman-corp.webp public/servicos/trabalhos/gatman-corp-ampliada.webp
```

**Passo 4:** mesmo comando do passo 2. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 2: foto na altura do card

**Requisito:** REQ-001
**Arquivos:**
- Modificar: `src/components/sales/AboutCard.astro` (o `<img>`)
- Teste: `tests/sales/sections-proof.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails

**Passo 1: teste que falha.** Acrescente ao `describe('AboutCard')`:

```ts
  it('stretches the photo to the card height from sm up', async () => {
    const html = await render(AboutCard);
    const img = html.match(/<img[^>]*fernando\.webp[^>]*>/)?.[0] ?? '';
    expect(img).toContain('sm:self-stretch');
    expect(img).toContain('sm:aspect-auto');
    expect(img).toContain('object-cover');
    expect(img).not.toContain('size-32');
  });
```

**Passo 2:** `npx vitest run tests/sales/sections-proof.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** No `<img>` de `AboutCard.astro`, troque o `class` por:

```astro
class="aspect-square w-32 shrink-0 rounded-md border border-primary object-cover object-top sm:aspect-auto sm:w-40 sm:self-stretch"
```

E troque `width="160" height="160"` por `width="320" height="400"` (proporção do recorte em telas largas).

**Passo 4:** mesmo comando. Esperado: PASS. Confira no `contrate.nandomoreira.local:4321` que a foto vai do topo ao fim do texto.

**Passo 5:** `/git commit`.

---

### Tarefa 3: prazo de entrega de 5 a 30 dias úteis

**Requisito:** REQ-006
**Arquivos:**
- Modificar: `src/lib/sales/copy.ts` (`hero.proofs`, `faq`), `src/lib/sales/catalog.ts` (`SITE_INSTITUCIONAL.faq`)
- Teste: `tests/sales/copy.test.ts`, `tests/sales/catalog.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: business-logic-reviewer

**Passo 1: teste que falha.** Em `tests/sales/copy.test.ts`, dentro de `describe('SALES_COPY')`:

```ts
  it('states the delivery range in the hero and in the FAQ', () => {
    expect(SALES_COPY.hero.proofs).toContain('Entrega em 5 a 30 dias úteis');
    const answer = SALES_COPY.faq.find((item) => item.question === 'Quanto tempo leva?')!.answer;
    expect(answer).toContain('de 5 a 30 dias úteis de trabalho');
    expect(answer).toContain('proposta');
  });
```

Em `tests/sales/catalog.test.ts`:

```ts
  it('states the delivery range in the detail FAQ', () => {
    const answer = detailFor('site-institucional')!.detail.faq.find((item) => item.question.startsWith('Quanto tempo'))!.answer;
    expect(answer).toContain('de 5 a 30 dias úteis de trabalho');
  });
```

**Passo 2:** `npx vitest run tests/sales/copy.test.ts tests/sales/catalog.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`copy.ts`, `hero.proofs`:

```ts
    proofs: ['15 anos de código em produção', 'Design aprovado antes da programação', 'Entrega em 5 a 30 dias úteis', 'Sem jargão técnico'],
```

`copy.ts`, resposta de "Quanto tempo leva?":

```ts
    { question: 'Quanto tempo leva?', answer: 'Em geral, de 5 a 30 dias úteis de trabalho, conforme o tamanho do projeto. O prazo exato vem na proposta, com a data de cada etapa, e você acompanha o andamento pelo link de teste.' },
```

`catalog.ts`, resposta de "Quanto tempo leva para ficar pronto?":

```ts
    { question: 'Quanto tempo leva para ficar pronto?', answer: 'Em geral, de 5 a 30 dias úteis de trabalho, conforme o que o site precisa ter. O prazo exato vem na proposta, com a data de cada etapa.' },
```

**Passo 4:** mesmo comando, mais `npx vitest run tests/sales/` (o portão de números inventados continua verde: "dias úteis" não é métrica proibida). Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 4: duas ferramentas a mais

**Requisito:** REQ-008
**Arquivos:**
- Modificar: `src/lib/sales/copy.ts` (`toolsHeader.lead`, `tools`)
- Teste: `tests/sales/copy.test.ts`, `tests/sales/sections-middle.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: business-logic-reviewer

**Passo 1: teste que falha.** Em `tests/sales/copy.test.ts`, troque a lista esperada de `'explains the seven Firebase tools by analogy'` pelo teste abaixo (o nome também muda):

```ts
  it('explains the nine tools by analogy, Firebase first', () => {
    expect(SALES_COPY.tools.map((tool) => tool.name)).toEqual([
      'Firebase Hosting', 'Firebase App Hosting', 'Firestore', 'Authentication', 'Cloud Functions', 'Cloud Storage', 'Gemini', 'Mercado Pago ou Stripe', 'Resend',
    ]);
    expect(SALES_COPY.toolsHeader.lead).not.toMatch(/cada peça dela/);
  });
```

Em `tests/sales/sections-middle.test.ts`, no `ToolsGrid`, troque `toHaveLength(7)` por `toHaveLength(9)` e acrescente `expect(html).toContain('O carteiro');`.

**Passo 2:** `npx vitest run tests/sales/copy.test.ts tests/sales/sections-middle.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em `copy.ts`:

```ts
    lead: 'Pense na tecnologia como uma loja física. Eu uso o Firebase, a plataforma do Google, e alguns serviços parceiros, e cada peça faz um papel conhecido.',
```

E, no fim de `tools`, depois do Gemini:

```ts
    { name: 'Mercado Pago ou Stripe', analogy: 'O caixa', text: 'Recebe Pix, cartão e boleto com segurança e avisa o seu sistema assim que o pagamento cai.' },
    { name: 'Resend', analogy: 'O carteiro', text: 'Entrega os e-mails do seu site: confirmação de pedido, aviso de cadastro e as mensagens do formulário.' },
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 5: esconder o link "Entender em detalhes"

**Requisito:** REQ-010
**Arquivos:**
- Modificar: `src/lib/sales/catalog.ts`, `src/components/sales/ServiceBlocks.astro`
- Teste: `tests/sales/catalog.test.ts`, `tests/sales/sections-top.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer

**Passo 1: teste que falha.** Em `tests/sales/catalog.test.ts` (importe `SHOW_DETAIL_LINKS`):

```ts
  it('keeps the detail links off for the first deploy', () => {
    expect(SHOW_DETAIL_LINKS).toBe(false);
  });
```

Em `tests/sales/sections-top.test.ts`, troque o teste `'links "Entender em detalhes" only where a detail page exists'` por:

```ts
  it('shows no detail link while SHOW_DETAIL_LINKS is off', async () => {
    const out = await html(ServiceBlocks);
    expect(out).not.toContain('Entender em detalhes');
    expect(out).not.toContain('href="/servicos/site-institucional"');
  });
```

**Passo 2:** `npx vitest run tests/sales/catalog.test.ts tests/sales/sections-top.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em `catalog.ts`, antes de `serviceAnchor`:

```ts
/**
 * The detail pages stay reachable by URL, but the cards do not link to them
 * until they are reviewed in production (sales-landing-tweaks, REQ-010).
 * Flip to true to show "Entender em detalhes" again.
 */
export const SHOW_DETAIL_LINKS = false;
```

Em `ServiceBlocks.astro`, importe `SHOW_DETAIL_LINKS` junto de `SALES_SERVICES` e troque `{service.detail && (` por `{SHOW_DETAIL_LINKS && service.detail && (`.

**Passo 4:** mesmo comando, mais `npx vitest run "tests/sales/detail-page.test.ts"` (a página continua 200). Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 6: botões flutuantes de WhatsApp e voltar ao topo

**Requisito:** REQ-007
**Arquivos:**
- Modificar: `src/styles/global.css` (`@theme`, perto de `--color-success`), `tests/design-system/contrast.test.ts`, `src/layouts/SalesLayout.astro`
- Criar: `src/components/sales/FloatingActions.astro`
- Teste: `tests/sales/floating-actions.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: accessibility-guardrails, test-reviewer

**Passo 1: testes que falham.**

`tests/sales/floating-actions.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FloatingActions from '../../src/components/sales/FloatingActions.astro';
import SalesLayout from '../../src/layouts/SalesLayout.astro';

const render = async () => (await AstroContainer.create()).renderToString(FloatingActions);

describe('FloatingActions', () => {
  it('links WhatsApp through /go, in a new tab, with a name and a visible hint', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/go\/contato\/whatsapp"[^>]*target="_blank"[^>]*rel="noopener"/);
    expect(html).toContain('aria-label="Fale comigo no WhatsApp"');
    expect(html).toContain('>Fale comigo no WhatsApp</span>');
  });

  it('goes back to the top without a script', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="#topo"[^>]*aria-label="Voltar ao topo"/);
    expect(html).not.toContain('<script');
  });

  it('keeps both targets at 44px with a visible focus ring', async () => {
    const links = (await render()).match(/<a[^>]*>/g) ?? [];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain('size-11');
      expect(link).toContain('focus-visible:outline-2');
    }
  });

  it('is on every sales page, with the #topo anchor at the top', async () => {
    const html = await (await AstroContainer.create()).renderToString(SalesLayout, {
      props: { title: 'T', description: 'D' },
      slots: { default: '<h1>T</h1>' },
      request: new Request('https://nandomoreira.dev/servicos'),
    });
    expect(html).toContain('aria-label="Voltar ao topo"');
    expect(html.indexOf('id="topo"')).toBeLessThan(html.indexOf('<header'));
  });
});
```

Em `tests/design-system/contrast.test.ts`, siga o padrão do teste `'reads primary-foreground against primary, since the CTA inverts them'` e acrescente:

```ts
  it('reads the WhatsApp icon against its green, since the floating button inverts them', () => {
    expect(contrastRatio(token('whatsapp-foreground'), token('whatsapp'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token('whatsapp'), BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
```

**Passo 2:** `npx vitest run tests/sales/floating-actions.test.ts tests/design-system/contrast.test.ts`. Esperado: FAIL (componente e tokens inexistentes).

**Passo 3: implementação.**

`global.css`, no `@theme`, depois de `--color-success`:

```css
  /* WhatsApp's own green on the floating button. The icon on it is dark:
     white on #25d366 is 1.98:1 (sales-landing-tweaks). */
  --color-whatsapp: #25d366;
  --color-whatsapp-foreground: #0b0b0c;
```

`src/components/sales/FloatingActions.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { contactGoPath } from '../../lib/analytics/outbound';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
---

{/* Fixed bottom-right, no script: the hint shows on hover and on keyboard focus. */}
<div class="fixed right-md bottom-md z-40 flex flex-col items-end gap-sm">
  <a
    href={contactGoPath('whatsapp')}
    target="_blank"
    rel="noopener"
    aria-label="Fale comigo no WhatsApp"
    class={`group relative inline-flex size-11 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground transition-transform duration-(--duration-fast) ease-out hover:scale-105 ${focusRing}`}
  >
    <Icon name="simple-icons:whatsapp" class="size-5" aria-hidden="true" />
    <span aria-hidden="true" class="pointer-events-none absolute right-full mr-sm whitespace-nowrap rounded-sm bg-primary px-sm py-xs text-small font-medium text-primary-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100">Fale comigo no WhatsApp</span>
  </a>
  <a
    href="#topo"
    aria-label="Voltar ao topo"
    class={`inline-flex size-11 items-center justify-center rounded-full border border-border-strong bg-surface-elevated text-foreground transition-[border-color] duration-(--duration-fast) ease-out hover:border-primary ${focusRing}`}
  >
    <Icon name="lucide:chevron-up" class="size-5" aria-hidden="true" />
  </a>
</div>
```

`SalesLayout.astro`: importe `FloatingActions from '../components/sales/FloatingActions.astro'`; logo depois de `<body>` acrescente `<div id="topo"></div>`; e, depois do `</footer>`, `<FloatingActions />`.

**Passo 4:** mesmo comando, mais `npx vitest run tests/sales/layout.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 7: fundo de pontos e parallax da ilustração (PointerField)

**Requisito:** REQ-003, REQ-004
**Depende de:** tarefa 6 (mesmo arquivo de layout)
**Arquivos:**
- Modificar: `src/layouts/SalesLayout.astro` (`<body>`, fim do body), `src/components/sales/HeroArt.astro`, `tests/sales/layout.test.ts` (o teste `'does not reuse the main site frame or its script'`), `tests/sales/sections-top.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, consequences-reviewer

**Passo 1: testes que falham.** Em `tests/sales/layout.test.ts`, troque o teste `'does not reuse the main site frame or its script'` por:

```ts
  it('reuses only the pointer field of the main site, not its header or footer', async () => {
    const html = await render();
    expect(html).toMatch(/<body[^>]*data-pointer-field/);
    // The main site menu links the blog; the sales frame never does.
    expect(html).not.toContain('href="/posts"');
  });
```

Em `tests/sales/sections-top.test.ts`, acrescente ao `describe('SalesHero')`:

```ts
  it('layers the art like the home portrait: tilt on the frame, parallax at three depths', async () => {
    const out = await html(SalesHero);
    expect(out).toMatch(/data-hero-art[^>]*data-parallax[^>]*data-tilt|data-parallax[^>]*data-tilt[^>]*data-hero-art/);
    const depths = [...out.matchAll(/--depth:\s*([\d.]+)/g)].map((match) => Number(match[1]));
    expect(depths).toHaveLength(4);
    expect(new Set(depths).size).toBe(4);
  });
```

**Passo 2:** `npx vitest run tests/sales/layout.test.ts tests/sales/sections-top.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`SalesLayout.astro`: `import PointerField from '../components/art/PointerField.astro';`; troque `<body>` por `<body data-pointer-field>` e acrescente `<PointerField />` como último elemento do `<body>`, como no `BaseLayout`.

`HeroArt.astro`: a raiz ganha `data-parallax data-tilt style="--depth: 0.02"` (o mesmo do `Portrait` da home). As três janelas ganham `data-parallax` com profundidades diferentes, a da frente mexendo mais:

- primeira janela (o site): `data-parallax style="--depth: 0.01"`
- segunda (loja / vitrine): `data-parallax style="--depth: 0.03"`
- terceira (painel): `data-parallax style="--depth: 0.045"`

Nada além disso: as regras de `[data-parallax]` e `[data-tilt]` já estão no `global.css` e respeitam `prefers-reduced-motion` e `pointer: fine`.

**Passo 4:** mesmo comando, depois `npm run build && npm run test:build` (o portão de JS precisa aceitar o script do ponteiro em `/servicos` e no detalhe, dentro do limite de 1,5 KB). Esperado: PASS. Confira no `contrate.nandomoreira.local:4321` que a grade de pontos acende sob o mouse e a ilustração se move.

**Passo 5:** `/git commit`.

---

### Tarefa 8: header fixo que encolhe ao rolar

**Requisito:** REQ-005
**Depende de:** tarefa 7 (o `PointerField` é quem marca `data-scrolled`)
**Arquivos:**
- Modificar: `src/layouts/SalesLayout.astro` (`<header>`, a `div` interna e o link Conversar)
- Teste: `tests/sales/layout.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails

**Passo 1: teste que falha.**

```ts
  it('pins the header and shrinks it once the page scrolls', async () => {
    const header = (await render()).match(/<header[^>]*>/)?.[0] ?? '';
    expect(header).toContain('data-site-header');
    expect(header).toContain('sticky');
    expect(header).toContain('top-0');
    expect(header).toContain('data-scrolled:backdrop-blur-lg');
    expect(await render()).toMatch(/group-data-scrolled:py-xs/);
    expect(await render()).toMatch(/group-data-scrolled:min-h-9/);
  });
```

**Passo 2:** `npx vitest run tests/sales/layout.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** No `SalesLayout.astro`:

```astro
<header
  data-site-header
  class="group sticky top-0 z-40 border-b border-border transition-[background-color] duration-(--duration-base) ease-out data-scrolled:bg-background/80 data-scrolled:backdrop-blur-lg"
>
  <div class="mx-auto flex w-full max-w-page items-center justify-between gap-md px-lg py-md transition-[padding] duration-(--duration-base) ease-out group-data-scrolled:py-xs">
```

O link Conversar troca o `class` por:

```astro
class="inline-flex min-h-11 items-center rounded-md bg-primary px-md text-small font-medium text-primary-foreground transition-[min-height,padding] duration-(--duration-base) ease-out group-data-scrolled:min-h-9 group-data-scrolled:px-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
```

36px no estado encolhido é decisão registrada na spec (acima dos 24px do WCAG 2.2 AA). Sem JS, o header fica fixo e no tamanho cheio.

**Passo 4:** mesmo comando. Esperado: PASS. Confira no `contrate.nandomoreira.local:4321` rolando a página, e que as âncoras (`#servicos`, `#contato`) não ficam escondidas sob o header (as seções usam `scroll-mt-2xl`).

**Passo 5:** `/git commit`.

---

### Tarefa 9: borda suave nos cards no hover

**Requisito:** REQ-009
**Arquivos:**
- Modificar: `src/components/sales/ServiceBlocks.astro`, `ToolsGrid.astro`, `ProjectShowcase.astro`, `Testimonials.astro`, `MoreWork.astro`, `StepsTimeline.astro`, `AboutCard.astro`, `ServiceDetail.astro` (todos em `src/components/sales/`)
- Teste: `tests/sales/card-hover.test.ts` (criar)

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails

**Passo 1: teste que falha.** `tests/sales/card-hover.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Detail from '../../src/pages/servicos/[slug].astro';
import Landing from '../../src/pages/servicos/index.astro';

/** A card is a surface bounded by the hairline; every one lifts its border on hover. */
const cards = (html: string) =>
  [...html.matchAll(/class="([^"]*\bborder-border\b[^"]*\bbg-surface\b[^"]*)"/g)].map((match) => match[1]!);

describe('card hover on the sales pages', () => {
  it.each([
    ['/servicos', Landing, {}],
    ['/servicos/site-institucional', Detail, { slug: 'site-institucional' }],
  ])('%s softens every card border on hover', async (path, page, params) => {
    const html = await (await AstroContainer.create()).renderToString(page as never, {
      params,
      request: new Request(`https://nandomoreira.dev${path}`),
    });
    const list = cards(html);
    expect(list.length).toBeGreaterThan(10);
    for (const card of list) {
      expect(card, card).toContain('hover:border-border-strong');
      expect(card, card).toContain('transition-[border-color]');
    }
  });
});
```

**Passo 2:** `npx vitest run tests/sales/card-hover.test.ts`. Esperado: FAIL, com a lista dos cards sem hover.

**Passo 3: implementação.** Em cada card dos arquivos listados (todo elemento com `border border-border bg-surface`, sem os destacados por `border-primary`), acrescente:

```
transition-[border-color] duration-(--duration-base) ease-out hover:border-border-strong
```

O `SituationGrid` já tem hover e não muda. A borda é só reforço visual: nenhum card passa a depender dela para indicar que é clicável.

**Passo 4:** mesmo comando, mais `npx vitest run tests/sales tests/design-system`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Acréscimo de 2026-10-18: anos de carreira calculados

### Tarefa 10: `+N anos` calculado nas páginas de vendas

**Requisito:** REQ-011
**Arquivos:**
- Criar: `src/lib/format/career-years.ts`
- Modificar: `src/lib/sales/copy.ts` (`hero.proofs`, `about.points[0].title`), `src/components/sales/SalesHero.astro`, `src/components/sales/AboutCard.astro`
- Teste: `tests/format/career-years.test.ts` (criar), `tests/sales/sections-top.test.ts`, `tests/sales/sections-proof.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: testes que falham.**

`tests/format/career-years.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CAREER_START_YEAR, careerYears, careerYearsLabel, withCareerYears } from '../../src/lib/format/career-years';

describe('career years', () => {
  it('counts from 2011', () => {
    expect(CAREER_START_YEAR).toBe(2011);
    expect(careerYears(new Date('2026-10-18T12:00:00Z'))).toBe(15);
    expect(careerYears(new Date('2027-01-01T00:00:00Z'))).toBe(16);
  });

  it('labels with a leading plus', () => {
    expect(careerYearsLabel(new Date('2026-10-18T12:00:00Z'))).toBe('+15 anos');
  });

  it('fills every {anos} marker and leaves other text alone', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    expect(withCareerYears('{anos} construindo software', now)).toBe('+15 anos construindo software');
    expect(withCareerYears('há {anos}, {anos}', now)).toBe('há +15 anos, +15 anos');
    expect(withCareerYears('sem marcador', now)).toBe('sem marcador');
  });
});
```

Em `tests/sales/sections-top.test.ts`, no `describe('SalesHero')` (importe `careerYearsLabel`):

```ts
  it('shows the career years computed at render', async () => {
    const out = await html(SalesHero);
    expect(out).toContain(`${careerYearsLabel()} de código em produção`);
    expect(out).not.toContain('{anos}');
  });
```

Em `tests/sales/sections-proof.test.ts`, troque a asserção do AboutCard sobre os anos por:

```ts
    expect(html).toContain(`${careerYearsLabel()} construindo software`);
    expect(html).not.toContain('{anos}');
```

**Passo 2:** `npx vitest run tests/format/career-years.test.ts tests/sales/sections-top.test.ts tests/sales/sections-proof.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/lib/format/career-years.ts`:

```ts
/**
 * First professional year. The "+N anos" is computed when the page renders,
 * never typed, so it does not age (asked on 2026-10-18).
 */
export const CAREER_START_YEAR = 2011;

export const careerYears = (now: Date = new Date()): number => now.getUTCFullYear() - CAREER_START_YEAR;

export const careerYearsLabel = (now?: Date): string => `+${careerYears(now)} anos`;

/** Replaces every {anos} marker in a text with the label. */
export const withCareerYears = (text: string, now?: Date): string =>
  text.replaceAll('{anos}', careerYearsLabel(now));
```

`copy.ts`: o primeiro item de `hero.proofs` vira `'{anos} de código em produção'` e o título do primeiro ponto de `about.points` vira `'{anos} construindo software'`.

`SalesHero.astro` e `AboutCard.astro`: importe `withCareerYears` de `../../lib/format/career-years` e renderize `{withCareerYears(proof)}` e `{withCareerYears(point.title)}` no lugar do texto cru. As páginas são renderizadas no servidor a cada requisição, então o número vira sozinho na virada do ano.

**Passo 4:** mesmo comando, mais `npx vitest run tests/sales/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 11: `+N anos` no perfil, pela camada de acesso

**Requisito:** REQ-012
**Depende de:** tarefa 10
**Arquivos:**
- Modificar: `src/lib/content/profile.ts` (`getProfile`), `src/content/profile/profile.md` (`bio`, `trajectory`)
- Teste: `tests/content/profile-career-years.test.ts` (criar)

**Time:**
- Track: data
- Implementer: backend-engineer
- Reviewers: consequences-reviewer, business-logic-reviewer

**Antes de editar o `profile.md`:** confira se há dev server (`./node_modules/.bin/astro dev status`). Se houver, pare antes da edição e suba de novo depois, senão o store grava o perfil antigo (armadilha do CLAUDE.md).

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { careerYearsLabel } from '../../src/lib/format/career-years';
import { applyCareerYears } from '../../src/lib/content/profile';
import { getProfile } from '../../src/lib/content';

describe('career years on the profile', () => {
  it('fills the marker in the bio and in the trajectory, and nothing else', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    const profile = applyCareerYears(
      { bio: 'Construo software há {anos}.', trajectory: [{ value: '{anos}', label: 'construindo software', context: 'Desde 2011.' }] } as never,
      now,
    );
    expect(profile.bio).toBe('Construo software há +15 anos.');
    expect(profile.trajectory[0]).toEqual({ value: '+15 anos', label: 'construindo software', context: 'Desde 2011.' });
  });

  it('serves the computed label from getProfile, with no marker left', async () => {
    const profile = await getProfile();
    expect(profile.bio).toContain(careerYearsLabel());
    expect(JSON.stringify(profile)).not.toContain('{anos}');
    expect(profile.trajectory.map((item) => item.value)).toContain(careerYearsLabel());
  });
});
```

**Passo 2:** `npx vitest run tests/content/profile-career-years.test.ts`. Esperado: FAIL (`applyCareerYears` inexistente).

**Passo 3: implementação.**

`src/lib/content/profile.ts`:

```ts
import { withCareerYears } from '../format/career-years';

/** The {anos} marker in the bio and the trajectory becomes "+N anos" here, once, for every surface. */
export const applyCareerYears = (profile: Profile, now?: Date): Profile => ({
  ...profile,
  bio: withCareerYears(profile.bio, now),
  trajectory: profile.trajectory.map((item) => ({
    ...item,
    value: withCareerYears(item.value, now),
    label: withCareerYears(item.label, now),
    context: withCareerYears(item.context, now),
  })),
});
```

E `getProfile` devolve `applyCareerYears(entries[0].data)`.

`profile.md`: na `bio`, `há 15 anos` vira `há {anos}`; na trajetória, `value: "15 anos"` vira `value: "{anos}"` e o `context` troca `Desde 2010` por `Desde 2011`.

**Passo 4:** `npx vitest run tests/content tests/aeo tests/home tests/pages tests/about` (as rotas de máquina e as páginas leem o perfil por aqui). Esperado: PASS. Se algum teste fixava o texto "15 anos", troque a expectativa por `careerYearsLabel()`.

**Passo 5:** `/git commit`.
