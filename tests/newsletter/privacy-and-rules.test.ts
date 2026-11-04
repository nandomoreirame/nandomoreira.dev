import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { privacySections } from '../../src/lib/privacy/policy';

describe('newsletter privacy and rules', () => {
  it('denies every client path to newsletter_subscribers explicitly', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    expect(rules).toMatch(/match \/newsletter_subscribers\/\{doc\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/request_hourly_limits\/\{doc\}\s*\{\s*allow read, write: if false;/);
  });

  it('documents the newsletter in the privacy policy, with consent, storage and how to leave', () => {
    const section = privacySections.find(item => item.id === 'novidades');
    expect(section?.title).toBe('Novidades por e-mail');
    const text = section?.paragraphs.join(' ') ?? '';
    expect(text).toContain('art. 7º, I');
    expect(text).toContain('IP em claro não entra');
    expect(text).toContain('pedido de confirmação');
    expect(text).toContain('pedir para sair');
  });
});
