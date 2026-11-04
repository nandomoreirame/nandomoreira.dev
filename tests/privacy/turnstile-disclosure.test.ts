import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('privacidade', () => {
  it('privacidade cita o Cloudflare Turnstile', () => {
    const source = readFileSync('src/pages/privacidade.astro', 'utf8');
    expect(source).toContain('Cloudflare Turnstile');
    expect(source).toContain('hash');
    expect(source).toContain('30 dias');
  });
});
