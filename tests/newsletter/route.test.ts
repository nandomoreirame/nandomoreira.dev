import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('/api/subscribe route', () => {
  const source = readFileSync('src/pages/api/subscribe.ts', 'utf8');

  it('is a server route wired to the newsletter handler and the Firestore store', () => {
    expect(source).toContain('export const prerender = false');
    expect(source).toContain('handleSubscribe(');
    expect(source).toContain('firestoreSubscriberStore()');
  });

  it('wires the e-mail to me and the thank-you to the subscriber', () => {
    expect(source).toContain('resendSubscriberNotifier(');
    expect(source).toContain('resendThankYou(');
  });

  it('limits to five per IP every ten minutes', () => {
    expect(source).toMatch(/createLimiter\(\{\s*max:\s*5,\s*windowMs:\s*10 \* 60 \* 1000\s*\}\)/);
  });
});
