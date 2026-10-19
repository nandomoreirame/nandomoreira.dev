import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/lib/ai-view/render';

describe('renderMarkdown', () => {
  it('turns a heading into an h1', () => {
    expect(renderMarkdown('# Hello')).toContain('<h1');
    expect(renderMarkdown('# Hello')).toContain('Hello');
  });

  it('turns a list into a ul', () => {
    const html = renderMarkdown('- one\n- two');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('one');
  });

  it('strips a leading YAML frontmatter block before rendering', () => {
    const source = ['---', 'title: Hidden', 'url: https://example.com/', '---', '', '# Visible'].join('\n');
    const html = renderMarkdown(source);
    expect(html).toContain('Visible');
    expect(html).not.toContain('Hidden');
    expect(html).not.toContain('example.com');
  });

  it('keeps the href on a markdown link', () => {
    const html = renderMarkdown('[lab](https://nandomoreira.dev/lab)');
    expect(html).toContain('href="https://nandomoreira.dev/lab"');
    expect(html).toContain('lab');
  });

  it('is deterministic for the same input', () => {
    const source = '# Title\n\n- a\n- b\n\n[x](/x)';
    expect(renderMarkdown(source)).toBe(renderMarkdown(source));
  });
});
