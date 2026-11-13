import { describe, expect, it } from 'vitest';
import { alternatesFrom } from '../../src/lib/i18n/alternates';

const pairs = [{ 'pt-BR': '/o-falso-verde', en: '/en/the-false-green' }];

describe('alternatesFrom', () => {
  it('pairs a static page both ways when English is live', () => {
    expect(alternatesFrom('/sobre', pairs, true)).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
    expect(alternatesFrom('/en/about', pairs, true)).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
  });

  it('pairs content through its translation', () => {
    expect(alternatesFrom('/en/the-false-green', pairs, true)).toEqual(pairs[0]);
    expect(alternatesFrom('/o-falso-verde', pairs, true)).toEqual(pairs[0]);
  });

  it('has no pair without a translation (D6)', () => {
    expect(alternatesFrom('/o-fone-mudo-e-o-jack-p2-no-pipewire', pairs, true)).toBeUndefined();
    expect(alternatesFrom('/posts/arquivo', pairs, true)).toBeUndefined();
  });

  it('has no pair while English is not live (REQ-005)', () => {
    expect(alternatesFrom('/sobre', pairs, false)).toBeUndefined();
  });
});
