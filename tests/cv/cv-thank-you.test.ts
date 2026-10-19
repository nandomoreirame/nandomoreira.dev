import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CvDependencies, type CvDownload, handleCvDownload } from '../../src/lib/cv/download';
import type { OutgoingMail } from '../../src/lib/mail/outgoing';

const saved: CvDownload[] = [];
let save: ReturnType<typeof vi.fn>;
let markNotified: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;
let thankYou: ReturnType<typeof vi.fn>;

const deps = (overrides: Partial<CvDependencies> = {}): CvDependencies => ({
  store: { save, markNotified },
  notifier: { send },
  thankYou,
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-19T12:00:00.000Z'),
  ...overrides,
});

const post = (fields: Record<string, string>, overrides: Partial<CvDependencies> = {}) =>
  handleCvDownload(
    new Request('https://nandomoreira.dev/api/cv', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(overrides),
  );

beforeEach(() => {
  saved.length = 0;
  save = vi.fn(async (download: CvDownload) => {
    saved.push(download);
    return 'cv-1';
  });
  markNotified = vi.fn(async () => undefined);
  send = vi.fn(async () => undefined);
  thankYou = vi.fn(async () => undefined);
});

describe('thank-you after a CV download', () => {
  it('sends a thank-you when the visitor left an e-mail', async () => {
    const response = await post({ nome: 'Grace Lima', email: 'grace@example.com' });

    expect(response.status).toBe(303);
    expect(send).toHaveBeenCalled();
    expect(thankYou).toHaveBeenCalledTimes(1);
    expect(thankYou.mock.invocationCallOrder[0]).toBeGreaterThan(send.mock.invocationCallOrder[0]);
    const [to, mail] = thankYou.mock.calls[0] as [string, OutgoingMail];
    expect(to).toBe('grace@example.com');
    expect(mail.subject).toBe('Obrigado por baixar meu currículo');
    expect(markNotified).toHaveBeenCalledWith('cv-1');
  });

  it('does not send a thank-you without an e-mail', async () => {
    await post({ nome: 'Grace Lima' });

    expect(send).toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
  });

  it('still redirects and marks notified when the thank-you sender throws', async () => {
    thankYou = vi.fn(async () => {
      throw new Error('resend down');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const response = await post({ nome: 'Grace', email: 'grace@example.com' });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/curriculo?envio=ok#baixar');
    expect(markNotified).toHaveBeenCalledWith('cv-1');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0])).toMatch(/thank-you/);
    expect(String(warn.mock.calls[0])).not.toMatch(/grace@example\.com|Grace/);
    warn.mockRestore();
  });
});
