import { describe, expect, it } from 'vitest';
import { hourlyKeyOf, allowHourly } from '../../src/lib/security/hourly-limit';

describe('limite por hora', () => {
  it('bloqueia a 11ª requisição na mesma hora', async () => {
    const counts = new Map<string, number>();
    const store = {
      increment: async (key: string) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      },
    };
    const now = new Date('2026-11-03T12:10:00Z');
    let last = true;
    for (let i = 0; i < 11; i++) last = await allowHourly('203.0.113.7', now, { store, max: 10 });
    expect(last).toBe(false);
  });

  it('IP guardado só como hash', () => {
    const key = hourlyKeyOf('203.0.113.7', new Date('2026-11-03T12:10:00Z'));
    expect(key).not.toContain('203.0.113.7');
    expect(key).toMatch(/^[a-f0-9]{64}-2026-11-03T12$/);
  });
});
