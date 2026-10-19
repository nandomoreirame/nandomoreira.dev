import { describe, expect, it } from 'vitest';
import { metaDescription, pageTitle, TITLE_SEPARATOR } from '../../src/lib/seo/meta';

describe('pageTitle', () => {
  it('appends the author name when the whole title fits in 60 characters', () => {
    expect(pageTitle('Blog', 'Fernando Moreira')).toBe('Blog // Fernando Moreira');
    expect(TITLE_SEPARATOR).toBe(' // ');
  });

  it('drops the suffix when it would push the title past 60 characters', () => {
    const long = 'O falso verde: quando o portão diz PASS e nada rodou';
    expect(`${long} // Fernando Moreira`.length).toBeGreaterThan(60);
    expect(pageTitle(long, 'Fernando Moreira')).toBe(long);
  });
});

describe('metaDescription', () => {
  it('keeps a description that already fits', () => {
    expect(metaDescription('Curta e direta.')).toBe('Curta e direta.');
  });

  it('cuts a long description at the last full sentence within 160 characters', () => {
    const first = 'Passei dez dias olhando o tráfego do meu Xbox para entender como uma sessão do Red Dead Online se forma.';
    const text = `${first} Aprendi a separar jogador de relay numa captura, descobri que o meu gateway tinha derrubado o tipo de NAT para Moderado.`;
    expect(metaDescription(text)).toBe(first);
  });

  it('cuts at a word boundary with an ellipsis when no sentence ends in time', () => {
    const text = `${'palavra '.repeat(40)}fim.`;
    const result = metaDescription(text);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });
});
