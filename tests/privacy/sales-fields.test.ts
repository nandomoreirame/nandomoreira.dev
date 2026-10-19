import { describe, expect, it } from 'vitest';
import * as policy from '../../src/lib/privacy/policy';

const text = JSON.stringify(policy);

describe('privacy policy and the sales form', () => {
  it('names the service field', () => {
    expect(text).toContain('serviço desejado');
  });

  it('says the form asks for an e-mail, since WhatsApp is a link and not a form field any more', () => {
    expect(text).toContain('no formulário, o e-mail');
    expect(text).not.toContain('e-mail ou WhatsApp');
  });
});
