import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

/**
 * Tailwind finds classes by scanning source text. A class glued to an
 * interpolation (`sm:col-span-3${extra}`) reads as one unknown token, so the
 * utility never reaches the CSS: the page still renders, just without it.
 * This shipped once and squeezed /lab into a one-column layout.
 */
const GLUED = /[^\s`{]\$\{/;

const offendersIn = (source: string): string[] =>
  [...source.matchAll(/class=\{`([^`]*)`\}/g)].map(match => match[1]).filter(value => GLUED.test(value));

describe('class templates', () => {
  it('never glue a class to an interpolation', async () => {
    const offenders: string[] = [];

    for await (const file of glob('src/**/*.astro')) {
      for (const value of offendersIn(readFileSync(file, 'utf8'))) offenders.push(`${file}: ${value}`);
    }

    expect(offenders).toEqual([]);
  });

  it('proves the gate can actually fail', () => {
    expect(offendersIn('<span class={`flex sm:col-span-3${extra}`}>')).toHaveLength(1);
    expect(offendersIn('<span class={`flex sm:col-span-3 ${extra}`}>')).toHaveLength(0);
  });
});
