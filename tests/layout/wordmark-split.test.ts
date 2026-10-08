import { describe, expect, it } from 'vitest';
import { splitWordmark } from '../../src/lib/layout/wordmark';

describe('splitWordmark', () => {
  it('splits the brand around the accent', () => {
    expect(splitWordmark('nandomoreira.dev', 'moreira')).toEqual({
      before: 'nando',
      accent: 'moreira',
      after: '.dev',
    });
  });

  it('leaves the whole brand unaccented when the accent is not in it', () => {
    expect(splitWordmark('Fernando Costa', 'moreira')).toEqual({
      before: 'Fernando Costa',
      accent: '',
      after: '',
    });
  });

  it('leaves the whole brand unaccented when there is no accent', () => {
    expect(splitWordmark('nandomoreira.dev')).toEqual({
      before: 'nandomoreira.dev',
      accent: '',
      after: '',
    });
  });
});
