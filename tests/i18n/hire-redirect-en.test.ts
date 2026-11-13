import { describe, expect, it } from 'vitest';
import { contactOriginOf, formRedirect } from '../../src/lib/hire/form';

describe('contact form return path', () => {
  it('goes back to the English contact page only for the English form', () => {
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=contact-en'))).toBe('/en/contact');
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire'))).toBe('/contato');
  });

  it('never redirects to an arbitrary origin', () => {
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=https://evil.example'))).toBe('/contato');
    expect(contactOriginOf(new URL('https://nandomoreira.dev/api/hire?origem=/en/contact'))).toBe('/contato');
  });

  it('ignores inherited Object keys as origem', () => {
    for (const key of ['__proto__', 'constructor', 'toString']) {
      expect(contactOriginOf(new URL(`https://nandomoreira.dev/api/hire?origem=${key}`))).toBe('/contato');
    }
  });

  it('keeps the outcome values as the machine contract', () => {
    expect(formRedirect('ok', '/en/contact').headers.get('location')).toBe('/en/contact?envio=ok#envio');
  });
});
