import { describe, expect, it } from 'vitest';
import { endSentence } from '../../src/lib/now/sentence';

describe('endSentence', () => {
  it('adds a period to text without final punctuation', () => {
    expect(endSentence('Raul Seixas')).toBe('Raul Seixas.');
  });

  it('keeps text that already ends a sentence', () => {
    expect(endSentence('Charlie Brown Jr.')).toBe('Charlie Brown Jr.');
    expect(endSentence('Funciona!')).toBe('Funciona!');
    expect(endSentence('Será?')).toBe('Será?');
    expect(endSentence('E depois…')).toBe('E depois…');
  });

  it('ignores trailing whitespace', () => {
    expect(endSentence('CLI de dados.  ')).toBe('CLI de dados.');
  });
});
