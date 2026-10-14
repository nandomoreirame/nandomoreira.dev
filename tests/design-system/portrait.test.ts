import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Portrait from '../../src/components/ui/Portrait.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(Portrait, { props });
};

describe('Portrait', () => {
  it('names the person in the alt text', async () => {
    const html = await render({ name: 'Fernando Moreira' });

    expect(html).toMatch(/alt="Ilustração de Fernando Moreira: [^"]+"/);
  });

  it('declares dimensions and offers AVIF and WebP before the JPEG', async () => {
    const html = await render({ name: 'Fernando Moreira' });

    expect(html).toMatch(/<img[^>]*width="960"[^>]*height="960"/);
    expect(html.indexOf('image/avif')).toBeLessThan(html.indexOf('image/webp'));
    expect(html).toContain('sizes="');
  });

  it('never catches clicks meant for the content around it', async () => {
    expect(await render({ name: 'Fernando Moreira' })).toMatch(/<div[^>]*pointer-events-none/);
  });

  it('sits behind the copy as a backdrop, pushed past the right edge on phones', async () => {
    const html = await render({ name: 'F' });
    const frame = html.match(/<div[^>]*data-portrait[^>]*class="([^"]*)"|<div[^>]*class="([^"]*)"[^>]*data-portrait/);
    const classes = frame?.[1] ?? frame?.[2] ?? '';

    expect(classes).toContain('absolute');
    expect(classes).toContain('-z-10');
    expect(classes).toMatch(/\bopacity-\d+/);
  });

  it('takes extra positioning from the page', async () => {
    expect(await render({ name: 'F', class: 'lg:scale-130' })).toMatch(/<div[^>]*class="[^"]*lg:scale-130/);
  });

  it('draws the backdrop as hidden inline SVG coloured by theme tokens, not hex', async () => {
    const html = await render({ name: 'F' });
    const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';

    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('var(--color-primary)');
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('puts the cut-out portrait above the backdrop', async () => {
    const html = await render({ name: 'F' });

    expect(html.indexOf('<svg')).toBeLessThan(html.indexOf('<picture'));
  });

  it('draws only the scenery elements, no solid panels behind the head', async () => {
    const svg = (await render({ name: 'F' })).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';

    expect(svg).not.toMatch(/<rect[^>]*height="1000"/);
  });

  it('types the code lines one after another, with a blinking cursor', async () => {
    const svg = (await render({ name: 'F' })).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    const rows = svg.match(/<rect[^>]*data-typing[^>]*>/g) ?? [];
    const delays = rows.map((row) => Number(row.match(/--delay:\s*([\d.]+)s/)?.[1]));

    expect(rows.length).toBeGreaterThan(3);
    expect(delays.every((delay) => Number.isFinite(delay))).toBe(true);
    expect(svg).toContain('data-cursor');
  });

  it('gives the other elements varied timings, so they do not move in lockstep', async () => {
    const svg = (await render({ name: 'F' })).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    const durations = new Set(svg.match(/--duration:\s*[\d.]+s/g) ?? []);

    expect(durations.size).toBeGreaterThan(3);
  });

  it('only animates when the visitor has not asked for reduced motion', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    const style = css.slice(css.indexOf('Scenery motion'));

    expect(style).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(style.indexOf('animation')).toBeGreaterThan(style.indexOf('prefers-reduced-motion: no-preference'));
  });

  it('keeps a code block at the lower left, beside the left node graph', async () => {
    const svg = (await render({ name: 'F' })).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    const rows = [...svg.matchAll(/<rect[^>]*data-typing[^>]*x="(\d+)"[^>]*y="(\d+)"/g)].map(([, x, y]) => [Number(x), Number(y)]);

    expect(rows.some(([x, y]) => x! < 150 && y! > 700)).toBe(true);
  });

  it('splits the drawing into parallax layers at different depths, the portrait moving against the scenery', async () => {
    const html = await render({ name: 'F' });
    const depths = [...html.matchAll(/data-parallax[^>]*--depth:\s*(-?[\d.]+)/g)].map(([, depth]) => Number(depth));
    const portrait = Number(html.match(/<picture[^>]*--depth:\s*(-?[\d.]+)/)?.[1]);

    expect(new Set(depths).size).toBeGreaterThan(2);
    expect(depths.some((depth) => Math.sign(depth) !== Math.sign(portrait))).toBe(true);
  });

  it('drives the parallax from the pointer variables the site script already writes, adding no script', () => {
    const source = readFileSync('src/components/ui/Portrait.astro', 'utf8');
    const css = readFileSync('src/styles/global.css', 'utf8');
    const source2 = css.slice(css.indexOf('Scenery motion'));

    expect(source).not.toContain('<script');
    expect(source2).toContain('var(--gx)');
    expect(source2).toMatch(/\[data-pointer-field\]\[data-active\]/);
    expect(source2).toContain('(pointer: fine)');
    expect(source2).toContain('prefers-reduced-motion: no-preference');
  });

  it('tilts the portrait toward the pointer, in CSS fed by the --tx/--ty the site script writes', async () => {
    const html = await render({ name: 'F' });
    const css = readFileSync('src/styles/global.css', 'utf8');
    const scenery = css.slice(css.indexOf('Scenery motion'));

    expect(html).toMatch(/<picture[^>]*data-tilt/);
    expect(scenery).toMatch(/\[data-tilt\][^}]*perspective\([^}]*var\(--tx, 0\)[^}]*var\(--ty, 0\)/);
  });
});
