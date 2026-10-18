import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/middleware.ts', 'utf8');

describe('middleware wiring for the sales host', () => {
  it('asks salesRouting what to do with each request', () => {
    expect(source).toContain('salesRouting(context.url)');
  });

  it('answers a permanent redirect for the old address', () => {
    expect(source).toMatch(/status:\s*301/);
  });

  it('rewrites through next() instead of redirecting', () => {
    expect(source).toContain('next(sales.rewrite)');
  });
});
