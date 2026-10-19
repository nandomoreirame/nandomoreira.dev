import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { describe, expect, it } from 'vitest';
import NewsletterNotification from '../../src/emails/newsletter-notification';
import { subscriberMail } from '../../src/lib/newsletter/mail';

describe('NewsletterNotification', () => {
  const props = NewsletterNotification.PreviewProps;

  it('shows the address, the page it came from and the time, in pt-BR', async () => {
    const html = await render(h(NewsletterNotification, props));
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain(props.email);
    expect(html).toContain(props.origin);
    expect(html).toContain('Nova assinatura');
    expect(toPlainText(html)).not.toMatch(/[–—]/);
  });
});

describe('subscriberMail', () => {
  it('builds the notification with a pt-BR subject', async () => {
    const mail = await subscriberMail({
      email: 'fulano@exemplo.com',
      origin: '/posts',
      at: '2026-10-19T12:00:00.000Z',
    });
    expect(mail.subject).toBe('Nova assinatura: fulano@exemplo.com');
    expect(mail.text).toContain('fulano@exemplo.com');
  });
});
