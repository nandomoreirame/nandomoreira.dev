import { describe, expect, it } from 'vitest';
import { renderNotification } from '../../src/lib/hire/notify';
import { toStoredBriefing } from '../../src/lib/hire/store';

const now = new Date('2026-10-18T12:00:00.000Z');
const base = { from: 'Ada', contact: '11 91234-5678', brief: 'Quero um site.' };

describe('service on the stored briefing', () => {
  it('stores the chosen service', () => {
    const briefing = toStoredBriefing({
      payload: { ...base, service: 'website' },
      sourceIp: '203.0.113.1',
      userAgent: null,
      now,
    });

    expect(briefing.service).toBe('website');
  });

  it('stores null when no service was sent', () => {
    expect(toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now }).service).toBeNull();
  });

  it('shows the service in the notification mail', () => {
    const briefing = toStoredBriefing({
      payload: { ...base, service: 'online-store' },
      sourceIp: 'x',
      userAgent: null,
      now,
    });

    expect(renderNotification(briefing, 'doc-1')).toContain('Service:   online-store');
  });

  it('says not given when there is no service', () => {
    const briefing = toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now });

    expect(renderNotification(briefing, 'doc-1')).toContain('Service:   not given');
  });
});
