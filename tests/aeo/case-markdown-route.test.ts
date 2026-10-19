import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET as labGet } from '../../src/pages/lab/[slug].md.ts';
import { GET as portfolioGet } from '../../src/pages/portfolio/[slug].md.ts';

const site = new URL('https://nandomoreira.dev');
const call = (get: typeof labGet, slug: string) => get({ params: { slug }, site } as unknown as APIContext);

describe('case markdown routes', () => {
  it('declare the human case page as canonical', async () => {
    expect((await call(labGet, 'forja')).headers.get('link')).toBe(
      '<https://nandomoreira.dev/lab/forja>; rel="canonical"',
    );
    expect((await call(portfolioGet, 'bragstack')).headers.get('link')).toBe(
      '<https://nandomoreira.dev/portfolio/bragstack>; rel="canonical"',
    );
  });
});
