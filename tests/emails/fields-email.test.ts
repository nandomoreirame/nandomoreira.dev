import { createElement as h } from 'react';
import { render } from 'react-email';
import { describe, expect, it } from 'vitest';
import { Fields } from '../../src/emails/_shared/blocks';
import { EMAIL_COLORS } from '../../src/emails/_shared/tokens';

/**
 * Gmail turns a bare address into its own blue, underlined link. A link we
 * write ourselves keeps our style, so an e-mail value is rendered as one, in
 * the text color (seen in a real Gmail inbox on 2026-10-19).
 */
describe('Fields with an e-mail value', () => {
  it('renders the address as a mailto link in the foreground color, not underlined', async () => {
    const html = await render(h(Fields, { rows: [['E-mail', 'fer@nandomoreira.me']] }));
    const link = html.match(/<a[^>]*href="mailto:fer@nandomoreira\.me"[^>]*>/)?.[0] ?? '';
    expect(link).toContain(`color:${EMAIL_COLORS.foreground}`);
    expect(link).toContain('text-decoration:none');
  });

  it('leaves a value that is not an e-mail as plain text', async () => {
    const html = await render(h(Fields, { rows: [['Página', '/posts'], ['Contato', '11 91234-5678']] }));
    expect(html).not.toContain('<a');
  });
});
