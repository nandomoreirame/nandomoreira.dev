import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import type { OutgoingMail } from '../../src/lib/mail/outgoing';
import type { StoredBriefing } from '../../src/lib/hire/store';

const saved: StoredBriefing[] = [];
let save: ReturnType<typeof vi.fn>;
let markNotified: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;
let thankYou: ReturnType<typeof vi.fn>;

const deps = (overrides: Partial<Dependencies> = {}): Dependencies => ({
  store: { save, markNotified },
  notifier: { send },
  thankYou,
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-19T12:00:00.000Z'),
  ...overrides,
});

const form = (fields: Record<string, string>, overrides: Partial<Dependencies> = {}) =>
  handleHire(
    new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(overrides),
  );

const json = (payload: unknown, overrides: Partial<Dependencies> = {}) =>
  handleHire(
    new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    deps(overrides),
  );

beforeEach(() => {
  saved.length = 0;
  save = vi.fn(async (briefing: StoredBriefing) => {
    saved.push(briefing);
    return 'doc-1';
  });
  markNotified = vi.fn(async () => undefined);
  send = vi.fn(async () => undefined);
  thankYou = vi.fn(async () => undefined);
});

describe('thank-you after a hire form', () => {
  it('sends a thank-you to the visitor e-mail after notifying Fernando', async () => {
    const response = await form({
      nome: 'Ana Souza',
      email: 'ana@example.com',
      mensagem: 'Quero conversar sobre um agente.',
    });

    expect(response.status).toBe(303);
    expect(send).toHaveBeenCalled();
    expect(thankYou).toHaveBeenCalledTimes(1);
    expect(thankYou.mock.invocationCallOrder[0]).toBeGreaterThan(send.mock.invocationCallOrder[0]);
    const [to, mail] = thankYou.mock.calls[0] as [string, OutgoingMail];
    expect(to).toBe('ana@example.com');
    expect(mail.subject).toBe('Recebi sua mensagem');
    expect(markNotified).toHaveBeenCalledWith('doc-1');
  });

  it('does not send a thank-you for a WhatsApp contact', async () => {
    await form({
      nome: 'Ana',
      email: '11 91234-5678',
      mensagem: 'Oi pelo WhatsApp.',
    });

    expect(send).toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('does not send a thank-you for a JSON agent request', async () => {
    await json({ from: 'Agent', contact: 'agent@example.com', brief: 'Preciso de um MCP.' });

    expect(send).toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('does not send a thank-you for the honeypot', async () => {
    await form({
      nome: 'Bot',
      email: 'bot@example.com',
      mensagem: 'spam',
      hp_ref: 'filled',
    });

    expect(save).not.toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('does not send a thank-you for invalid input', async () => {
    await form({ nome: 'Ana' });

    expect(save).not.toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('does not send a thank-you when rate limited', async () => {
    await form(
      { nome: 'Ana', email: 'ana@example.com', mensagem: 'Oi' },
      { limiter: { check: () => false, size: () => 0 } },
    );

    expect(save).not.toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('still redirects and marks notified when the thank-you sender throws', async () => {
    thankYou = vi.fn(async () => {
      throw new Error('resend down');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const response = await form({
      nome: 'Ana',
      email: 'ana@example.com',
      mensagem: 'Oi',
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(markNotified).toHaveBeenCalledWith('doc-1');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0])).toMatch(/thank-you/);
    expect(String(warn.mock.calls[0])).not.toMatch(/ana@example\.com|Ana/);
    warn.mockRestore();
  });
});
