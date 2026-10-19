import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { describe, expect, it } from 'vitest';
import ThankYou, { greetingName } from '../../src/emails/thank-you';

const html = (props: Parameters<typeof ThankYou>[0]) => render(h(ThankYou, props));

describe('greetingName', () => {
  it('keeps only a short first name', () => {
    expect(greetingName('Ana Souza')).toBe('Ana');
    expect(greetingName('  maria  ')).toBe('Maria');
    expect(greetingName('João')).toBe('João');
  });

  it('drops anything that could carry a link or a pitch, since the address is unverified', () => {
    expect(greetingName(null)).toBeNull();
    expect(greetingName('')).toBeNull();
    expect(greetingName('promo.example.com')).toBeNull();
    expect(greetingName('https://x.co')).toBeNull();
    expect(greetingName('a'.repeat(31))).toBeNull();
    expect(greetingName('R$100')).toBeNull();
  });
});

describe('ThankYou', () => {
  it('thanks a briefing and says I will get back soon, in pt-BR', async () => {
    const out = await html({ name: 'Ana Souza', kind: 'briefing' });
    expect(out).toContain('lang="pt-BR"');
    expect(out).toContain('Ana');
    expect(out).not.toContain('Souza');
    expect(out).toMatch(/retorno em breve/);
  });

  it('thanks a CV download with its own wording', async () => {
    const out = await html({ name: 'Grace', kind: 'cv' });
    expect(out).toMatch(/currículo/);
    expect(out).toMatch(/em breve/);
  });

  it('greets without a name when there is none or it is unsafe', async () => {
    const out = await html({ name: 'buy.now.example', kind: 'briefing' });
    expect(out).not.toContain('buy.now.example');
    expect(out).toContain('Obrigado pelo contato');
  });

  it('never echoes anything else the visitor typed, and has no button', async () => {
    const out = await html({ name: 'Ana', kind: 'briefing' });
    expect(out).not.toContain('data-primary-action');
    expect(out).not.toContain('Responder');
  });

  it('says why it arrived and that it is no newsletter', async () => {
    const text = toPlainText(await html({ name: 'Ana', kind: 'briefing' }));
    expect(text).toMatch(/nandomoreira\.dev/);
    expect(text).toMatch(/lista/);
    expect(text).not.toMatch(/[–—]/);
  });

  it('says in the footer that it is an automatic message', async () => {
    for (const kind of ['briefing', 'cv'] as const) {
      const text = toPlainText(await html({ name: 'Ana', kind }));
      expect(text).toMatch(/mensagem automática/i);
    }
  });

  it('thanks a newsletter subscriber, without a name and without claiming no list', async () => {
    const text = toPlainText(await html({ name: null, kind: 'newsletter' }));
    expect(text).toContain('Obrigado por assinar');
    expect(text).toMatch(/próximos artigos/);
    expect(text).toMatch(/assinou/);
    expect(text).not.toMatch(/não entra em nenhuma lista/);
    expect(text).toMatch(/mensagem automática/i);
  });

  it('has preview props for email dev', () => {
    expect(ThankYou.PreviewProps.kind).toBe('briefing');
  });
});
