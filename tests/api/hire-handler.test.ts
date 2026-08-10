import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import type { StoredBriefing } from '../../src/lib/hire/store';

const valid = {
  from: 'Agente da Acme',
  contact: 'contato@example.com',
  brief: 'Precisamos de um cliente multi-CLI para a equipe de plataforma.',
};

const saved: StoredBriefing[] = [];
let save: ReturnType<typeof vi.fn>;
let markNotified: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;

const deps = (overrides: Partial<Dependencies> = {}): Dependencies => ({
  store: { save, markNotified } as unknown as Dependencies['store'],
  notifier: { send } as unknown as Dependencies['notifier'],
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-08-10T12:00:00.000Z'),
  ...overrides,
});

const request = (body: string, init: RequestInit = {}) =>
  new Request('https://nandomoreira.dev/api/hire', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
    body,
    ...init,
  });

const post = (payload: unknown, init: RequestInit = {}, overrides: Partial<Dependencies> = {}) =>
  handleHire(request(JSON.stringify(payload), init), deps(overrides));

beforeEach(() => {
  saved.length = 0;
  save = vi.fn(async (briefing: StoredBriefing) => {
    saved.push(briefing);

    return 'doc-123';
  });
  markNotified = vi.fn(async () => undefined);
  send = vi.fn(async () => undefined);
});

describe('the happy path', () => {
  it('accepts a valid briefing with 202', async () => {
    const response = await post(valid);

    expect(response.status).toBe(202);
  });

  it('returns an identifier the agent can quote later', async () => {
    const body = await (await post(valid)).json();

    expect(body.id).toBe('doc-123');
  });

  it('persists before it notifies, so a provider outage cannot lose the brief', async () => {
    await post(valid);

    expect(save.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]);
  });

  it('stores the fields the data model declares', async () => {
    await post(valid, { headers: { 'x-forwarded-for': '9.9.9.9', 'user-agent': 'probe/1.0' } });

    expect(saved[0]).toMatchObject({
      from: valid.from,
      contact: valid.contact,
      brief: valid.brief,
      sourceIp: '9.9.9.9',
      userAgent: 'probe/1.0',
      notified: false,
    });
    expect(saved[0].receivedAt).toBe('2026-08-10T12:00:00.000Z');
  });

  it('marks the record notified only after delivery succeeds', async () => {
    await post(valid);

    expect(markNotified).toHaveBeenCalledWith('doc-123');
  });
});

describe('when the mail provider fails', () => {
  it('keeps the record and still answers success', async () => {
    send.mockRejectedValueOnce(new Error('provider down'));

    const response = await post(valid);

    expect(response.status).toBe(202);
    expect(save).toHaveBeenCalled();
    expect(saved[0].notified).toBe(false);
    expect(markNotified).not.toHaveBeenCalled();
  });
});

describe('when persistence is down', () => {
  it('answers 503 and sends no mail, since there is nothing to notify about', async () => {
    save.mockRejectedValueOnce(new Error('unavailable'));

    const response = await post(valid);

    expect(response.status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('the honeypot', () => {
  it('answers as if accepted, so the attacker cannot learn which field is the trap', async () => {
    const response = await post({ ...valid, website: 'http://spam' });

    expect(response.status).toBe(202);
  });

  it('persists nothing and sends nothing', async () => {
    await post({ ...valid, website: 'http://spam' });

    expect(save).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('the honeypot is indistinguishable from a real acceptance', () => {
  it('returns an id shaped like a real one, so one probe reveals nothing', async () => {
    const trapped = await (await post({ ...valid, website: 'http://spam' })).json();
    const real = await (await post(valid)).json();

    // A fixed placeholder would tell a bot exactly which field is the trap.
    expect(trapped.id).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(Object.keys(trapped).sort()).toEqual(Object.keys(real).sort());
    expect(trapped.status).toBe(real.status);
    expect(trapped.message).toBe(real.message);
  });

  it('returns a different id each time, like the database would', async () => {
    const first = await (await post({ ...valid, website: 'x' })).json();
    const second = await (await post({ ...valid, website: 'x' })).json();

    expect(first.id).not.toBe(second.id);
  });
});

describe('a slow client', () => {
  it('is cut off instead of holding a concurrency slot open', async () => {
    // Staying under 16 KB forever is exactly how a slow-read attack works, so
    // the size limit alone does not cover this.
    const stalling = new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"from":"a",'));
          // and then never another byte, and never close
        },
      }),
      // @ts-expect-error duplex is required by Node for a streaming body
      duplex: 'half',
    });

    const response = await handleHire(stalling, { ...deps(), readTimeoutMs: 200 });

    expect(response.status).toBe(408);
    expect(save).not.toHaveBeenCalled();
  }, 20_000);
});

describe('stored personal data', () => {
  it('caps the user agent, which the caller controls', async () => {
    await post(valid, { headers: { 'user-agent': 'x'.repeat(5_000) } });

    expect(saved[0].userAgent?.length).toBeLessThanOrEqual(256);
  });
});

describe('input handling', () => {
  it('answers 405 to anything that is not POST', async () => {
    const response = await handleHire(
      new Request('https://nandomoreira.dev/api/hire', { method: 'GET' }),
      deps(),
    );

    expect(response.status).toBe(405);
  });

  it('answers 400 to malformed JSON and persists nothing', async () => {
    const response = await handleHire(request('{ not json'), deps());

    expect(response.status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });

  it('answers 400 to a payload that does not match, and persists nothing', async () => {
    const response = await post({ brief: '' });

    expect(response.status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects an oversized body with 413 before parsing it', async () => {
    const response = await handleHire(request('x'.repeat(20_000)), deps());

    expect(response.status).toBe(413);
    expect(save).not.toHaveBeenCalled();
  });

  it('cuts on bytes read, not on the declared Content-Length', async () => {
    // The header says 10 bytes and the body is 20 KB; the read is what cuts.
    // Over real HTTP a SMALLER declared length is truncated by the server, so
    // the case that actually matters is a chunked body with no declared length
    // at all — covered end to end in scripts/verify-hire-endpoint.sh.
    const response = await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': '10' },
        body: 'x'.repeat(20_000),
      }),
      deps(),
    );

    expect(response.status).toBe(413);
  });

  it('answers 429 once the window budget is spent', async () => {
    const response = await post(valid, {}, { limiter: { check: () => false, size: () => 0 } });

    expect(response.status).toBe(429);
    expect(save).not.toHaveBeenCalled();
  });
});
