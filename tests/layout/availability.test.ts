import { describe, expect, it } from 'vitest';
import { AVAILABILITY_LABEL, AVAILABILITY_TONE } from '../../src/lib/layout/availability';

describe('availability', () => {
  it('labels every status in pt-BR', () => {
    expect(AVAILABILITY_LABEL).toEqual({
      open: 'Disponível para novos projetos',
      limited: 'Disponibilidade limitada',
      closed: 'Indisponível no momento',
    });
  });

  it('tones each status with its semantic colour, as a text colour for currentColor', () => {
    expect(AVAILABILITY_TONE).toEqual({
      open: 'text-success',
      limited: 'text-warning',
      closed: 'text-destructive',
    });
  });
});
