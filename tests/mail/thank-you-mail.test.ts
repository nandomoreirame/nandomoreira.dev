import { describe, expect, it } from 'vitest';
import { thankYouMail } from '../../src/lib/mail/thank-you';

describe('thankYouMail', () => {
  it('uses the briefing subject', async () => {
    const mail = await thankYouMail({ name: 'Ana Souza', kind: 'briefing' });
    expect(mail.subject).toBe('Recebi sua mensagem');
    expect(mail.html).toContain('Obrigado pelo contato');
    expect(mail.text).toContain('Fernando Moreira');
    expect(mail).not.toHaveProperty('replyTo');
  });

  it('uses the CV subject', async () => {
    const mail = await thankYouMail({ name: null, kind: 'cv' });
    expect(mail.subject).toBe('Obrigado por baixar meu currículo');
    expect(mail.html).toContain('Recebi seus dados');
  });
});
