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
    for (const name of ['[&_.code-block]:my-lg', '[&_pre]:my-0', '[&_pre]:p-md', '[&_pre]:pl-sm', '[&_pre]:rounded-md', '[&_pre]:border', '[&_pre]:border-border-strong']) {
      expect(list).toContain(name);
    }
  });

  it('sets code in the mono face, a size smaller, with code line-height, not prose line-height', async () => {
    const list = await classes();
    for (const name of ['[&_pre]:font-mono', '[&_pre]:text-small', '[&_pre]:leading-normal']) {
      expect(list).toContain(name);
    }
  });

  it('marks inline code apart from the sentence, without touching code inside blocks', async () => {
    const list = await classes();
    for (const name of ['[&_:not(pre)>code]:font-mono', '[&_:not(pre)>code]:bg-surface-elevated', '[&_:not(pre)>code]:px-xs']) {
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
    expect(await classes()).toContain('[&_p]:mt-lg');
  });

  it('opens each section with a large semibold h2, far from what came before', async () => {
    const list = await classes();
    for (const name of ['[&_h2]:mt-2xl', '[&_h2]:text-h2', 'sm:[&_h2]:text-h1', '[&_h2]:font-semibold', '[&_h2]:leading-tight', '[&_h2]:text-balance']) {
      expect(list).toContain(name);
    }
  });

  it('keeps a heading close to its first paragraph', async () => {
    expect(await classes()).toContain('[&_:is(h2,h3)+:is(p,ul,ol,pre,blockquote,.code-block)]:mt-sm');
  });

  it('gives h3 weight of its own', async () => {
    const list = await classes();
    for (const name of ['[&_h3]:mt-xl', '[&_h3]:font-semibold', '[&_h3]:text-h3']) expect(list).toContain(name);
  });

  it('restores list markers and indent, which the reset removes', async () => {
    const list = await classes();
    for (const name of ['[&_ul]:list-disc', '[&_ol]:list-decimal', '[&_:is(ul,ol)]:mt-lg', '[&_:is(ul,ol)]:pl-lg', '[&_li]:mt-xs', '[&_li]:marker:text-muted-foreground']) {
      expect(list).toContain(name);
    }
  });

  it('sets quotes and rules apart', async () => {
    const list = await classes();
    for (const name of ['[&_blockquote]:border-l-2', '[&_blockquote]:border-primary', '[&_blockquote]:pl-md', '[&_hr]:my-2xl', '[&_hr]:border-border']) {
      expect(list).toContain(name);
    }
  });

  it('frames inline code like the reference, with a border', async () => {
    const list = await classes();
    for (const name of ['[&_:not(pre)>code]:border', '[&_:not(pre)>code]:border-border-strong', '[&_:not(pre)>code]:rounded-md']) {
      expect(list).toContain(name);
    }
  });
});
