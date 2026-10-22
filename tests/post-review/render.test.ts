import { describe, expect, it } from 'vitest';
import { renderReview } from '../../src/lib/post-review/render';

const base = { prefix: 'antes\ndo ', suffix: ' e depois', start: 0, end: 1 };

const markdown = renderReview({
  title: 'Meu post',
  slug: 'meu-post',
  generatedAt: '2026-10-21T15:00:00.000Z',
  annotations: [
    { ...base, quote: 'primeiro trecho', section: null, request: 'mais curto', replacement: '', line: 12 },
    { ...base, quote: 'linha 1\nlinha 2', section: 'Contexto', request: '', replacement: 'novo texto', line: null },
  ],
});

describe('renderReview', () => {
  it('opens with the title, the post path, the time, the count and the instructions', () => {
    expect(markdown.startsWith('# Revisão: Meu post\n\n- Post: src/content/posts/meu-post.md\n')).toBe(true);
    expect(markdown).toContain('- Gerada em: 2026-10-21T15:00:00.000Z');
    expect(markdown).toContain('- Anotações: 2');
    expect(markdown).toContain('Não mude nada fora dos trechos anotados.');
  });

  it('heads each annotation with its number, section and line', () => {
    expect(markdown).toContain('## 1. Abertura, linha 12');
    expect(markdown).toContain('## 2. Contexto, linha não localizada');
  });

  it('quotes every line of the quote and of the replacement', () => {
    expect(markdown).toContain('> linha 1\n> linha 2');
    expect(markdown).toContain('**Texto novo:**\n\n> novo texto');
  });

  it('collapses the context to one line and marks empty fields', () => {
    expect(markdown).toContain('Contexto: «…antes do» [citação] «e depois…»');
    expect(markdown).toContain('**Pedido:** mais curto');
    expect(markdown).toContain('**Pedido:** (nenhum)');
    expect(markdown).toContain('**Texto novo:**\n\n> (nenhum)');
  });

  it('ends with exactly one newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});
