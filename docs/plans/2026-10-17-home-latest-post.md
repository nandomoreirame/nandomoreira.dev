# Plano: home-latest-post

> **Spec:** docs/specs/home-latest-post/SPEC.md

**Objetivo:** trocar a lista de quatro posts da home pelo card `// POST RECENTE` do Stitch, com selo de `extras[0]` e "Preview rápido" em `<details>`.
**Arquitetura:** `LatestPosts.astro` passa a receber um `PostSummary` só e o `site`; o card é um `<article>` com o link do título esticado por `::after`, e os controles do rodapé ficam acima dele. O schema ganha `keyPoints` opcional; a página escolhe o post por `latestPosts(allPosts, 1)`.
**Stack:** Astro 7, Tailwind 4, Zod, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 4.
**Complexidade estimada:** medium.
**Depende de:** `terminal-noir-fixes` (o lote 3 mexeu em `src/pages/index.astro` e em `tests/home/section-rules.test.ts`); revise e feche aquela feature antes.

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho, que precisa falhar pelo motivo certo.
- Texto visível novo só o da spec. Nenhum hex, nenhum valor arbitrário do Tailwind, nenhum `<script>`, `<button>` ou `onclick`.
- Antes da Tarefa 1, pare o `astro dev` se estiver rodando (campo novo no schema; ver "store congelado" no `CLAUDE.md`).
- No fim: `npm run verify` termina sem erro (check + test + build + test:build).

---

### Tarefa 1: campo `keyPoints` no schema de posts

**Requisito:** REQ-005
**Arquivos:**
- Modificar: `src/content/schemas/post.ts` (dentro do `z.object`, depois de `extras`)
- Criar: `tests/content/post-key-points.test.ts`

**Team:**
- Track: data
- Implementer: backend-engineer (skills: test-driven-development)
- Reviewers: consequences-reviewer, business-logic-reviewer

**Passo 1: teste vermelho**
```ts
import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };

describe('post keyPoints', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('keeps one to three short takeaways', () => {
    const parsed = post.safeParse({ ...base, keyPoints: ['um', 'dois', 'três'] });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.keyPoints).toEqual(['um', 'dois', 'três']);
  });

  it('rejects an empty list, a fourth item, an empty item and an item over 140 characters', () => {
    expect(post.safeParse({ ...base, keyPoints: [] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: ['a', 'b', 'c', 'd'] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: [''] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: ['x'.repeat(141)] }).success).toBe(false);
  });
});
```

**Passo 2:** `npx vitest run tests/content/post-key-points.test.ts`. Esperado: FAIL no segundo teste (`keyPoints` some no parse, porque o Zod descarta chave desconhecida) e no terceiro (as listas inválidas passam).

**Passo 3:** em `src/content/schemas/post.ts`, logo depois do campo `extras`:
```ts
      /**
       * Up to three short takeaways for the "Preview rápido" of the home card
       * (home-latest-post REQ-005). Written by the author per post; absent
       * means the card has no preview.
       */
      keyPoints: z.array(z.string().min(1).max(140)).min(1).max(3).optional(),
```

**Passo 4:** mesmo comando. Esperado: PASS (3 testes).

**Passo 5:** `/git commit`

---

### Tarefa 2: card do post recente

**Requisito:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-007
**Arquivos:**
- Modificar: `src/components/home/LatestPosts.astro` (reescrito inteiro)
- Teste: `tests/home/latest-posts.test.ts` (reescrito inteiro)
- Teste: `tests/home/list-column.test.ts` (o caso `constrains LatestPosts to the centred list measure`)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste vermelho.** Substitua todo o `tests/home/latest-posts.test.ts`. O caso antigo "describes the blog with the same text as /posts" sai de propósito: o card do Stitch não tem a descrição do blog, que continua na `/posts`.
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LatestPosts from '../../src/components/home/LatestPosts.astro';
import type { PostSummary } from '../../src/lib/content';

const SITE = 'https://nandomoreira.dev';

const post = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  slug: 'meu-post',
  title: 'Meu post',
  summary: 'Um resumo.',
  date: '2026-10-16',
  markers: ['niri', 'wayland', 'shell', 'linux'],
  draft: false,
  archived: false,
  readingMinutes: 6,
  ...overrides,
});

const render = async (props: { post?: PostSummary }) => {
  const container = await AstroContainer.create();
  return container.renderToString(LatestPosts, { props: { site: SITE, ...props } });
};

describe('LatestPosts', () => {
  it('renders nothing without a post', async () => {
    const html = await render({});
    expect(html).not.toContain('id="blog"');
    expect(html).not.toContain('POST RECENTE');
  });

  it('heads the section with the accent label and a quiet see-all link', async () => {
    const html = await render({ post: post() });
    const heading = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/)?.[0] ?? '';
    expect(heading).toContain('POST RECENTE');
    expect(heading).toMatch(/<span[^>]*aria-hidden="true"[^>]*>\/\/ <\/span>/);
    expect(heading).toContain('text-primary');

    const link = html.match(/<a[^>]*href="\/posts"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('Ver todos os posts no blog');
    expect(link).toContain('font-mono');
    expect(link).toContain('data-icon="lucide:arrow-right"');
    expect(link).not.toContain('bg-primary');
  });

  it('shows one card whose title is the only link to the post, stretched over the card', async () => {
    const html = await render({ post: post() });
    expect(html.match(/data-latest-post/g)).toHaveLength(1);
    expect(html.match(/href="\/meu-post"/g)).toHaveLength(1);

    const title = html.match(/<h3[^>]*>[\s\S]*?<\/h3>/)?.[0] ?? '';
    const link = title.match(/<a[^>]*href="\/meu-post"[^>]*>/)?.[0] ?? '';
    expect(title).toContain('Meu post');
    expect(link).toContain('after:absolute');
    expect(link).toContain('after:inset-0');
    expect(link).toContain('focus-visible:after:outline-primary');
    expect(html).toMatch(/<article[^>]*class="[^"]*\brelative\b/);
  });

  it('never wraps the card in a link and ships no button or script', async () => {
    const html = await render({ post: post({ keyPoints: ['um'] }) });
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<article/);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script');
  });

  it('puts the short date and the reading time in the meta line', async () => {
    const html = await render({ post: post() });
    const meta = html.match(/<p[^>]*data-post-meta[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(meta).toContain('<time datetime="2026-10-16">16 out. 2026</time>');
    expect(meta).toContain('6 min de leitura');
  });

  it('shows the first extra as a success badge, and nothing without extras', async () => {
    const withExtras = await render({ post: post({ extras: ['5 dias → 30 min', 'Python'] }) });
    const badge = withExtras.match(/<span[^>]*data-badge[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(badge).toContain('5 dias → 30 min');
    expect(badge).toContain('text-success');
    expect(withExtras).not.toContain('Python');

    const without = await render({ post: post() });
    expect(without).not.toContain('data-badge');
    expect(without).not.toMatch(/>\|</);
  });

  it('lists up to three markers as hashtags under the summary', async () => {
    const html = await render({ post: post() });
    expect(html).toContain('Um resumo.');
    expect(html).toContain('#niri');
    expect(html).toContain('#wayland');
    expect(html).toContain('#shell');
    expect(html).not.toContain('#linux');
  });

  it('cues "Ler artigo completo" visually, never as a second tab stop', async () => {
    const html = await render({ post: post() });
    const cue = html.match(/<span[^>]*data-read-cue[^>]*>/)?.[0] ?? '';
    expect(cue).toContain('aria-hidden="true"');
    expect(html).toContain('Ler artigo completo');
  });
});
```

No `tests/home/list-column.test.ts`, troque as props do caso `constrains LatestPosts to the centred list measure`:
```ts
      props: {
        post: { ...post({ slug: 'a', title: 'A', date: '2026-01-01' }), readingMinutes: 1 },
        site: 'https://nandomoreira.dev',
      },
```

**Passo 2:** `npx vitest run tests/home/latest-posts.test.ts tests/home/list-column.test.ts`. Esperado: FAIL (o componente ainda espera `posts` e renderiza nada com `post`; sem `POST RECENTE`, sem `data-latest-post`).

**Passo 3:** substitua todo o `src/components/home/LatestPosts.astro`:
```astro
---
import { Icon } from 'astro-icon/components';
import type { PostSummary } from '../../lib/content';
import { toShortDate } from '../../lib/format/date';

interface Props {
  /** The newest current post; absent, the section does not render. */
  post?: PostSummary;
  /** Site origin, for the markdown view the AI summary links read. */
  site: string;
}

const { post } = Astro.props;
const badge = post?.extras?.[0];
---

{
  post && (
    // `relative` paints this section after the hero's portrait, which is
    // positioned and runs past the hero's bottom edge.
    <section id="blog" aria-labelledby="blog-title" class="relative mx-auto w-full max-w-list py-2xl lg:py-3xl">
      <div class="mb-lg flex flex-wrap items-center justify-between gap-md">
        <h2 id="blog-title" class="flex items-center gap-sm font-mono text-small uppercase tracking-eyebrow text-primary">
          <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-primary" />
          <span><span aria-hidden="true">{'// '}</span>POST RECENTE</span>
        </h2>
        <a
          href="/posts"
          class="group/more inline-flex min-h-11 items-center gap-xs font-mono text-small text-muted-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Ver todos os posts no blog
          <Icon
            name="lucide:arrow-right"
            aria-hidden="true"
            class="size-4 shrink-0 transition-transform duration-(--duration-fast) ease-out group-hover/more:translate-x-xs"
          />
        </a>
      </div>

      {/* The title link is stretched over the card by ::after, so the whole
          card is clickable with one tab stop; the footer controls sit above
          it with relative z-10 (REQ-007). */}
      <article
        data-latest-post
        class="group relative rounded-lg border border-border bg-surface p-lg transition-[border-color] duration-(--duration-fast) ease-out hover:border-border-strong md:p-xl"
      >
        <p data-post-meta class="flex flex-wrap items-center gap-sm font-mono text-small text-muted-foreground">
          <time datetime={post.date}>{toShortDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min de leitura</span>
          {badge && (
            <>
              <span aria-hidden="true" class="text-border-strong">|</span>
              <span data-badge class="inline-flex items-center gap-xs rounded-sm border border-border bg-background px-sm py-xs text-caption leading-none text-success">
                <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full bg-success" />
                {badge}
              </span>
            </>
          )}
        </p>

        <h3 class="mt-md font-serif text-h2 font-normal tracking-tight text-pretty text-foreground transition-colors group-hover:text-primary sm:text-h1">
          <a
            href={`/${post.slug}`}
            class="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
          >
            {post.title}
          </a>
        </h3>

        <p class="mt-sm text-body text-muted-foreground">{post.summary}</p>

        <div class="mt-lg flex flex-col gap-md border-t border-border pt-md">
          <div class="flex flex-wrap items-center justify-between gap-md">
            <ul class="flex list-none flex-wrap gap-xs p-0">
              {post.markers.slice(0, 3).map((marker) => (
                <li data-marker class="rounded-sm border border-border bg-surface-elevated px-sm py-xs font-mono text-micro leading-none text-muted-foreground">
                  #{marker}
                </li>
              ))}
            </ul>
            <span data-read-cue aria-hidden="true" class="inline-flex items-center gap-xs font-mono text-small text-primary">
              Ler artigo completo
              <Icon
                name="lucide:arrow-right"
                class="size-4 shrink-0 transition-transform duration-(--duration-fast) ease-out group-hover:translate-x-xs"
              />
            </span>
          </div>
        </div>
      </article>
    </section>
  )
}
```

**Passo 4:** mesmo comando. Esperado: PASS. `src/pages/index.astro` ainda passa `posts=`; isso quebra o `npm run check` até a Tarefa 4, não a suíte.

**Passo 5:** `/git commit`

---

### Tarefa 3: "Preview rápido" em `<details>`

**Requisito:** REQ-006, REQ-007
**Depende de:** Tarefas 1 e 2
**Arquivos:**
- Modificar: `src/components/home/LatestPosts.astro` (dentro do `<div class="mt-lg ... pt-md">`, depois da linha de markers; e o import)
- Modificar: `src/styles/global.css` (logo depois da regra `.reader-settings > summary::-webkit-details-marker`)
- Teste: `tests/home/latest-posts.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: test-reviewer, accessibility-guardrails, security-reviewer

**Passo 1: teste vermelho** (acrescentar no fim do `describe('LatestPosts')`, e o import `import { readFileSync } from 'node:fs';` no topo)
```ts
  it('opens a native quick preview with the key points and the AI summary links', async () => {
    const html = await render({ post: post({ keyPoints: ['Primeiro ponto.', 'Segundo ponto.'] }) });
    const details = html.match(/<details[^>]*data-post-preview[^>]*>[\s\S]*?<\/details>/)?.[0] ?? '';
    expect(details).toMatch(/<details[^>]*class="[^"]*\brelative\b[^"]*\bz-10\b/);

    const summary = details.match(/<summary[^>]*>[\s\S]*?<\/summary>/)?.[0] ?? '';
    expect(summary).toContain('Preview rápido');
    expect(summary).toContain('data-icon="lucide:terminal"');

    expect(details).toContain('TL;DR // PONTOS-CHAVE');
    expect(details).toContain('Primeiro ponto.');
    expect(details).toContain('Segundo ponto.');
    expect(details).toContain('Resumir com IA:');
    expect(details.split(encodeURIComponent(`${SITE}/meu-post.md`)).length - 1).toBe(3);
  });

  it('has no preview when the post has no key points', async () => {
    const html = await render({ post: post() });
    expect(html).not.toContain('<details');
    expect(html).not.toContain('Preview rápido');
  });

  it('hides the WebKit disclosure marker of the preview summary', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(/\.post-preview > summary::-webkit-details-marker\s*\{\s*display: none;/);
  });
```

**Passo 2:** `npx vitest run tests/home/latest-posts.test.ts`. Esperado: FAIL nos três casos novos (sem `<details>`, sem a regra de CSS).

**Passo 3:** no frontmatter de `LatestPosts.astro`, acrescente o import e leia `site`:
```astro
import AiSummaryLink from '../posts/AiSummaryLink.astro';
```
```astro
const { post, site } = Astro.props;
```
Dentro do `<div class="mt-lg flex flex-col gap-md border-t border-border pt-md">`, depois do `<div>` dos markers:
```astro
          {post.keyPoints && (
            <details data-post-preview class="post-preview relative z-10">
              <summary class="inline-flex min-h-11 cursor-pointer list-none items-center gap-xs rounded-md border border-border-strong bg-surface-elevated px-sm font-mono text-small text-muted-foreground transition-[color,border-color] duration-(--duration-fast) ease-out hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <Icon name="lucide:terminal" aria-hidden="true" class="size-4 shrink-0 text-primary" />
                Preview rápido
              </summary>
              <div class="mt-sm flex flex-col gap-md rounded-lg border border-border bg-background p-md font-mono text-caption">
                <p class="flex items-center gap-sm text-micro uppercase tracking-eyebrow text-primary">
                  <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full bg-primary" />
                  TL;DR // PONTOS-CHAVE
                </p>
                <ul class="flex list-none flex-col gap-xs p-0 text-muted-foreground">
                  {post.keyPoints.map((point) => (
                    <li class="flex items-start gap-sm">
                      <span aria-hidden="true" class="text-success">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div class="flex flex-wrap items-center justify-between gap-sm border-t border-border pt-sm">
                  <span class="inline-flex items-center gap-xs text-muted-foreground">
                    <Icon name="lucide:sparkles" aria-hidden="true" class="size-4 shrink-0 text-primary" />
                    Resumir com IA:
                  </span>
                  <AiSummaryLink markdownUrl={`${site}/${post.slug}.md`} />
                </div>
              </div>
            </details>
          )}
```
Em `src/styles/global.css`, logo depois da regra `.reader-settings > summary::-webkit-details-marker { display: none; }`:
```css
/* Home card quick preview (home-latest-post REQ-006): native <details>,
   no script. list-none covers Firefox; this covers WebKit. */
.post-preview > summary::-webkit-details-marker {
  display: none;
}
```

**Passo 4:** mesmo comando. Esperado: PASS.

**Passo 5:** `/git commit`

---

### Tarefa 4: a home entrega um post só e o `site`

**Requisito:** REQ-001
**Depende de:** Tarefa 3
**Arquivos:**
- Modificar: `src/lib/posts/latest.ts` (assinatura genérica)
- Modificar: `src/pages/index.astro` (a linha `const blogPosts = latestPosts(allPosts, 4);` e o `<LatestPosts posts={blogPosts} />`)
- Teste: `tests/home/index-page.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: type-safety-reviewer, test-reviewer

**Passo 1: teste vermelho** (acrescentar no `describe('home page assembly')`)
```ts
  it('feeds LatestPosts the single newest post and the site origin', () => {
    expect(page).toContain('const latestPost = latestPosts(allPosts, 1)[0];');
    expect(page).toContain('<LatestPosts post={latestPost} site={site} />');
    expect(page).not.toContain('latestPosts(allPosts, 4)');
  });
```

**Passo 2:** `npx vitest run tests/home/index-page.test.ts`. Esperado: FAIL (a página ainda chama `latestPosts(allPosts, 4)`). `npm run check` também acusa o `posts=` que a Tarefa 2 deixou sem prop.

**Passo 3:** em `src/lib/posts/latest.ts`, a função vira genérica, para o `readingMinutes` do `PostSummary` chegar ao card com o tipo certo:
```ts
export const latestPosts = <T extends Post>(posts: readonly T[], limit = 4): T[] =>
  sortPosts(currentOf(posts, false)).slice(0, limit);
```
Em `src/pages/index.astro`, troque `const blogPosts = latestPosts(allPosts, 4);` por:
```ts
const latestPost = latestPosts(allPosts, 1)[0];
```
e `<LatestPosts posts={blogPosts} />` por:
```astro
  <LatestPosts post={latestPost} site={site} />
```
(`site` já existe no frontmatter: `const site = Astro.site?.origin ?? 'https://nandomoreira.dev';`.)

**Passo 4:** `npx vitest run tests/home tests/posts/latest.test.ts` e `npm run check`. Esperado: PASS e `0 errors`. Depois, o portão completo: `npm run verify`, sem erro.

**Passo 5:** `/git commit`
