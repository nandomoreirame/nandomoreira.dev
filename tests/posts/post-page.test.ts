import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import PostPage, { getStaticPaths } from '../../src/pages/[slug].astro';

const source = readFileSync('src/pages/[slug].astro', 'utf8');

const renderEntry = async (entry: Awaited<ReturnType<typeof getAllPostEntries>>[number]) => {
  const container = await AstroContainer.create();
  return container.renderToString(PostPage, {
    props: { entry },
    params: { slug: entry.data.slug },
  });
};

describe('/[slug] post page', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(source).toContain('getAllPostEntries');
    expect(source).not.toContain('getCollection(');
  });

  it('getStaticPaths includes current and archived slugs and excludes the draft', async () => {
    const paths = await getStaticPaths();
    const slugs = paths.map((p) => p.params.slug);

    expect(slugs).toContain('fluxo-rpi-claude-code-grok-codex');
    expect(slugs).toContain('comece-com-gulp');
    // A draft's slug must never be a public path.
    expect(slugs).not.toContain('o-falso-verde');
    expect(slugs).not.toContain('exemplo');
  });

  it('renders an archived post with the archive badge, time element and body', async () => {
    const entries = await getAllPostEntries();
    const archived = entries.find((e) => e.data.archived === true && e.data.cover);
    expect(archived).toBeTruthy();

    const html = await renderEntry(archived!);

    expect(html).toContain(archived!.data.title);
    expect(html).toMatch(/Arquivo/i);
    expect(html).toMatch(/<time[^>]*datetime=/);
    expect(html).toContain(archived!.data.date);

    // A length threshold would survive removing <Content />, since the layout,
    // title, JSON-LD and cover alone clear it. Assert prose from the body file.
    const markdown = readFileSync(`src/content/posts/${archived!.data.slug}.md`, 'utf8').replace(
      /^---[\s\S]*?\n---\n/,
      '',
    );

    // Inline markdown becomes tags in the output, so probe on a run of plain
    // words: long enough to be unique, free of anything the renderer rewrites.
    const probe = markdown
      .split('\n')
      .filter((line) => !/^[#!\-|>` ]/.test(line))
      .flatMap((line) => line.split(/[.,;:!?]/))
      .map((run) => run.trim())
      .find((run) => run.length > 30 && !/[[\]()*_`<>&"']/.test(run));

    expect(probe, 'no plain prose run found to assert against').toBeTruthy();
    expect(html).toContain(probe);
  });

  it('renders a current post without the archive badge', async () => {
    const entries = await getAllPostEntries();
    const current = entries.find((e) => e.data.archived !== true && e.data.draft !== true);
    expect(current).toBeTruthy();

    const html = await renderEntry(current!);

    expect(html).toContain(current!.data.title);
    // The archive badge is a mono span with the word Arquivo; the back-link
    // for current posts points to /posts, not the archive.
    expect(html).toContain('href="/posts"');
    expect(html).not.toMatch(/border-border-strong[^>]*>\s*Arquivo\s*</);
  });

  it('renders the cover image with its alt when present', async () => {
    const entries = await getAllPostEntries();
    // Prefer a post whose body has no inline images so the cover <img> is unambiguous.
    const withCover =
      entries.find((e) => e.data.cover && e.data.slug === 'como-exibir-calendario-do-terminal') ??
      entries.find((e) => e.data.cover);
    expect(withCover).toBeTruthy();
    const alt = withCover!.data.cover!.alt;
    expect(alt.length).toBeGreaterThan(0);

    const html = await renderEntry(withCover!);

    expect(html).toMatch(/<img\b/i);
    // Alt may be HTML-escaped; the raw description must still appear.
    expect(html).toContain(alt);
  });

  it('closes with three related posts linking to other posts', async () => {
    const entries = await getAllPostEntries();
    const entry = entries.find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;

    const html = await renderEntry(entry);
    const start = html.search(/<section[^>]*aria-labelledby="related-heading"/);
    expect(start).toBeGreaterThan(-1);
    const section = html.slice(start, html.indexOf('</section>', start));

    expect(section).toContain('Posts relacionados');
    expect(section).toContain('LEITURA COMPLEMENTAR');
    expect(section.match(/data-related-post/g)).toHaveLength(3);
    expect(section).toMatch(/<a[^>]*href="\/posts"[^>]*>[\s\S]*?Ver todos no blog/);
    const links = [...section.matchAll(/<a[^>]*href="\/([^"#/]+)"/g)].map((m) => m[1]).filter((slug) => slug !== 'posts');
    expect(links).toHaveLength(3);
    expect(links).not.toContain('fluxo-rpi-claude-code-grok-codex');
  });

  it('draws the declared art where a post has no cover', async () => {
    const entries = await getAllPostEntries();
    const coverless = entries.find((e) => !e.data.cover && e.data.art);
    expect(coverless).toBeTruthy();

    const html = await renderEntry(coverless!);

    expect(html).toMatch(/<div[^>]*data-art/);
    expect(html).toContain(`data-motif="${coverless!.data.art}"`);
    expect(html.search(/data-art/)).toBeGreaterThan(html.search(/<time\b/i));
    expect(html.search(/data-art/)).toBeGreaterThan(html.indexOf('data-post-toolbar-end'));
  });

  it('keeps the cover and draws no art when a post has one', async () => {
    const entries = await getAllPostEntries();
    const html = await renderEntry(entries.find((e) => e.data.slug === '8-meses-de-malapronta-e-o-fim')!);

    expect(html).toMatch(/<figure\b/i);
    expect(html).not.toMatch(/data-motif=/);
  });

  it('opens with date, tags and reading time, no prompt and no "publicado:"', async () => {
    const post = (await getAllPostEntries()).find((entry) => entry.data.slug === 'rdo-solo-red-dead-online-sozinho-pelo-gateway')!;
    const html = await renderEntry(post);
    const meta = html.match(/<p[^>]*data-post-meta[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(meta).toMatch(/<time[^>]*datetime="2026-10-11"[^>]*>\s*11 de outubro de 2026\s*<\/time>/);
    expect([...meta.matchAll(/>(#[^<]+)</g)].map((m) => m[1])).toEqual(['#linux', '#redes', '#open-source']);
    expect(meta).toMatch(/data-icon="lucide:clock"[\s\S]*\d+ min de leitura/);
    expect(meta.match(/<span[^>]*aria-hidden="true"[^>]*>•<\/span>/g)).toHaveLength(2);
    expect(html).not.toContain('publicado:');
    expect(html).not.toContain('&lt;!--');
    expect(html.indexOf('data-post-meta')).toBeLessThan(html.search(/<h1\b/));
  });

  it('has no back trail: the menu already marks the blog', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    expect(html).not.toContain('Voltar aos posts');
    expect(html).not.toContain('Trilha de navegação');
  });

  it('puts the summary under the title as the lead', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    const lead = html.match(/<p[^>]*data-post-lead[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
    expect(lead.trim()).toBe(entry.data.summary);
    expect(html.search(/<h1\b/)).toBeLessThan(html.indexOf('data-post-lead'));
    const h1 = html.match(/<h1[^>]*>/)?.[0] ?? '';
    const leadTag = html.match(/<p[^>]*data-post-lead[^>]*>/)?.[0] ?? '';
    expect(h1).not.toContain('max-w-list');
    expect(leadTag).not.toContain('max-w-list');
  });

  it('groups the reader switch, the labelled AI links, copy link and .md in one toolbar', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    const bar = html.slice(html.indexOf('data-post-toolbar'), html.indexOf('data-post-toolbar-end'));
    expect(bar).toContain('id="reader-on"');
    expect(bar).toContain('Resumir com Claude');
    expect(bar).toMatch(/<button[^>]*data-copy="post-url"[^>]*hidden/);
    expect(bar).toContain('Copiar link');
    expect(bar).toMatch(/<a[^>]*href="\/fluxo-rpi-claude-code-grok-codex\.md"/);
    expect(html).toMatch(/<span id="post-url" hidden>https:\/\/nandomoreira\.dev\/fluxo-rpi-claude-code-grok-codex<\/span>/);
  });

  it('rules the body sections and closes with the author box before the related posts', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'fluxo-rpi-claude-code-grok-codex')!;
    const html = await renderEntry(entry);
    expect(html).toContain('data-prose-ruled');
    const box = html.indexOf('data-author-box');
    expect(box).toBeGreaterThan(html.indexOf('data-prose'));
    expect(box).toBeLessThan(html.search(/aria-labelledby="related-heading"/));
  });

  it('shows the snapshot card in the side column when the post has one', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'scratchpad-no-niri-janelas-que-somem-com-um-atalho')!;
    expect(entry.data.snapshot).toBeDefined();
    const html = await renderEntry(entry);
    const aside = html.match(/<aside[^>]*data-post-aside[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? '';
    expect(aside).toContain('data-toc');
    expect(aside).toContain('data-post-snapshot');
  });

  it('keeps the phone index popover out of a bare hidden ancestor when there is no snapshot', async () => {
    // A popover under display:none opens but paints at width 0 (Chromium).
    // Archived posts with an index and no snapshot hit that path below md.
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'comece-com-gulp')!;
    expect(entry.data.snapshot).toBeUndefined();

    const html = await renderEntry(entry);
    const asideAt = html.indexOf('data-post-aside');
    // Prefer the attribute form so `data-toc-layout` does not win.
    const tocAt = html.search(/\sdata-toc[\s>]/);
    expect(asideAt).toBeGreaterThan(-1);
    expect(tocAt).toBeGreaterThan(asideAt);

    // The aside is the wrapper that used to carry `hidden` below md. Walk every
    // open tag still open at data-toc; none may list a bare `hidden` class.
    const voidish = /^(?:area|base|br|col|embed|hr|img|input|link|meta|path|source|track|wbr)$/;
    const stack: string[] = [];
    for (const m of html.slice(0, tocAt).matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g)) {
      const tag = m[0];
      const name = m[1].toLowerCase();
      if (tag.startsWith('</')) {
        stack.pop();
        continue;
      }
      if (tag.endsWith('/>') || voidish.test(name)) continue;
      stack.push(tag);
    }

    expect(stack.some((open) => open.includes('data-post-aside')), 'aside must wrap data-toc').toBe(true);

    for (const open of stack) {
      const cls = /\bclass="([^"]*)"/.exec(open)?.[1] ?? '';
      expect(cls.split(/\s+/), open).not.toContain('hidden');
    }
  });

  it('puts the title and date above the cover', async () => {
    const entries = await getAllPostEntries();
    const withCover = entries.find((e) => e.data.slug === '8-meses-de-malapronta-e-o-fim');
    expect(withCover?.data.cover).toBeTruthy();

    const html = await renderEntry(withCover!);
    const heading = html.search(/<h1\b/i);
    const time = html.search(/<time\b/i);
    const figure = html.search(/<figure\b/i);

    expect(heading).toBeGreaterThan(-1);
    expect(figure).toBeGreaterThan(time);
    expect(time).toBeLessThan(heading);
    expect(figure).toBeGreaterThan(html.indexOf('data-post-toolbar-end'));
  });

  it('omits the cover image when the post has no cover', async () => {
    // Coverless posts are drafts or use generated art. Drafts
    // are excluded from getStaticPaths, so this asserts the markup contract:
    // the page only emits <img> for posts that declare cover.
    expect(source).toMatch(/post\.cover\s*&&/);

    const entries = await getAllPostEntries();
    const withoutCover = entries.filter((e) => !e.data.cover);
    // Published posts may all have covers; when one does not, render it.
    // The cover is the eager, high-priority <img> in a <figure>; images in
    // the body (imported posts carry some) are not covers and may render.
    for (const entry of withoutCover) {
      const html = await renderEntry(entry);
      expect(html).not.toMatch(/<img\b[^>]*fetchpriority="high"/i);
      expect(html).not.toMatch(/<figure\b/i);
      expect(html).toContain(entry.data.title);
    }
  });

  it('renders the images inside a post body', async () => {
    const entry = (await getAllPostEntries()).find((e) => e.data.slug === 'criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos');
    expect(entry).toBeDefined();
    const html = await renderEntry(entry!);
    expect(html).toMatch(/<img\b[^>]*alt="Meu desktop no CachyOS com o Niri/);
  });
});

describe('/[slug] post page title', () => {
  it('uses the seoTitle in the browser tab and keeps the full title in the h1', async () => {
    const entry = (await getAllPostEntries()).find(
      (item) => item.data.slug === 'sessoes-do-red-dead-online-p2p-relays-e-nat-duplo',
    )!;
    const html = await renderEntry(entry);
    const tab = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';

    expect(entry.data.seoTitle).toBeDefined();
    expect(tab.length).toBeLessThanOrEqual(60);
    expect(tab).toContain(entry.data.seoTitle!);
    expect(html).toMatch(new RegExp(`<h1[^>]*>[^<]*${entry.data.title.slice(0, 30)}`));
  });
});
