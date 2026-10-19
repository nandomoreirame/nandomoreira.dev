import { describe, expect, it } from 'vitest';
import { cvMail, toCvDownload } from '../../src/lib/cv/download';

const now = new Date('2026-10-14T17:10:00.000Z');

describe('cvMail', () => {
  it('names who downloaded in the subject', async () => {
    const download = toCvDownload({ name: 'Grace', company: null, email: null }, now);
    expect((await cvMail(download, 'cv-1')).subject).toBe('Grace baixou seu currículo');
  });

  it('falls back to company, then e-mail, in the subject', async () => {
    const byCompany = toCvDownload({ name: null, company: 'Acme', email: null }, now);
    expect((await cvMail(byCompany, 'cv-1')).subject).toBe('Acme baixou seu currículo');

    const byEmail = toCvDownload({ name: null, company: null, email: 'a@b.co' }, now);
    expect((await cvMail(byEmail, 'cv-1')).subject).toBe('a@b.co baixou seu currículo');
  });

  it('sets replyTo when the visitor left an e-mail', async () => {
    const withEmail = toCvDownload({ name: 'Ada', company: null, email: 'ada@example.com' }, now);
    expect((await cvMail(withEmail, 'cv-1')).replyTo).toBe('ada@example.com');

    const without = toCvDownload({ name: 'Ada', company: null, email: null }, now);
    expect((await cvMail(without, 'cv-1')).replyTo).toBeUndefined();
  });

  it('shows company and não informado, and never the IP', async () => {
    const download = toCvDownload({ name: null, company: 'Acme', email: null }, now);
    const mail = await cvMail(download, 'cv-1');
    expect(mail.html).toContain('Acme');
    expect(mail.html).toContain('não informado');
    expect(mail.html).not.toContain('9.9.9.9');
  });

  it('includes the journey when given', async () => {
    const download = toCvDownload({ name: 'Ada', company: null, email: null }, now);
    const journey = {
      entry: 'direto',
      utm: 'nenhuma',
      country: 'BR',
      views: [{ time: '14:05', path: '/curriculo' }],
    };
    expect((await cvMail(download, 'cv-1', journey)).html).toContain('/curriculo');
    expect((await cvMail(download, 'cv-1')).html).not.toContain('Jornada de hoje');
  });
});
