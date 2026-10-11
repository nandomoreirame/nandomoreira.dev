import { describe, expect, it } from 'vitest';
import { dayLabel, saoPauloDay } from '../../src/lib/now/day';

describe('saoPauloDay', () => {
  it('uses the America/Sao_Paulo calendar day', () => {
    expect(saoPauloDay(new Date('2026-10-12T01:00:00Z'))).toBe('2026-10-11');
    expect(saoPauloDay(new Date('2026-10-11T03:00:00Z'))).toBe('2026-10-11');
    expect(saoPauloDay(new Date('2026-10-11T02:59:00Z'))).toBe('2026-10-10');
  });
});

describe('dayLabel', () => {
  it('calls the previous calendar day in Sao Paulo yesterday', () => {
    expect(dayLabel('2026-10-11T02:30:00Z', new Date('2026-10-11T15:00:00Z'))).toBe('ontem');
  });

  it('labels the same Sao Paulo day as today and an older day as a short date, never a clock time', () => {
    const now = new Date('2026-10-11T15:00:00Z');
    const today = dayLabel('2026-10-11T15:00:00Z', now);
    const older = dayLabel('2026-10-08T15:00:00Z', now);
    expect(today).toBe('hoje');
    expect(older).toBe('8 de out.');
    expect(today).not.toContain(':');
    expect(older).not.toContain(':');
    expect(dayLabel('2026-10-11T02:30:00Z', now)).not.toContain(':');
  });
});
