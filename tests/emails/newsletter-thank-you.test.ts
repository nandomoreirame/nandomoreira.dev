import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { describe, expect, it } from 'vitest';
import NewsletterThankYou from '../../src/emails/newsletter-thank-you';

describe('NewsletterThankYou preview', () => {
  it('shows the newsletter variant, whose footer fits a signup', async () => {
    const text = toPlainText(await render(h(NewsletterThankYou, NewsletterThankYou.PreviewProps)));
    expect(text).toContain('Obrigado por assinar');
    expect(text).toMatch(/assinou as novidades/);
    expect(text).not.toMatch(/não entra em nenhuma lista/);
    expect(text).not.toMatch(/não vou mandar newsletter/);
  });
});
