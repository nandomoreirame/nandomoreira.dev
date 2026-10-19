import { describe, expect, it } from 'vitest';
import { briefingMail } from '../../src/lib/hire/notify';
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

  it('shows the service label in the notification mail', async () => {
    const briefing = toStoredBriefing({
      payload: { ...base, service: 'online-store' },
      sourceIp: 'x',
      userAgent: null,
      now,
    });

    const mail = await briefingMail(briefing, 'doc-1');
    expect(mail.html).toContain('Serviço');
    expect(mail.html).toContain('Loja virtual');
    expect(mail.text).toContain('Loja virtual');
  });

  it('says não informado when there is no service', async () => {
    const briefing = toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now });

    const mail = await briefingMail(briefing, 'doc-1');
    expect(mail.html).toContain('Serviço');
    expect(mail.html).toContain('não informado');
  });
});

describe('briefingMail', () => {
  it('uses a pt-BR subject with the visitor name', async () => {
    const briefing = toStoredBriefing({ payload: base, sourceIp: '9.9.9.9', userAgent: null, now });
    const mail = await briefingMail(briefing, 'doc-1');
    expect(mail.subject).toBe('Novo briefing de Ada');
  });

  it('sets replyTo only when the contact is an e-mail', async () => {
    const phone = toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now });
    expect((await briefingMail(phone, 'doc-1')).replyTo).toBeUndefined();

    const email = toStoredBriefing({
      payload: { ...base, contact: 'ada@example.com' },
      sourceIp: 'x',
      userAgent: null,
      now,
    });
    expect((await briefingMail(email, 'doc-1')).replyTo).toBe('ada@example.com');
  });

  it('shows budget and interest labels, never the API slugs alone', async () => {
    const briefing = toStoredBriefing({
      payload: {
        from: 'Ada',
        contact: 'ada@example.com',
        brief: 'Oi',
        budget: '10k-30k',
        interests: ['ai-product', 'agents-mcp'],
      },
      sourceIp: 'x',
      userAgent: null,
      now,
    });
    const mail = await briefingMail(briefing, 'doc-1');
    expect(mail.html).toContain('R$ 10–30 mil');
    expect(mail.html).toContain('Produto de IA, Agents e MCP');
  });

  it('keeps the IP out of the mail', async () => {
    const briefing = toStoredBriefing({
      payload: { from: 'Ada', contact: 'ada@example.com', brief: 'Oi' },
      sourceIp: '9.9.9.9',
      userAgent: 'probe/1.0',
      now,
    });
    const mail = await briefingMail(briefing, 'doc-1');
    expect(mail.html).not.toContain('9.9.9.9');
    expect(mail.text).not.toContain('9.9.9.9');
    expect(mail.html).toContain('probe/1.0');
  });

  it('includes the journey when given', async () => {
    const briefing = toStoredBriefing({
      payload: { from: 'Ada', contact: 'ada@example.com', brief: 'Oi' },
      sourceIp: 'x',
      userAgent: null,
      now,
    });
    const journey = {
      entry: 'direto',
      utm: 'nenhuma',
      country: 'BR',
      views: [{ time: '14:02', path: '/lab/forja' }],
    };
    const withJourney = await briefingMail(briefing, 'doc-1', journey);
    expect(withJourney.html).toContain('/lab/forja');
    expect(withJourney.html).toContain('Jornada de hoje');

    const without = await briefingMail(briefing, 'doc-1');
    expect(without.html).not.toContain('Jornada de hoje');
  });
});
