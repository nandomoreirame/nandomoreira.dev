import { describe, expect, it } from 'vitest';
import { renderNotification } from '../../src/lib/hire/notify';
import { splitForStorage, toStoredBriefing } from '../../src/lib/hire/store';

const now = new Date('2026-10-08T12:00:00.000Z');
const briefing = toStoredBriefing({
  payload: { from: 'Ada', contact: 'ada@example.com', brief: 'Oi', budget: 'undecided' },
  sourceIp: '9.9.9.9',
  userAgent: 'probe/1.0',
  now,
});

describe('retention (privacy policy: 12 months, network data 30 days)', () => {
  it('expires the briefing 12 months after it arrives', () => {
    expect(briefing.expiresAt.toISOString()).toBe('2027-10-08T12:00:00.000Z');
  });

  it('expires the network data 30 days after it arrives', () => {
    expect(briefing.networkExpiresAt.toISOString()).toBe('2026-11-07T12:00:00.000Z');
  });

  it('keeps IP and user agent out of the main document, in a record with its own expiry', () => {
    const { document, network } = splitForStorage(briefing);

    expect(document).not.toHaveProperty('sourceIp');
    expect(document).not.toHaveProperty('userAgent');
    expect(document).toMatchObject({ from: 'Ada', budget: 'undecided', expiresAt: briefing.expiresAt });
    expect(network).toEqual({
      sourceIp: '9.9.9.9',
      userAgent: 'probe/1.0',
      expiresAt: briefing.networkExpiresAt,
    });
  });

  it('leaves the IP out of the notification e-mail, which the TTL cannot reach', () => {
    const mail = renderNotification(briefing, 'doc-1');
    expect(mail).not.toContain('9.9.9.9');
    expect(mail).toContain('probe/1.0');
  });

  it('carries the new context fields into the notification', () => {
    const mail = renderNotification(
      toStoredBriefing({
        payload: { from: 'Ada', contact: 'a@b.co', brief: 'Oi', company: 'Acme', interests: ['job', 'aeo'] },
        sourceIp: '1.1.1.1',
        userAgent: null,
        now,
      }),
      'doc-2',
    );
    expect(mail).toContain('Acme');
    expect(mail).toContain('job, aeo');
  });
});
