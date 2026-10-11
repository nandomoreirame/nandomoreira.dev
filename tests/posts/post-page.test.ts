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

    expect(slugs).toContain('criar-site-completo-com-o-notion');
    expect(slugs).toContain('comece-com-gulp');
    // A draft's slug must never be a public path.
    expect(slugs).not.toContain('de-cinco-dias-para-trinta-minutos');
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
    const current = entries.find((e) => e.data.archived !== true && e.data.cover);
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
    const links = [...section.matchAll(/<a[^>]*href="\/([^"#/]+)"/g)].map((m) => m[1]);
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
  });

  it('keeps the cover and draws no art when a post has one', async () => {
    const entries = await getAllPostEntries();
    const html = await renderEntry(entries.find((e) => e.data.slug === 'criar-site-completo-com-o-notion')!);

    expect(html).toMatch(/<figure\b/i);
    expect(html).not.toMatch(/data-motif=/);
  });

  it('puts the title and date above the cover', async () => {
    const entries = await getAllPostEntries();
    const withCover = entries.find((e) => e.data.slug === 'criar-site-completo-com-o-notion');
    expect(withCover?.data.cover).toBeTruthy();

    const html = await renderEntry(withCover!);
    const heading = html.search(/<h1\b/i);
    const time = html.search(/<time\b/i);
    const figure = html.search(/<figure\b/i);

    expect(heading).toBeGreaterThan(-1);
    expect(figure).toBeGreaterThan(time);
    expect(time).toBeGreaterThan(heading);
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
