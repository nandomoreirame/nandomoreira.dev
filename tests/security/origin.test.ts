import { describe, expect, it } from 'vitest';
import { originAllowed } from '../../src/lib/security/origin';

describe('origin', () => {
  it('Origin fora da allowlist é recusado', () => {
    expect(originAllowed('https://evil.example', ['https://nandomoreira.dev'])).toBe(false);
  });

  it('Origin ausente é aceito', () => {
    expect(originAllowed(null, ['https://nandomoreira.dev'])).toBe(true);
    expect(originAllowed('https://nandomoreira.dev', ['https://nandomoreira.dev'])).toBe(true);
  });
});
