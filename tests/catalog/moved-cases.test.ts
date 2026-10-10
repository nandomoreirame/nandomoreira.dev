import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = readFileSync('astro.config.mjs', 'utf8');

// The SaaS products moved from /lab to /portfolio on 2026-10-10. Their old
// URLs were public and indexed, so each keeps answering with a redirect.
const MOVED = ['bragstack', 'croonos', 'mousai', 'portfoliosnap'];

describe('cases moved from the lab to the portfolio', () => {
  it.each(MOVED)('redirects /lab/%s to the portfolio, with its markdown too', (slug) => {
    expect(config).toContain(`'/lab/${slug}': '/portfolio/${slug}'`);
    expect(config).toContain(`'/lab/${slug}.md': '/portfolio/${slug}.md'`);
  });
});
