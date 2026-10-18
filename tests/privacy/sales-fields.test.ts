import { describe, expect, it } from 'vitest';
import * as policy from '../../src/lib/privacy/policy';

const text = JSON.stringify(policy);

describe('privacy policy and the sales form', () => {
  it('names the service field', () => {
    expect(text).toContain('serviço desejado');
  });

  it('says the contact may be a WhatsApp number', () => {
    expect(text).toContain('e-mail ou WhatsApp');
  });
});
