import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Prose from '../../src/components/ui/Prose.astro';

describe('Prose', () => {
  it('caps the measure so long-form case text stays readable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, {
      slots: { default: '<p>texto</p>' },
    });

    expect(html).toContain('max-w-[68ch]');
  });
});

describe('Prose code blocks', () => {
  const classes = async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, { slots: { default: '<pre><code>x</code></pre>' } });
    const raw = html.match(/class="([^"]*)"/)?.[1] ?? '';
    return raw.replaceAll('&amp;', '&').replaceAll('&gt;', '>').split(/\s+/);
  };

  // Code matters on this blog: a block must read as code, not as prose that
  // happens to be monospaced (2026-10-10).
  it('pads, frames and spaces every block apart from the text around it', async () => {
    const list = await classes();
    for (const name of ['[&_.code-block]:my-lg', '[&_pre]:my-0', '[&_pre]:p-md', '[&_pre]:pl-sm']) {
      expect(list).toContain(name);
    }
    expect(list).not.toContain('[&_pre]:border');
  });

  it('sets code in the mono face, a size smaller, with code line-height, not prose line-height', async () => {
    const list = await classes();
    for (const name of ['[&_pre]:font-mono', '[&_pre]:text-small', '[&_pre]:leading-normal']) {
      expect(list).toContain(name);
    }
  });

  it('marks inline code apart from the sentence, without touching code inside blocks', async () => {
    const list = await classes();
    for (const name of [
      '[&_:not(pre)>code]:font-mono',
      '[&_:not(pre)>code]:bg-surface-elevated',
      '[&_:not(pre)>code]:px-xs',
    ]) {
      expect(list).toContain(name);
    }
  });
});

describe('Prose rhythm and headings', () => {
  const classes = async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, { slots: { default: '<p>x</p>' } });
    const raw = html.match(/class="([^"]*)"/)?.[1] ?? '';
    return raw.replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&#43;', '+').split(/\s+/);
  };

  it('separates paragraphs with more room than a line break', async () => {
    expect(await classes()).toContain('[&_p]:mt-paragraph');
  });

  it('opens each section with a large semibold h2, far from what came before', async () => {
    const list = await classes();
    for (const name of [
      '[&_h2]:mt-2xl',
      '[&_h2]:text-h2',
      '[&_h2]:font-semibold',
      '[&_h2]:leading-tight',
      '[&_h2]:text-pretty',
      '[&_:is(h2,h3)]:font-serif',
    ]) {
      expect(list).toContain(name);
    }
    expect(list).not.toContain('sm:[&_h2]:text-h1');
  });

  it('reads in Inter at the prose size', async () => {
    const list = await classes();
    expect(list).toContain('font-sans');
    expect(list).toContain('text-prose');
    expect(list).not.toContain('font-serif');
    expect(list).not.toContain('text-body');
  });

  it('sets strong and inline code for the sans body', async () => {
    const list = await classes();
    expect(list).toContain('[&_strong]:font-bold');
    expect(list).toContain('[&_:not(pre)>code]:text-code-inline');
    expect(list).not.toContain('[&_:not(pre)>code]:text-small');
  });

  it('keeps a heading close to its first paragraph', async () => {
    expect(await classes()).toContain('[&_:is(h2,h3)+:is(p,ul,ol,pre,blockquote,.code-block)]:mt-sm');
  });

  it('formats tables like the Stitch design: full width, mono uppercase header, roomy ruled rows', async () => {
    const list = await classes();
    for (const name of [
      '[&_table]:w-full',
      '[&_table]:border-collapse',
      '[&_table]:text-small',
      '[&_:is(th,td)]:px-lg',
      '[&_:is(th,td)]:py-md',
      '[&_:is(th,td)]:align-middle',
      '[&_:is(th,td)]:text-left',
      '[&_th]:font-mono',
      '[&_th]:text-caption',
      '[&_th]:uppercase',
      '[&_th]:tracking-eyebrow',
      '[&_th]:font-normal',
      '[&_th]:text-muted-foreground',
      '[&_th]:bg-surface-elevated',
      '[&_th]:border-b',
      '[&_td]:border-b',
      '[&_td]:border-border',
      '[&_td]:text-muted-foreground',
      '[&_tr:last-child>td]:border-b-0',
    ]) {
      expect(list).toContain(name);
    }
    expect(list).not.toContain('[&_table]:block');
  });

  it('frames tables in a rounded, scrollable box on the surface', async () => {
    const list = await classes();
    for (const name of [
      '[&_.table-frame]:mt-paragraph',
      '[&_.table-frame]:overflow-x-auto',
      '[&_.table-frame]:rounded-md',
      '[&_.table-frame]:border',
      '[&_.table-frame]:border-border-strong',
      '[&_.table-frame]:bg-surface',
    ]) {
      expect(list).toContain(name);
    }
  });

  it('shows code in a cell as plain coloured mono: amber in the first column, green after', async () => {
    const list = await classes();
    for (const name of [
      '[&_td>code]:border-0!',
      '[&_td>code]:bg-transparent!',
      '[&_td>code]:px-0!',
      '[&_td>code]:text-success',
      '[&_td:first-child>code]:text-primary',
      // The last column is prose, so code inside it stays neutral.
      '[&_td:not(:first-child):last-child>code]:text-foreground',
    ]) {
      expect(list).toContain(name);
    }
  });

  it('gives h3 weight of its own', async () => {
    const list = await classes();
    for (const name of ['[&_h3]:mt-xl', '[&_h3]:font-semibold', '[&_h3]:text-h3']) expect(list).toContain(name);
  });

  it('restores list markers and indent, which the reset removes', async () => {
    const list = await classes();
    for (const name of [
      '[&_ul]:list-disc',
      '[&_ol]:list-decimal',
      '[&_:is(ul,ol)]:mt-lg',
      '[&_:is(ul,ol)]:pl-lg',
      '[&_li]:mt-xs',
      '[&_li]:marker:text-muted-foreground',
    ]) {
      expect(list).toContain(name);
    }
  });

  it('sets quotes and rules apart', async () => {
    const list = await classes();
    for (const name of [
      '[&_blockquote]:border-l-2',
      '[&_blockquote]:border-primary',
      '[&_blockquote]:pl-md',
      '[&_hr]:my-2xl',
      '[&_hr]:border-border',
    ]) {
      expect(list).toContain(name);
    }
  });

  it('frames inline code like the reference, with a border', async () => {
    const list = await classes();
    for (const name of [
      '[&_:not(pre)>code]:border',
      '[&_:not(pre)>code]:border-border-strong',
      '[&_:not(pre)>code]:rounded-md',
    ]) {
      expect(list).toContain(name);
    }
  });
});
