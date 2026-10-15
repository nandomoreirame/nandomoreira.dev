import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

describe('prose tokens', () => {
  it('declares the long-form reading size used only by Prose', () => {
    expect(css).toContain('--text-prose: 1.125rem');
    expect(css).toContain('--text-prose--line-height: 1.7');
  });

  it('declares inline code size in em so it follows the surrounding text', () => {
    expect(css).toContain('--text-code-inline: 0.875em');
  });

  it('declares the gap between prose paragraphs', () => {
    expect(css).toContain('--spacing-paragraph: 1.25rem');
  });
});
