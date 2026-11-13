import { describe, expect, it } from 'vitest';
import { SALES_COPY, salesCopy } from '../../src/lib/sales/copy';
import { SALES_COPY_EN } from '../../src/lib/sales/copy-en';
import { salesOutcomeMessage } from '../../src/lib/sales/outcome';
import { serviceLabelsFor } from '../../src/lib/sales/service-labels';
import { testimonialsFor } from '../../src/lib/sales/proof';
import { handleOutbound } from '../../src/lib/analytics/outbound';
import { ptLeftovers } from '../helpers/pt-leftovers';

const leaves = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

describe('English sales copy', () => {
  it('matches the source shape and preserves the offer', () => {
    expect(leaves(SALES_COPY_EN).sort()).toEqual(leaves(SALES_COPY).sort());
    expect(salesCopy('pt-BR')).toBe(SALES_COPY);
    expect(salesCopy('en')).toBe(SALES_COPY_EN);
    expect(ptLeftovers(`<p>${JSON.stringify(SALES_COPY_EN)}</p>`)).toEqual([]);
    expect(JSON.stringify(SALES_COPY_EN)).not.toMatch(/[–—]/);
    expect(SALES_COPY_EN.hero.title).toContain('5 to 30 business days');
    const payment = SALES_COPY_EN.faq.find(item => item.question === 'How does payment work?')!.answer;
    for (const number of ['40%', '60%', '12', '5%']) expect(payment).toContain(number);
  });
  it('localizes every form outcome without changing its role', () => {
    for (const value of ['ok', 'invalido', 'limite', 'erro', 'captcha']) {
      expect(salesOutcomeMessage(value, 'en')?.role).toBe(salesOutcomeMessage(value)?.role);
      expect(ptLeftovers(`<p>${salesOutcomeMessage(value, 'en')?.text}</p>`)).toEqual([]);
    }
    expect(salesOutcomeMessage('constructor', 'en')).toBeUndefined();
    expect(serviceLabelsFor('en')['online-store']).toBe('Online store');
  });
  it('identifies translated testimonials', () => {
    for (const quote of testimonialsFor('en')) {
      expect(quote.name).toContain('(translated from Portuguese)');
      expect(ptLeftovers(`<p>${quote.text}</p>`)).toEqual([]);
    }
  });
  it('keeps the WhatsApp destination and changes only the ready-made message', async () => {
    const response = await handleOutbound(
      new Request('https://contrate.nandomoreira.dev/go/contato/whatsapp?locale=en'),
      {
        table: async () => new Map([['/go/contato/whatsapp', 'https://wa.me/5511917493331?text=Ol%C3%A1']]),
        recorder: { record: async () => undefined },
      },
    );
    const target = new URL(response.headers.get('location')!);
    expect(target.origin + target.pathname).toBe('https://wa.me/5511917493331');
    expect(target.searchParams.get('text')).toBe('Hi, Fernando! I came from your services page.');
  });
});
