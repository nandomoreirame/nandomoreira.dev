import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CvDependencies, type CvDownload, cvFileName, handleCvDownload } from '../../src/lib/cv/download';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';

const saved: CvDownload[] = [];
let save: ReturnType<typeof vi.fn>;
let markNotified: ReturnType<typeof vi.fn>;
let send: ReturnType<typeof vi.fn>;

const deps = (overrides: Partial<CvDependencies> = {}): CvDependencies => ({
  store: { save, markNotified },
  notifier: { send },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-11T12:00:00.000Z'),
  ...overrides,
});

const post = (fields: Record<string, string>, overrides: Partial<CvDependencies> = {}) =>
  handleCvDownload(
    new Request('https://nandomoreira.dev/api/cv', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-for': '9.9.9.9',
        'user-agent': 'Mozilla/5.0',
      },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(overrides),
  );

const locationOf = (response: Response) => response.headers.get('location');

beforeEach(() => {
  saved.length = 0;
  save = vi.fn(async (download: CvDownload) => {
    saved.push(download);
    return 'doc-1';
  });
  markNotified = vi.fn(async () => undefined);
  send = vi.fn(async () => undefined);
});

describe('handleCvDownload', () => {
  it('stores the e-mail, tells me, and sends the visitor to the download', async () => {
    const response = await post({ nome: ' Ana Souza ', email: '  ana@example.com ' });

    expect(response.status).toBe(303);
    expect(locationOf(response)).toBe('/curriculo?envio=ok#baixar');
    expect(saved).toEqual([
      {
        name: 'Ana Souza',
        company: null,
        email: 'ana@example.com',
        receivedAt: '2026-10-11T12:00:00.000Z',
        notified: false,
        expiresAt: new Date('2027-10-11T12:00:00.000Z'),
      },
    ]);
    expect(send).toHaveBeenCalledWith(saved[0], 'doc-1');
    expect(markNotified).toHaveBeenCalledWith('doc-1');
  });

  it('keeps neither the IP nor the user agent: the e-mail is all this exists for', async () => {
    await post({ email: 'ana@example.com' });

    expect(JSON.stringify(saved)).not.toMatch(/9\.9\.9\.9|Mozilla/);
  });

  it('stores just the name when only the name is given', async () => {
    await post({ nome: 'Ana Souza', email: '' });

    expect(saved).toEqual([expect.objectContaining({ name: 'Ana Souza', email: null })]);
  });

  it('stores just the e-mail when only the e-mail is given', async () => {
    await post({ nome: '  ', email: 'ana@example.com' });

    expect(saved).toEqual([expect.objectContaining({ name: null, email: 'ana@example.com' })]);
  });

  it('stores the company, trimmed, and keeps it even without name or e-mail', async () => {
    await post({ nome: '', empresa: '  Acme Ltda ', email: '' });

    expect(saved).toEqual([expect.objectContaining({ name: null, company: 'Acme Ltda', email: null })]);
  });

  it('caps the company, since it is free text from a stranger', async () => {
    const response = await post({ empresa: 'a'.repeat(201) });

    expect(locationOf(response)).toBe('/curriculo?envio=invalido#empresa');
    expect(save).not.toHaveBeenCalled();
  });

  it('caps the name, since it is free text from a stranger', async () => {
    const response = await post({ nome: 'a'.repeat(201) });

    expect(locationOf(response)).toBe('/curriculo?envio=invalido#nome');
    expect(save).not.toHaveBeenCalled();
  });

  it('records nothing when every field is left empty', async () => {
    const response = await post({ nome: ' ', empresa: ' ', email: '   ' });

    expect(locationOf(response)).toBe('/curriculo?envio=ok#baixar');
    expect(save).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('sends an invalid e-mail back to the form, storing nothing', async () => {
    const response = await post({ email: 'not-an-email' });

    expect(locationOf(response)).toBe('/curriculo?envio=invalido#email');
    expect(save).not.toHaveBeenCalled();
  });

  it('answers a filled honeypot as a success, so the trap stays hidden', async () => {
    const response = await post({ email: 'bot@example.com', [FORM_HONEYPOT]: 'x' });

    expect(locationOf(response)).toBe('/curriculo?envio=ok#baixar');
    expect(save).not.toHaveBeenCalled();
  });

  it('refuses when the IP is over its limit', async () => {
    const response = await post({ email: 'ana@example.com' }, { limiter: { check: () => false, size: () => 0 } });

    expect(locationOf(response)).toBe('/curriculo?envio=limite#email');
    expect(save).not.toHaveBeenCalled();
  });

  it('never blocks the download when the database fails', async () => {
    save = vi.fn(async () => {
      throw new Error('firestore down');
    });
    const response = await post({ email: 'ana@example.com' });

    expect(locationOf(response)).toBe('/curriculo?envio=ok#baixar');
    expect(send).not.toHaveBeenCalled();
  });

  it('never blocks the download when the mail fails, and leaves the record unnotified', async () => {
    send = vi.fn(async () => {
      throw new Error('resend down');
    });
    const response = await post({ email: 'ana@example.com' });

    expect(locationOf(response)).toBe('/curriculo?envio=ok#baixar');
    expect(markNotified).not.toHaveBeenCalled();
  });

  it('only accepts POST', async () => {
    const response = await handleCvDownload(new Request('https://nandomoreira.dev/api/cv'), deps());

    expect(response.status).toBe(303);
    expect(locationOf(response)).toBe('/curriculo');
  });
});

describe('cvFileName', () => {
  it('names the file with the role and the download moment, in São Paulo time', () => {
    expect(cvFileName(new Date('2026-10-11T18:32:09Z'))).toBe(
      'curriculo-fernando-moreira-senior-ai-engineer-202610111532.pdf',
    );
  });

  it('keeps the local date across midnight UTC', () => {
    // 01:10 UTC on the 12th is still 22:10 on the 11th in São Paulo.
    expect(cvFileName(new Date('2026-10-12T01:10:00Z'))).toBe(
      'curriculo-fernando-moreira-senior-ai-engineer-202610112210.pdf',
    );
  });
});
