import { describe, expect, it } from 'vitest';
import { toAvailability } from '../../src/lib/content/profile';

describe('toAvailability', () => {
  it('always reports the date the status was last updated', () => {
    const availability = toAvailability({
      status: 'open',
      detail: 'Aberto a consultoria.',
      updatedAt: '2026-08-08',
    });

    expect(availability.updatedAt).toBe('2026-08-08');
    expect(availability.status).toBe('open');
  });
});
