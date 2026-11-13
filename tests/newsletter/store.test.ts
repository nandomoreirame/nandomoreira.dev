import { describe, expect, it } from 'vitest';
import { subscriberId, toSubscriber } from '../../src/lib/newsletter/store';

describe('newsletter store', () => {
  it('ids a subscriber by the SHA-256 of the normalised email, so a repeat lands on the same document', () => {
    expect(subscriberId(' Fulano@Exemplo.COM ')).toBe(subscriberId('fulano@exemplo.com'));
    expect(subscriberId('fulano@exemplo.com')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stores the email, the date and the source, never the network', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    const doc = toSubscriber(' Fulano@Exemplo.com ', now);
    expect(doc).toMatchObject({
      email: 'fulano@exemplo.com',
      status: 'pending',
      subscribedAt: '2026-10-17T12:00:00.000Z',
      source: 'posts',
    });
    expect(doc.confirmTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(doc)).not.toEqual(expect.arrayContaining(['ip', 'userAgent', 'sourceIp']));
  });
});

describe('firestoreSubscriberStore contract', () => {
  it('tells the caller whether the address is new', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync('src/lib/newsletter/store.ts', 'utf8');
    expect(source).toMatch(
      /save: \(email: string, now: Date, locale\?: Locale\) => Promise<SubscriptionSave>/,
    );
  });
});
