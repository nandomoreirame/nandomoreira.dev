import { describe, expect, it } from 'vitest';
import type { Hit, Recorder } from '../../src/lib/analytics/recorder';
import { handleCvDownload, renderCvNotification, toCvDownload } from '../../src/lib/cv/download';
import { handleHire } from '../../src/lib/hire/handler';
import { renderNotification } from '../../src/lib/hire/notify';
import { createLimiter } from '../../src/lib/hire/rate-limit';
import { toStoredBriefing } from '../../src/lib/hire/store';

const now = () => new Date('2026-10-14T17:10:00.000Z');

const analytics = (journey: () => Promise<string>) => {
  const hits: Hit[] = [];
  const recorder: Pick<Recorder, 'record' | 'journey'> = {
    record: async (_request, hit) => void hits.push(hit),
    journey,
  };
  return { hits, recorder };
};

const sent: Array<{ id: string; journey?: string }> = [];
const notifier = { send: async (_item: unknown, id: string, journey?: string) => void sent.push({ id, journey }) };

describe('hire conversion', () => {
  it('records the conversion and passes the journey to the notification', async () => {
    sent.length = 0;
    const { hits, recorder } = analytics(async () => 'Journey today\n  14:02  /lab/forja');
    const response = await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'Ada', contact: 'ada@example.com', brief: 'Preciso de um MCP server' }),
      }),
      {
        store: { save: async () => 'doc-1', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: recorder,
      },
    );

    expect(response.status).toBe(202);
    expect(hits[0]).toMatchObject({ kind: 'conversion', path: '/api/hire', conversion: { type: 'hire', refId: 'doc-1' } });
    expect(sent[0]?.journey).toContain('/lab/forja');
  });

  it('still notifies when there is no analytics', async () => {
    sent.length = 0;
    await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'Ada', contact: 'ada@example.com', brief: 'Oi' }),
      }),
      { store: { save: async () => 'doc-2', markNotified: async () => {} }, notifier, limiter: createLimiter({ max: 5, windowMs: 60_000 }), now },
    );
    expect(sent[0]).toEqual({ id: 'doc-2', journey: undefined });
  });
});

describe('a failure while measuring never costs the lead', () => {
  const broken = {
    record: async () => {
      throw new Error('analytics down');
    },
    journey: async () => {
      throw new Error('journey down');
    },
  };

  it('accepts and notifies a briefing once even when analytics throws', async () => {
    sent.length = 0;
    const response = await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'Ada', contact: 'ada@example.com', brief: 'Oi' }),
      }),
      {
        store: { save: async () => 'doc-3', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: broken,
      },
    );

    expect(response.status).toBe(202);
    expect(sent).toEqual([{ id: 'doc-3', journey: undefined }]);
  });

  it('still notifies a CV download when analytics throws', async () => {
    sent.length = 0;
    await handleCvDownload(
      new Request('https://nandomoreira.dev/api/cv', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'nome=Ada',
      }),
      {
        store: { save: async () => 'cv-3', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: broken,
      },
    );

    expect(sent).toEqual([{ id: 'cv-3', journey: undefined }]);
  });
});

describe('cv conversion', () => {
  it('records the download and passes the journey', async () => {
    sent.length = 0;
    const { hits, recorder } = analytics(async () => 'Journey today\n  14:05  /curriculo');
    await handleCvDownload(
      new Request('https://nandomoreira.dev/api/cv', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'nome=Ada&email=ada%40example.com',
      }),
      {
        store: { save: async () => 'cv-1', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: recorder,
      },
    );
    expect(hits[0]?.conversion).toEqual({ type: 'cv', refId: 'cv-1' });
    expect(sent[0]?.journey).toContain('/curriculo');
  });
});

describe('notification text', () => {
  it('appends the journey to the briefing mail, before the briefing body', () => {
    const briefing = toStoredBriefing({
      payload: { from: 'Ada', contact: 'ada@example.com', brief: 'Oi' },
      sourceIp: '9.9.9.9',
      userAgent: null,
      now: now(),
    });
    const mail = renderNotification(briefing, 'doc-1', 'Journey today\n  14:02  /lab/forja');
    expect(mail.indexOf('/lab/forja')).toBeLessThan(mail.indexOf('Briefing\n--------'));
    expect(renderNotification(briefing, 'doc-1')).not.toContain('Journey');
  });

  it('appends the journey to the CV mail', () => {
    const download = toCvDownload({ name: 'Ada', email: null }, now());
    expect(renderCvNotification(download, 'cv-1', 'Journey today')).toContain('Journey today');
  });
});
