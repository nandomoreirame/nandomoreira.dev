# Plano: terminal-noir-fixes

> **Spec:** docs/specs/terminal-noir-fixes/SPEC.md

**Objetivo:** quatro ajustes visuais no Contato, no blog e na `/now` (feitos), mais o hero, os títulos no padrão terminal, a assinatura de novidades por e-mail e a 404 do Stitch.
**Arquitetura:** mudanças pontuais de classe e de markup, com uma regra de CSS movida da utility para `@layer components`.
**Stack:** Astro 7, Tailwind 4, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 16 (1 a 12 feitas; 13 a 16 no lote 3).
**Complexidade estimada:** large.

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho, que precisa falhar pelo motivo certo.
- Nenhum texto visível novo, nenhum hex, nenhum valor arbitrário novo, nenhum `<script>`.
- No fim: `npx vitest run` todo verde e `npm run check` com 0 erros.

---

### Tarefa 1: campo Mensagem 25% menor

**Requisito:** REQ-001
**Arquivos:**
- Modificar: `src/pages/contato.astro` (o `<textarea id="contato-mensagem">`, atributo `rows`)
- Teste: `tests/contact/contact-layout.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho** (acrescentar no `describe('/contato layout')`)
```ts
  it('keeps the message field about a quarter shorter, at four rows', async () => {
    const textarea = (await render()).match(/<textarea[^>]*id="contato-mensagem"[^>]*>/)?.[0] ?? '';
    expect(textarea).toMatch(/\brows="4"/);
  });
```

**Passo 2:** `npx vitest run tests/contact/contact-layout.test.ts`. Esperado: FAIL (`rows="6"`).

**Passo 3:** no `<textarea id="contato-mensagem">`, `rows="6"` vira `rows="4"`.

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 2: check visível no checkbox marcado

**Requisito:** REQ-002
**Arquivos:**
- Modificar: `src/pages/contato.astro` (o `<span aria-hidden="true" class="check-box ...">`)
- Modificar: `src/styles/global.css` (regra `.check-box`, dentro de `@layer components`)
- Teste: `tests/design-system/ai-view-css.test.ts` e `tests/pages/contato.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Causa:** as regras de estado estão em `@layer components`, e o span carrega a utility
`bg-background`, que fica numa camada acima e vence. O fundo âmbar do estado marcado nunca
aplica, e o check escuro (`--color-primary-foreground`) some sobre o fundo escuro.

**Passo 1: testes vermelhos**

Em `tests/design-system/ai-view-css.test.ts`, no `describe('Contact interest checkboxes, pure CSS')`:
```ts
  it('paints the resting background in the rule, so a utility cannot beat the checked state', () => {
    expect(rule('.check-box')).toMatch(/background-color:\s*var\(--color-background\)/);
  });
```
Em `tests/pages/contato.test.ts`, no `describe('/contato')`:
```ts
  it('leaves every colour of the checkbox box to the stylesheet, with no bg or text utility on it', async () => {
    const boxes = (await render()).match(/<span[^>]*class="[^"]*\bcheck-box\b[^"]*"/g) ?? [];
    expect(boxes.length).toBe(5);
    for (const box of boxes) {
      expect(box).not.toMatch(/\bbg-[a-z]/);
      expect(box).not.toMatch(/\btext-(?:primary|foreground|muted|background)/);
    }
  });
```

**Passo 2:** `npx vitest run tests/design-system/ai-view-css.test.ts tests/pages/contato.test.ts`. Esperado: FAIL nos dois testes novos.

**Passo 3: implementação**
- No span, tirar `bg-background` da lista de classes (o resto fica igual).
- Em `global.css`, a regra `.check-box` passa a ser:
```css
  .check-box {
    border-color: var(--color-border-strong);
    background-color: var(--color-background);
    color: transparent;
  }
```

**Passo 4:** mesmo comando. Esperado: PASS. Conferir no navegador (dev server) que, ao marcar, a caixa fica âmbar com o check escuro no meio.

**Passo 5:** `/git commit`

### Tarefa 3: resumo do PostRow na largura da linha

**Requisito:** REQ-003
**Arquivos:**
- Modificar: `src/components/posts/PostRow.astro` (o `<span data-summary>`)
- Teste: `tests/posts/post-row.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho** (acrescentar no `describe('PostRow')`)
```ts
  it('lets the summary use the full row width, with no measure cap', async () => {
    const summary = (await render()).match(/<span[^>]*data-summary[^>]*>/)?.[0] ?? '';
    expect(summary).not.toMatch(/\bmax-w-/);
  });
```

**Passo 2:** `npx vitest run tests/posts/post-row.test.ts`. Esperado: FAIL (`max-w-[68ch]`).

**Passo 3:** no `<span data-summary>`, tirar `max-w-[68ch]`; fica `class="text-body text-muted-foreground"`.

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 4: Foco sem card na `/now`

**Requisito:** REQ-004
**Arquivos:**
- Modificar: `src/pages/now.astro` (o `<Card>` em volta do corpo de "Foco"; o import de `Card` continua, porque o card final "O que é uma página Agora?" o usa)
- Teste: `tests/now/now-steps.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho.** Trocar o teste `'puts the focus block inside a card'` por:
```ts
  it('keeps the focus block as plain text like the other sections, with only the availability in a card', async () => {
    const html = await render();
    const focus = html.slice(html.indexOf('id="foco"'), html.indexOf('id="projetos"'));
    expect(focus).not.toMatch(/rounded-md border border-border bg-surface/);
    expect(focus).toContain('data-alert');
    expect(focus).toContain('Disponibilidade');
  });
```

**Passo 2:** `npx vitest run tests/now/now-steps.test.ts`. Esperado: FAIL (o `Card` ainda envolve o bloco).

**Passo 3:** em `now.astro`, remover o `<Card>` e o `</Card>` que envolvem as listas e o `<Alert title="Disponibilidade">` dentro da `NowSection id="foco"`, deixando o conteúdo como está.

**Passo 4:** `npx vitest run tests/now`. Esperado: PASS.

**Passo 5:** `/git commit`

---

## Lote 2: acréscimos de 2026-10-17 (REQ-005 a REQ-012)

As tarefas 1 a 4 já foram implementadas e revisadas (zero achados em
`docs/reviews/terminal-noir-fixes.md`). Este lote começa da árvore como está.
Mesmas regras de cima: sem git, TDD, `npx vitest run` e `npm run check` no fim.

### Tarefa 5: hero sem a pill e com 120px no topo

**Requisito:** REQ-005
**Arquivos:**
- Modificar: `src/components/home/Hero.astro` (remover o `<p>` com o link para `/mcp`; ajustar o espaçamento)
- Modificar: `src/pages/index.astro` (deixar de passar `availability` ao `Hero`)
- Teste: `tests/home/hero.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho.** Em `tests/home/hero.test.ts`, substituir os testes
`'turns the availability label into the way in for agents, at /mcp'` e
`'shows availability as a visual marker accompanied by a text label'` por:
```ts
  it('leaves availability to the header pill: no MCP link and no status dot in the hero', async () => {
    const html = await render();
    expect(html).not.toContain('href="/mcp"');
    expect(html).not.toContain('data-status-dot');
  });

  it('starts the headline 120px down on desktop (3xl padding plus lg margin)', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*id="inicio"[^>]*class="[^"]*\blg:pt-3xl\b/);
    expect(html).toMatch(/<h1[^>]*class="[^"]*\blg:mt-lg\b/);
  });
```
Tirar `availability` do objeto padrão de props do `render` desse arquivo.

**Passo 2:** `npx vitest run tests/home/hero.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
- `Hero.astro`: remover o `<p>` inteiro com o `<a href="/mcp">`, a prop `availability` e os imports que ficarem sem uso (`StatusDot`, `AVAILABILITY_LABEL`, `Availability`). A `<section>` fica `class="relative isolate py-2xl lg:pt-3xl lg:pb-3xl"`; o `<h1>` ganha `lg:mt-lg`.
- `index.astro`: tirar `availability={profile.availability}` do `<Hero>`.

**Passo 4:** `npx vitest run tests/home`. Esperado: PASS, inclusive `single-primary-cta.test.ts`.

**Passo 5:** `/git commit`

### Tarefa 6: linha Stack / Location

**Requisito:** REQ-006
**Arquivos:**
- Criar: `src/lib/home/hero.ts`
- Modificar: `src/components/home/Hero.astro` (bloco `data-hero-stack`), `src/pages/index.astro` (tirar `stack={profile.stack}`)
- Teste: `tests/home/hero.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho.** Substituir os testes `'lists at most five stack items when stack is given'` e `'omits the stack line when stack is absent'` por:
```ts
  it('shows the Stitch facts line: STACK in the accent, LOCATION in success', async () => {
    const line = (await render()).match(/<p[^>]*data-hero-stack[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(line).toMatch(/<span class="text-primary">STACK:<\/span>\s*TS, Py, Rust, LLM ops/);
    expect(line).toMatch(/<span class="text-success">LOCATION:<\/span>\s*São Paulo \/ Remote/);
    expect(line).toContain('font-mono');
  });
```
E em `tests/home/hero-facts.test.ts` (novo):
```ts
import { describe, expect, it } from 'vitest';
import { HERO_FACTS } from '../../src/lib/home/hero';

describe('HERO_FACTS', () => {
  it('abbreviates the stack and states the location, as approved', () => {
    expect(HERO_FACTS).toEqual({ stack: 'TS, Py, Rust, LLM ops', location: 'São Paulo / Remote' });
  });
});
```

**Passo 2:** `npx vitest run tests/home/hero.test.ts tests/home/hero-facts.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`src/lib/home/hero.ts`:
```ts
/** The facts line under the hero CTAs (REQ-006): short forms, as on the Stitch home. */
export const HERO_FACTS = {
  stack: 'TS, Py, Rust, LLM ops',
  location: 'São Paulo / Remote',
} as const;
```
`Hero.astro`: remover a prop `stack` e `stackLine`; o bloco passa a ser sempre renderizado:
```astro
<p data-hero-stack class="flex flex-wrap gap-x-lg gap-y-xs border-t border-border pt-md font-mono text-caption text-muted-foreground">
  <span><span class="text-primary">STACK:</span> {HERO_FACTS.stack}</span>
  <span><span class="text-success">LOCATION:</span> {HERO_FACTS.location}</span>
</p>
```
`index.astro`: tirar `stack={profile.stack}` do `<Hero>`.

**Passo 4:** `npx vitest run tests/home`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 7: eyebrow no padrão terminal

**Requisito:** REQ-007
**Arquivos:**
- Criar: `src/lib/layout/terminal-path.ts`
- Modificar: `src/components/ui/PageHeader.astro` (prop `eyebrow` vira `path` opcional, padrão `Astro.url.pathname`)
- Modificar: todas as páginas que passam `eyebrow=` ao `PageHeader` (`portfolio/index`, `lab/index`, `posts/index`, `posts/arquivo/index`, `posts/arquivo/[year]`, `404`, `curriculo`, `mcp`, `privacidade`, `setup`, `contato`, `now`): remover o atributo `eyebrow`
- Modificar: `src/pages/sobre.astro` (o `<p>` "Sobre" antes do `h1`)
- Teste: `tests/layout/terminal-path.test.ts`, `tests/components/page-header.test.ts`, `tests/pages/page-headers.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, consequences-reviewer

**Passo 1: testes vermelhos**

`tests/layout/terminal-path.test.ts` (novo):
```ts
import { describe, expect, it } from 'vitest';
import { terminalPath } from '../../src/lib/layout/terminal-path';

describe('terminalPath', () => {
  it('prefixes the path with ~ in lower case', () => {
    expect(terminalPath('/contato')).toBe('~/contato');
    expect(terminalPath('/Portfolio')).toBe('~/portfolio');
  });

  it('drops a trailing slash and keeps nested segments', () => {
    expect(terminalPath('/posts/arquivo/2018/')).toBe('~/posts/arquivo/2018');
  });

  it('reads the root as ~/', () => {
    expect(terminalPath('/')).toBe('~/');
    expect(terminalPath('')).toBe('~/');
  });
});
```
Em `tests/components/page-header.test.ts`: trocar `eyebrow: 'Laboratório'` por `path: '/lab'` no objeto `base`, e trocar o primeiro teste por:
```ts
  it('names the page as a terminal path before the only h1, in the accent and lower case', async () => {
    const html = await render(base);
    const eyebrow = html.match(/<p[^>]*data-page-path[^>]*>([^<]*)<\/p>/);

    expect(eyebrow?.[1]).toBe('~/lab');
    expect(eyebrow?.[0]).toContain('text-primary');
    expect(eyebrow?.[0]).not.toContain('uppercase');
    expect(html.indexOf('data-page-path')).toBeLessThan(html.indexOf('<h1'));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('text-display');
  });
```
Em `tests/pages/page-headers.test.ts`: o terceiro elemento de cada linha de `PAGES` vira o caminho esperado (`'~/portfolio'`, `'~/lab'`, `'~/posts'`, `'~/posts/arquivo'`, `'~/contato'`, `'~/mcp'`, `'~/404'`), e o `render` passa a request da rota, para o `PageHeader` ler a URL:
```ts
    return container.renderToString(Page, { request: new Request(`https://nandomoreira.dev${route}`) });
```
(renomeie o primeiro parâmetro do `describe.each` de `_route` para `route`). Para `/404`, use `route` `/404`.
Em `tests/pages/sobre.test.ts`, acrescentar:
```ts
  it('names the page as ~/sobre before the h1', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    expect(html).toMatch(/<p[^>]*data-page-path[^>]*>~\/sobre<\/p>/);
  });
```

**Passo 2:** `npx vitest run tests/layout/terminal-path.test.ts tests/components/page-header.test.ts tests/pages`. Esperado: FAIL.

**Passo 3: implementação**

`src/lib/layout/terminal-path.ts`:
```ts
/** A page path as a terminal prompt path (REQ-007): "/posts/arquivo/" -> "~/posts/arquivo". */
export const terminalPath = (pathname: string): string => {
  const trimmed = pathname.toLowerCase().replace(/\/+$/, '');
  return `~${trimmed === '' ? '/' : trimmed}`;
};
```
`PageHeader.astro`: props `path?: string`, `title`, `description` (sem `eyebrow`); `const shown = terminalPath(path ?? Astro.url.pathname);` e o primeiro parágrafo vira
`<p data-page-path class="font-mono text-small text-primary">{shown}</p>`.
Nas páginas, remover `eyebrow="..."` de cada `<PageHeader>`. Na `/sobre`, o `<p>` "Sobre" vira `<p data-page-path class="font-mono text-small text-primary">~/sobre</p>`.

**Passo 4:** `npx vitest run`. Esperado: PASS. Ajuste, sem enfraquecer, outro teste que procure o eyebrow antigo (`'Erro 404'`, `'Setup'` etc.): a asserção nova é o caminho.

**Passo 5:** `/git commit`

### Tarefa 8: domínio da assinatura (schema, store, handler)

**Requisito:** REQ-009, REQ-010
**Arquivos:**
- Criar: `src/lib/newsletter/schema.ts`, `src/lib/newsletter/store.ts`, `src/lib/newsletter/handler.ts`
- Teste: `tests/newsletter/handler.test.ts`, `tests/newsletter/store.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend, test-driven-development)
- Reviewers: business-logic-reviewer, security-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: testes vermelhos**

`tests/newsletter/store.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { subscriberId, toSubscriber } from '../../src/lib/newsletter/store';

describe('newsletter store', () => {
  it('ids a subscriber by the SHA-256 of the normalised email, so a repeat lands on the same document', () => {
    expect(subscriberId(' Fulano@Exemplo.COM ')).toBe(subscriberId('fulano@exemplo.com'));
    expect(subscriberId('fulano@exemplo.com')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stores only the email, the date and the source, never the network', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    expect(toSubscriber(' Fulano@Exemplo.com ', now)).toEqual({
      email: 'fulano@exemplo.com',
      subscribedAt: '2026-10-17T12:00:00.000Z',
      source: 'posts',
    });
  });
});
```
`tests/newsletter/handler.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { handleSubscribe } from '../../src/lib/newsletter/handler';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';

const form = (fields: Record<string, string>) =>
  new Request('https://nandomoreira.dev/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
    body: new URLSearchParams(fields).toString(),
  });

const deps = (overrides = {}) => ({
  store: { save: vi.fn().mockResolvedValue(undefined) },
  limiter: { check: vi.fn().mockReturnValue(true) },
  now: () => new Date('2026-10-17T12:00:00Z'),
  ...overrides,
});

const location = (response: Response) => response.headers.get('location');

describe('handleSubscribe', () => {
  it('stores a valid email and redirects back with ok', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(response.status).toBe(303);
    expect(location(response)).toBe('/posts?assinatura=ok#novidades');
    expect(d.store.save).toHaveBeenCalledWith('fulano@exemplo.com', new Date('2026-10-17T12:00:00Z'));
  });

  it('rejects an invalid email without storing', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'nao-e-email' }), d);
    expect(location(response)).toBe('/posts?assinatura=invalido#novidades');
    expect(d.store.save).not.toHaveBeenCalled();
  });

  it('answers a filled honeypot as ok and stores nothing', async () => {
    const d = deps();
    const response = await handleSubscribe(form({ email: 'bot@exemplo.com', [FORM_HONEYPOT]: 'x' }), d);
    expect(location(response)).toBe('/posts?assinatura=ok#novidades');
    expect(d.store.save).not.toHaveBeenCalled();
  });

  it('rate-limits per IP', async () => {
    const d = deps({ limiter: { check: vi.fn().mockReturnValue(false) } });
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(location(response)).toBe('/posts?assinatura=limite#novidades');
  });

  it('reports a storage failure as erro, never the driver message', async () => {
    const d = deps({ store: { save: vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED collection newsletter_subscribers')) } });
    const response = await handleSubscribe(form({ email: 'fulano@exemplo.com' }), d);
    expect(location(response)).toBe('/posts?assinatura=erro#novidades');
    expect(await response.text()).not.toContain('newsletter_subscribers');
  });

  it('refuses anything but a form POST', async () => {
    const response = await handleSubscribe(new Request('https://nandomoreira.dev/api/subscribe'), deps());
    expect(location(response)).toBe('/posts?assinatura=erro#novidades');
  });
});
```

**Passo 2:** `npx vitest run tests/newsletter`. Esperado: FAIL, módulos inexistentes.

**Passo 3: implementação**

`src/lib/newsletter/schema.ts`:
```ts
import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});
```
`src/lib/newsletter/store.ts`:
```ts
import { createHash } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';

export const NEWSLETTER_COLLECTION = 'newsletter_subscribers';

const normalise = (email: string): string => email.trim().toLowerCase();

/** Same email, same document: subscribing twice never duplicates (REQ-010). */
export const subscriberId = (email: string): string =>
  createHash('sha256').update(normalise(email)).digest('hex');

/** No IP and no user agent: the limiter uses the IP in memory and forgets it. */
export const toSubscriber = (email: string, now: Date) => ({
  email: normalise(email),
  subscribedAt: now.toISOString(),
  source: 'posts' as const,
});

export interface SubscriberStore {
  save: (email: string, now: Date) => Promise<void>;
}

/** gRPC ALREADY_EXISTS: the address is on the list already, which is a success. */
const ALREADY_EXISTS = 6;

export const firestoreSubscriberStore = (): SubscriberStore => ({
  save: async (email, now) => {
    try {
      await getFirestoreClient()
        .collection(NEWSLETTER_COLLECTION)
        .doc(subscriberId(email))
        .create(toSubscriber(email, now));
    } catch (error) {
      if ((error as { code?: number }).code === ALREADY_EXISTS) return;
      throw error;
    }
  },
});
```
`src/lib/newsletter/handler.ts`:
```ts
import { FORM_HONEYPOT } from '../hire/form';
import { readLimitedText } from '../hire/read-body';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { subscribeSchema } from './schema';
import type { SubscriberStore } from './store';

export type SubscribeOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

export interface SubscribeDependencies {
  store: SubscriberStore;
  limiter: Pick<Limiter, 'check'>;
  now: () => Date;
}

/** The card lives at the end of /posts; the page reads `assinatura`. */
const back = (outcome: SubscribeOutcome): Response =>
  new Response(null, {
    status: 303,
    headers: { location: `/posts?assinatura=${outcome}#novidades`, 'cache-control': 'no-store' },
  });

const isForm = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

export const handleSubscribe = async (
  request: Request,
  { store, limiter, now }: SubscribeDependencies,
): Promise<Response> => {
  if (request.method !== 'POST' || !isForm(request)) return back('erro');
  if (!limiter.check(clientIpOf(request.headers))) return back('limite');

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(await readLimitedText(request));
  } catch {
    return back('erro');
  }

  // A filled trap is answered as a success, so the bot never learns which field it is.
  if ((params.get(FORM_HONEYPOT) ?? '').trim() !== '') return back('ok');

  const result = subscribeSchema.safeParse({ email: params.get('email') ?? '' });
  if (!result.success) return back('invalido');

  try {
    await store.save(result.data.email, now());
  } catch {
    return back('erro');
  }
  return back('ok');
};
```

**Passo 4:** `npx vitest run tests/newsletter`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 9: rota `POST /api/subscribe`

**Requisito:** REQ-009
**Arquivos:**
- Criar: `src/pages/api/subscribe.ts`
- Teste: `tests/newsletter/route.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend, test-driven-development)
- Reviewers: security-reviewer, test-reviewer

**Passo 1: teste vermelho**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('/api/subscribe route', () => {
  const source = readFileSync('src/pages/api/subscribe.ts', 'utf8');

  it('is a server route wired to the newsletter handler and the Firestore store', () => {
    expect(source).toContain('export const prerender = false');
    expect(source).toContain('handleSubscribe(');
    expect(source).toContain('firestoreSubscriberStore()');
  });

  it('limits to five per IP every ten minutes', () => {
    expect(source).toMatch(/createLimiter\(\{\s*max:\s*5,\s*windowMs:\s*10 \* 60 \* 1000\s*\}\)/);
  });
});
```

**Passo 2:** `npx vitest run tests/newsletter/route.test.ts`. Esperado: FAIL (arquivo inexistente).

**Passo 3: implementação**
```ts
import type { APIRoute } from 'astro';
import { createLimiter } from '../../lib/hire/rate-limit';
import { handleSubscribe } from '../../lib/newsletter/handler';
import { firestoreSubscriberStore } from '../../lib/newsletter/store';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance, like /api/hire. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

const dependencies = { store: firestoreSubscriberStore(), limiter, now: () => new Date() };

export const ALL: APIRoute = ({ request }) => handleSubscribe(request, dependencies);
```

**Passo 4:** `npx vitest run tests/newsletter tests/aeo/no-leak.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 10: card "Novidades no terminal" na `/posts`

**Requisito:** REQ-008, REQ-009
**Arquivos:**
- Criar: `src/lib/newsletter/copy.ts`, `src/components/posts/NewsletterCard.astro`
- Modificar: `src/components/ui/Card.astro` (prop `id`)
- Modificar: `src/pages/posts/index.astro` (card no fim, depois do link "Arquivo por ano"; ler `assinatura`)
- Teste: `tests/posts/newsletter-card.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, security-reviewer

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NewsletterCard from '../../src/components/posts/NewsletterCard.astro';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import Posts from '../../src/pages/posts/index.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(NewsletterCard, { props });
};

describe('NewsletterCard', () => {
  it('is a card with the Stitch copy, anchored at #novidades', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*id="novidades"/);
    expect(html).toContain('Novidades no terminal');
    expect(html).toContain('Assine o feed de artigos técnicos');
    expect(html).toContain('Zero marketing. Apenas novos artigos quando saem no ar.');
    expect(html).toContain('lucide:mail');
  });

  it('posts a labelled email field to /api/subscribe, with the honeypot', async () => {
    const html = await render();
    expect(html).toMatch(/<form[^>]*action="\/api\/subscribe"[^>]*method="post"/);
    expect(html).toMatch(/<label[^>]*for="novidades-email"/);
    expect(html).toMatch(/<input[^>]*id="novidades-email"[^>]*type="email"[^>]*required/);
    expect(html).toContain(`name="${FORM_HONEYPOT}"`);
    expect(html).toMatch(/<button[^>]*type="submit"[\s\S]*?Assinar/);
  });

  it('links the privacy section', async () => {
    expect(await render()).toMatch(/href="\/privacidade#novidades"/);
  });

  it.each([
    ['ok', 'status'],
    ['invalido', 'alert'],
    ['limite', 'alert'],
    ['erro', 'alert'],
  ])('shows the %s outcome with role %s', async (outcome, role) => {
    expect(await render({ outcome })).toMatch(new RegExp(`role="${role}"`));
  });

  it('closes the /posts page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Posts, { request: new Request('https://nandomoreira.dev/posts?assinatura=ok') });
    expect(html).toContain('id="novidades"');
    expect(html).toMatch(/role="status"/);
  });
});
```

**Passo 2:** `npx vitest run tests/posts/newsletter-card.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`src/lib/newsletter/copy.ts`:
```ts
import type { SubscribeOutcome } from './handler';

/** Card copy from the Stitch screen (REQ-008); the author revises it later. */
export const NEWSLETTER_COPY = {
  eyebrow: 'Novidades no terminal',
  title: 'Assine o feed de artigos técnicos',
  text: 'Zero marketing. Apenas novos artigos quando saem no ar.',
  button: 'Assinar',
  placeholder: 'seu-email@dominio.com',
} as const;

export const NEWSLETTER_OUTCOMES: Record<SubscribeOutcome, { role: 'status' | 'alert'; text: string }> = {
  ok: { role: 'status', text: 'Pronto. Os próximos artigos chegam neste e-mail.' },
  invalido: { role: 'alert', text: 'Esse e-mail não parece válido. Confira e tente de novo.' },
  limite: { role: 'alert', text: 'Muitas tentativas seguidas. Tente de novo em alguns minutos.' },
  erro: { role: 'alert', text: 'Não consegui registrar agora. Tente de novo mais tarde.' },
};

export const outcomeOf = (value: string | null): SubscribeOutcome | undefined =>
  value && value in NEWSLETTER_OUTCOMES ? (value as SubscribeOutcome) : undefined;
```
`src/components/posts/NewsletterCard.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import Card from '../ui/Card.astro';
import { FORM_HONEYPOT } from '../../lib/hire/form';
import type { SubscribeOutcome } from '../../lib/newsletter/handler';
import { NEWSLETTER_COPY, NEWSLETTER_OUTCOMES } from '../../lib/newsletter/copy';

interface Props {
  outcome?: SubscribeOutcome;
}

const { outcome } = Astro.props;
const result = outcome ? NEWSLETTER_OUTCOMES[outcome] : undefined;
---

<Card as="section" id="novidades" class="mb-3xl flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between" aria-labelledby="novidades-titulo">
  <div class="flex flex-col gap-xs">
    <p class="flex items-center gap-sm font-mono text-small uppercase tracking-wide text-primary">
      <Icon name="lucide:mail" aria-hidden="true" class="size-4 shrink-0" />
      {NEWSLETTER_COPY.eyebrow}
    </p>
    <h2 id="novidades-titulo" class="text-h3 font-medium text-foreground">{NEWSLETTER_COPY.title}</h2>
    <p class="text-body text-muted-foreground">{NEWSLETTER_COPY.text}</p>
    <p class="text-small text-muted-foreground">
      Ao assinar, você concorda com a <a href="/privacidade#novidades" class="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">política de privacidade</a>.
    </p>
    {result && <p role={result.role} class="text-small text-foreground">{result.text}</p>}
  </div>

  <form action="/api/subscribe" method="post" class="flex w-full flex-col gap-sm sm:flex-row lg:w-auto">
    <label for="novidades-email" class="sr-only">E-mail</label>
    <input
      id="novidades-email"
      name="email"
      type="email"
      autocomplete="email"
      maxlength="320"
      required
      placeholder={NEWSLETTER_COPY.placeholder}
      class="min-h-11 w-full rounded-md border border-border-strong bg-background px-md font-mono text-small text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-72"
    />
    <input type="text" name={FORM_HONEYPOT} tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only" />
    <button
      type="submit"
      class="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-md text-body font-medium text-primary-foreground transition-[opacity,box-shadow] duration-(--duration-fast) ease-out hover:opacity-90 hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {NEWSLETTER_COPY.button}
    </button>
  </form>
</Card>
```
`Card.astro` aceita `as`, `class` e `aria-labelledby`, mas não `id`: acrescente `id?: string` às props e repasse ao elemento, com um teste em `tests/components/card.test.ts` (`renderToString(Card, { props: { id: 'x' } })` contém `id="x"`).
`posts/index.astro`: `import NewsletterCard from '../../components/posts/NewsletterCard.astro';`, `import { outcomeOf } from '../../lib/newsletter/copy';`, `const outcome = outcomeOf(Astro.url.searchParams.get('assinatura'));` e `<NewsletterCard outcome={outcome} />` depois do parágrafo "Arquivo por ano" (tirando o `mb-3xl` desse parágrafo, porque o card já traz a margem).

**Passo 4:** `npx vitest run tests/posts tests/components tests/pages`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 11: regras do Firestore e política de privacidade

**Requisito:** REQ-011
**Arquivos:**
- Modificar: `firestore.rules` (bloco novo antes do `match /{document=**}`)
- Modificar: `src/lib/privacy/policy.ts` (seção nova `novidades`, depois de `curriculo`)
- Teste: `tests/newsletter/privacy-and-rules.test.ts`

**Team:**
- Track: data
- Implementer: backend-engineer (skills: test-driven-development)
- Reviewers: security-reviewer, consequences-reviewer

**Passo 1: teste vermelho**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { privacySections } from '../../src/lib/privacy/policy';

describe('newsletter privacy and rules', () => {
  it('denies every client path to newsletter_subscribers explicitly', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    expect(rules).toMatch(/match \/newsletter_subscribers\/\{doc\}\s*\{\s*allow read, write: if false;/);
  });

  it('documents the newsletter in the privacy policy, with consent, storage and how to leave', () => {
    const section = privacySections.find((item) => item.id === 'novidades');
    expect(section?.title).toBe('Novidades por e-mail');
    const text = section?.paragraphs.join(' ') ?? '';
    expect(text).toContain('art. 7º, I');
    expect(text).toContain('não guardo o IP');
    expect(text).toContain('pedir para sair');
  });
});
```

**Passo 2:** `npx vitest run tests/newsletter/privacy-and-rules.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`firestore.rules`, antes do bloco `match /{document=**}`:
```
    // Subscribers are written only by the backend (Admin SDK). The list holds
    // strangers' email addresses: no client path may ever read it.
    match /newsletter_subscribers/{doc} {
      allow read, write: if false;
    }
```
`src/lib/privacy/policy.ts`, nova entrada em `privacySections` logo depois da `curriculo`:
```ts
  {
    id: 'novidades',
    title: 'Novidades por e-mail',
    paragraphs: [
      'No fim da página /posts dá para deixar um e-mail para receber os próximos artigos. Ele só é gravado se você enviar o formulário, e a base é o seu consentimento (art. 7º, I da LGPD).',
      'Fica no Firestore só o e-mail, a data e de onde veio a assinatura. Não guardo o IP nem o user agent desse envio; o IP serve apenas para limitar tentativas seguidas e não é gravado.',
      'O envio dos artigos ainda não está ligado: por enquanto a lista só é guardada. O e-mail fica até você pedir para sair, pelo mesmo canal de contato do fim desta página, e cada envio, quando começar, vai trazer um link de saída.',
    ],
  },
```
Atualize também, sem mudar o resto, a frase da seção `curriculo` que diz "Não entra em lista nenhuma e não recebe newsletter": ela continua verdadeira para o currículo e não muda.

**Passo 4:** `npx vitest run tests/newsletter tests/privacy tests/pages`. Esperado: PASS. Se houver teste que fixe o número de seções da política, atualize o número.

**Passo 5:** `/git commit`

### Tarefa 12: 404 no padrão do Stitch

**Requisito:** REQ-012
**Arquivos:**
- Modificar: `src/pages/404.astro`
- Modificar: `src/styles/global.css` (classe `.not-found-code`, fora de `@layer`, perto das regras de motion)
- Teste: `tests/catalog/not-found-page.test.ts` (o `tests/catalog/not-found.test.ts` existente continua)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, security-reviewer

**Passo 1: teste vermelho**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import NotFound from '../../src/pages/404.astro';

const render = async (path = '/caminho/que/nao/existe') => {
  const container = await AstroContainer.create();
  return container.renderToString(NotFound, { request: new Request(`https://nandomoreira.dev${path}`) });
};

describe('404 page', () => {
  it('is a centred card with the ~/404 path, a big 404 and the status chip', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));
    expect(main).toContain('~/404');
    expect(main).toMatch(/<p[^>]*class="[^"]*\bnot-found-code\b[^"]*"[^>]*>404<\/p>/);
    expect(main).toContain('STATUS: 404 NOT_FOUND');
    expect(main.match(/<h1[^>]*>Página não encontrada<\/h1>/g)).toHaveLength(1);
  });

  it('shows the real curl of the requested path in a terminal window, with Copy', async () => {
    const html = await render();
    expect(html).toContain('data-terminal-bar');
    expect(html).toMatch(/<code id="not-found-curl">\$ curl -I https:\/\/nandomoreira\.dev\/caminho\/que\/nao\/existe\nHTTP\/2 404 Not Found<\/code>/);
    expect(html).toMatch(/data-copy="not-found-curl"/);
  });

  it('escapes and caps a hostile path', async () => {
    const html = await render(`/${'a'.repeat(300)}%3Cscript%3E`);
    const code = html.match(/<code id="not-found-curl">([\s\S]*?)<\/code>/)?.[1] ?? '';
    expect(code).not.toContain('<script');
    expect(code.split('\n')[0]!.length).toBeLessThanOrEqual('$ curl -I https://nandomoreira.dev'.length + 200);
  });

  it('offers home as the primary way out, then the portfolio and the lab', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*class="[^"]*\bbg-primary\b/);
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/lab"');
  });

  it('invents nothing from the Stitch screen', async () => {
    const html = await render();
    for (const fake of ['HACKER_MODE', '0x7F', 'cachyos-edge-router', 'x-agent-status', 'command not found', 'Reportar link quebrado']) {
      expect(html).not.toContain(fake);
    }
  });

  it('keeps the 404 status and the noindex', () => {
    const source = readFileSync('src/pages/404.astro', 'utf8');
    expect(source).toContain('Astro.response.status = 404');
    expect(source).toContain('noindex');
  });
});
```

**Passo 2:** `npx vitest run tests/catalog/not-found-page.test.ts`. Esperado: FAIL.

**Passo 3: implementação**

`src/pages/404.astro`:
```astro
---
import Button from '../components/ui/Button.astro';
import Card from '../components/ui/Card.astro';
import CopyButton from '../components/ui/CopyButton.astro';
import TerminalWindow from '../components/ui/TerminalWindow.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { displayNameOf } from '../lib/content/display-name';
import { getProfile } from '../lib/content';

Astro.response.status = 404;

const authorName = displayNameOf(await getProfile());
// The requested path is caller-controlled: Astro escapes it, and the cap keeps a long probe from stretching the page.
const requested = Astro.url.pathname.slice(0, 200);
const curl = `$ curl -I https://nandomoreira.dev${requested}\nHTTP/2 404 Not Found`;
---

<BaseLayout
  title={`Página não encontrada | ${authorName}`}
  description="A página solicitada não existe."
  noindex
>
  <Card as="section" class="mx-auto my-3xl flex w-full max-w-list flex-col items-center gap-lg p-xl text-center">
    <p data-page-path class="self-start font-mono text-small text-primary">~/404</p>
    <p aria-hidden="true" class="not-found-code font-serif leading-none text-primary">404</p>
    <p class="inline-flex items-center gap-sm rounded-full border border-primary px-md py-xs font-mono text-caption uppercase tracking-wide text-primary">
      <span aria-hidden="true" class="inline-block size-2 rounded-full bg-current"></span>
      STATUS: 404 NOT_FOUND
    </p>
    <h1 class="font-serif text-h1 font-normal tracking-tight text-foreground">Página não encontrada</h1>
    <p class="max-w-[60ch] text-body text-muted-foreground">O endereço acessado não corresponde a nenhuma página deste site.</p>

    <TerminalWindow filename="curl" class="w-full text-left">
      <CopyButton slot="actions" target="not-found-curl" label="Copiar o comando curl" iconOnly />
      <pre class="p-md font-mono text-small whitespace-pre-wrap wrap-anywhere text-muted-foreground"><code id="not-found-curl">{curl}</code></pre>
    </TerminalWindow>

    <div class="flex flex-wrap items-center justify-center gap-md border-t border-border pt-lg">
      <Button href="/" variant="primary" arrow>Voltar para a home</Button>
      <Button href="/portfolio" variant="secondary">Explorar portfólio</Button>
      <a href="/lab" class="inline-flex min-h-11 items-center font-mono text-small text-muted-foreground underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Ver laboratório</a>
    </div>
  </Card>
</BaseLayout>
```
Atenção: o `<code>` não pode ter espaço nem quebra entre as tags e o `{curl}`, senão o Copiar copia espaço a mais.

`global.css`, fora de `@layer` (a regra nova precisa de tamanho e brilho que nenhuma utility dá sem valor arbitrário):
```css
/* The big 404 (REQ-012): Newsreader at twice the display size, with a soft
   amber glow from the accent token. Decorative: the h1 below says it. */
.not-found-code {
  font-size: calc(var(--text-display) * 2);
  text-shadow: 0 0 32px color-mix(in oklab, var(--color-primary) 35%, transparent);
}
```
Na tarefa 7 o `PageHeader` da 404 já foi tirado deste arquivo; esta tarefa substitui a página inteira.

**Passo 4:** `npx vitest run tests/catalog tests/pages tests/design-system`. Esperado: PASS (o `page-headers.test.ts` deixa de listar a `/404`, porque ela não usa mais o `PageHeader`: remova a linha dela de `PAGES`, e a asserção `~/404` fica neste teste novo).

**Passo 5:** `/git commit`

---

## Lote 3: ajustes do autor depois da revisão (REQ-013 a REQ-016)

As tarefas 5 a 12 estão implementadas e a revisão da rodada 3 fechou sem achado aberto.
Mesmas regras: sem git, TDD, `npx vitest run` e `npm run check` no fim. Nenhum portão
relaxado: o teste que fixava o comportamento antigo é **reescrito** para o novo, nunca apagado sem substituto.

### Tarefa 13: 404 sem card, sem `~/404`, número 1,5x

**Requisito:** REQ-013
**Arquivos:**
- Modificar: `src/pages/404.astro`, `src/styles/global.css` (regra `.not-found-code`)
- Teste: `tests/catalog/not-found-page.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho.** Em `tests/catalog/not-found-page.test.ts`, trocar o primeiro teste por:
```ts
  it('sits on the canvas, without a card or the ~/404 path, with the big 404 and the status chip', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));
    expect(main).not.toContain('~/404');
    expect(main).not.toContain('data-page-path');
    expect(main).not.toMatch(/class="[^"]*\bbg-surface\b[^"]*\bp-xl\b/);
    expect(main).toMatch(/<p[^>]*class="[^"]*\bnot-found-code\b[^"]*"[^>]*>404<\/p>/);
    expect(main).toContain('STATUS: 404 NOT_FOUND');
    expect(main.match(/<h1[^>]*>Página não encontrada<\/h1>/g)).toHaveLength(1);
  });

  it('draws the 404 at three times the display size (1.5x the first cut)', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    const rule = css.match(/\.not-found-code\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('font-size: calc(var(--text-display) * 3)');
  });
```

**Passo 2:** `npx vitest run tests/catalog/not-found-page.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
- `404.astro`: o `<Card as="section" ...>` vira `<section class="mx-auto my-3xl flex w-full max-w-list flex-col items-center gap-lg text-center">` (sem borda, fundo nem `p-xl`); remover o import de `Card` e o `<p data-page-path ...>~/404</p>`.
- `global.css`: em `.not-found-code`, `font-size: calc(var(--text-display) * 3);`.

**Passo 4:** `npx vitest run tests/catalog tests/design-system`. Esperado: PASS.

**Passo 5:** `/git commit`

### Tarefa 14: `AvailabilityCard` na `/contato` e na `/now`

**Requisito:** REQ-014
**Arquivos:**
- Criar: `src/components/ui/AvailabilityCard.astro`
- Modificar: `src/pages/contato.astro` (bloco `data-contact-availability`), `src/pages/now.astro` (o `<Alert title="Disponibilidade">`)
- Teste: `tests/components/availability-card.test.ts` (novo), `tests/now/now-page.test.ts`, `tests/now/now-steps.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: testes vermelhos**

`tests/components/availability-card.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AvailabilityCard from '../../src/components/ui/AvailabilityCard.astro';

const render = async (status: 'open' | 'limited' | 'closed', detail = 'Aberto a projetos de escopo fechado.') => {
  const container = await AstroContainer.create();
  return container.renderToString(AvailabilityCard, { props: { status, detail } });
};

describe('AvailabilityCard', () => {
  it('puts the status dot beside the label, with the detail underneath', async () => {
    const html = await render('open');
    const title = html.match(/<span[^>]*data-availability-title[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(title).toContain('data-status-dot');
    expect(title).toContain('Disponível para novos projetos');
    expect(html.indexOf('data-availability-title')).toBeLessThan(html.indexOf('Aberto a projetos de escopo fechado.'));
  });

  it('labels every status in text, never by colour alone', async () => {
    expect(await render('limited')).toContain('Disponibilidade limitada');
    expect(await render('closed')).toContain('Indisponível no momento');
  });

  it('is a hairline box on surface, like the /contato block', async () => {
    expect(await render('open')).toMatch(/<div[^>]*data-availability-card[^>]*class="[^"]*\bborder-border\b[^"]*\bbg-surface\b/);
  });
});
```
Em `tests/now/now-page.test.ts`, trocar `'shows the availability in a green alert, after what is declined'` por:
```ts
  it('shows the availability with the shared AvailabilityCard, after what is declined', async () => {
    const html = await render(NowPage);
    const foco = html.split('id="foco"')[1]?.split('id="projetos"')[0] ?? '';
    expect(foco).not.toContain('data-alert');
    expect(foco).toContain('data-availability-card');
    expect(foco).toContain('data-status-dot');
    expect(foco.indexOf('data-availability-card')).toBeGreaterThan(foco.indexOf('>Recusando agora<'));
  });
```
Em `tests/now/now-steps.test.ts`, no teste `'keeps the focus block as plain text ...'`, trocar `expect(focus).toContain('data-alert');` por `expect(focus).toContain('data-availability-card');` e a primeira asserção por `expect(focus.replace(/<div[^>]*data-availability-card[\s\S]*$/, '')).not.toMatch(/rounded-md border border-border bg-surface/);` (o único card do bloco é o da disponibilidade).
Em `tests/contact/contact-layout.test.ts`, as asserções sobre `data-contact-availability` continuam; acrescente que o mesmo `<div>` tem `data-availability-card`.

**Passo 2:** `npx vitest run tests/components/availability-card.test.ts tests/now tests/contact`. Esperado: FAIL.

**Passo 3: implementação**

`src/components/ui/AvailabilityCard.astro`:
```astro
---
import type { Availability } from '../../lib/content';
import { AVAILABILITY_LABEL } from '../../lib/layout/availability';
import StatusDot from './StatusDot.astro';

/** The availability box shared by /contato and /now: dot beside the label, detail underneath. */
interface Props {
  status: Availability['status'];
  detail: string;
  /** Extra data hook for a page that targets this box in its own tests. */
  hook?: string;
}

const { status, detail, hook } = Astro.props;
const extra = hook ? { [`data-${hook}`]: '' } : {};
---

<div data-availability-card {...extra} class="flex flex-col gap-xs rounded-md border border-border bg-surface p-md">
  <span data-availability-title class="flex items-center gap-sm text-body text-foreground">
    <StatusDot status={status} />
    <span>{AVAILABILITY_LABEL[status]}</span>
  </span>
  <span class="text-small text-muted-foreground">{detail}</span>
</div>
```
`contato.astro`: o `<div data-contact-availability ...>` inteiro vira
`<AvailabilityCard status={profile.availability.status} detail={profile.availability.detail} hook="contact-availability" />`; remover os imports que ficarem sem uso (`StatusDot`, `AVAILABILITY_LABEL`) só se nada mais da página os usar.
`now.astro`: `<Alert title="Disponibilidade">{data.focus.availability}</Alert>` vira
`<AvailabilityCard status={profile.availability.status} detail={data.focus.availability} />`, e sai o import de `Alert` se ficar sem uso. O detalhe continua vindo de `loadNow` (mesma fonte, `availability.detail`).

**Passo 4:** `npx vitest run`. Esperado: PASS, incluindo `tests/design-system/contrast.test.ts` e `single-primary-cta.test.ts`.

**Passo 5:** `/git commit`

### Tarefa 15: hero com 200px no topo e 120px embaixo

**Requisito:** REQ-015
**Arquivos:**
- Modificar: `src/styles/global.css` (dois tokens no `@theme`, junto de `--spacing-3xl`), `src/components/home/Hero.astro`
- Teste: `tests/home/hero.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho.** Trocar `'starts the headline 120px down on desktop (3xl padding plus lg margin)'` por:
```ts
  it('gives the text 200px above and 120px below on desktop, from spacing tokens', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*id="inicio"[^>]*>/)?.[0] ?? '';
    expect(section).toMatch(/\blg:pt-hero-top\b/);
    expect(section).toMatch(/\blg:pb-hero-bottom\b/);
    expect(html.match(/<h1\b[^>]*>/)?.[0]).not.toContain('lg:mt-lg');

    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('--spacing-hero-top: 12.5rem;');
    expect(css).toContain('--spacing-hero-bottom: 7.5rem;');
  });
```
(importar `readFileSync` de `node:fs` no topo, se ainda não houver).

**Passo 2:** `npx vitest run tests/home/hero.test.ts`. Esperado: FAIL.

**Passo 3: implementação**
- `global.css`, no `@theme`, logo depois de `--spacing-3xl: 6rem;`:
  ```css
  /* Hero breathing room on desktop (REQ-015): 200px above the text, 120px below. */
  --spacing-hero-top: 12.5rem;
  --spacing-hero-bottom: 7.5rem;
  ```
- `Hero.astro`: a `<section>` fica `class="relative isolate py-2xl lg:pt-hero-top lg:pb-hero-bottom"`; o `<h1>` perde `lg:mt-lg`.

**Passo 4:** `npx vitest run tests/home tests/design-system`. Esperado: PASS (`no-ad-hoc-values` incluído: são tokens, não valores arbitrários).

**Passo 5:** `/git commit`

### Tarefa 16: sem regra entre o hero e os posts

**Requisito:** REQ-016
**Arquivos:**
- Modificar: `src/pages/index.astro` (o primeiro `<SectionRule />`, logo depois do `<Hero>`)
- Teste: `tests/home/section-rules.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Passo 1: teste vermelho.** Substituir o teste do arquivo por:
```ts
  it('runs the hero straight into the posts, then separates every later section with a SectionRule', () => {
    const source = readFileSync('src/pages/index.astro', 'utf8');
    const body = source.slice(source.indexOf('<Hero'));
    const heroEnd = body.indexOf('/>') + 2;
    expect(body.slice(heroEnd).trimStart().startsWith('<LatestPosts')).toBe(true);

    const sections = ['<CollectionSection\n    collection="portfolio"', '<CollectionSection collection="lab"', '<Trajectory', '<Services', '<AgentBrief'];
    expect(body.match(/<SectionRule \/>/g)).toHaveLength(sections.length);
    for (const section of sections) {
      const before = body.slice(0, body.indexOf(section)).trimEnd();
      expect(before.endsWith('<SectionRule />')).toBe(true);
    }
  });
```

**Passo 2:** `npx vitest run tests/home/section-rules.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em `index.astro`, apagar o `<SectionRule />` entre `<Hero ... />` e `<LatestPosts ... />`.

**Passo 4:** `npx vitest run tests/home`. Esperado: PASS.

**Passo 5:** `/git commit`
