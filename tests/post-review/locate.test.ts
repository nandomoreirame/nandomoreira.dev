import { describe, expect, it } from 'vitest';
import { locateLine, plainText } from '../../src/lib/post-review/locate';

const source = [
  '---',
  'title: "Meu post sobre o Niri"',
  '---',
  '',
  'Um parágrafo com **negrito**, `código` e [um link](https://x.dev).',
  '',
  '## Contexto',
  '',
  'Outro   parágrafo',
  'quebrado em duas linhas.',
].join('\n');

describe('plainText', () => {
  it('drops inline marks, keeps link text and collapses spaces', () => {
    expect(plainText('Um **negrito**, `código` e [um link](https://x.dev).')).toBe('Um negrito, código e um link.');
    expect(plainText('a   b\tc')).toBe('a b c');
  });
});

describe('locateLine', () => {
  it('finds a quote whose source carries inline marks', () => {
    expect(locateLine(source, 'negrito, código e um link')).toBe(5);
  });

  it('finds the frontmatter title and a heading', () => {
    expect(locateLine(source, 'Meu post sobre o Niri')).toBe(2);
    expect(locateLine(source, 'Contexto')).toBe(7);
  });

  it('normalises spaces in the source line', () => {
    expect(locateLine(source, 'Outro parágrafo')).toBe(9);
  });

  it('uses the first paragraph of a quote that spans paragraphs', () => {
    expect(locateLine(source, 'Contexto\n\nOutro parágrafo')).toBe(7);
  });

  it('is null when nothing matches', () => {
    expect(locateLine(source, 'frase que não existe')).toBeNull();
    expect(locateLine(source, '   ')).toBeNull();
  });
});
