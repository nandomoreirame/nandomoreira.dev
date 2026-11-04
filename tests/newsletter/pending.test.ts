import { describe, expect, it } from 'vitest';
import { toSubscriber } from '../../src/lib/newsletter/store';

describe('inscrição', () => {
  it('grava endereço novo como pending', () => {
    const doc = toSubscriber('Ana@Example.com', new Date('2026-11-03T12:00:00Z'));
    expect(doc.status).toBe('pending');
    expect(doc.email).toBe('ana@example.com');
    expect(doc.confirmTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(doc.confirmExpiresAt).toBe('2026-11-10T12:00:00.000Z');
  });
});
