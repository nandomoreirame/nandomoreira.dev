import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import StatusDot from '../../src/components/ui/StatusDot.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(StatusDot, { props });
};

describe('StatusDot', () => {
  it.each([
    ['open', 'text-success'],
    ['limited', 'text-warning'],
    ['closed', 'text-destructive'],
  ])('paints the %s status with %s, through currentColor', async (status, tone) => {
    const html = await render({ status });

    expect(html).toMatch(new RegExp(`<span[^>]*class="[^"]*\\brounded-full\\b[^"]*\\bbg-current\\b[^"]*\\b${tone}\\b`));
    // Decorative: never counted as a primary CTA.
    expect(html).not.toMatch(/\bbg-primary\b/);
  });

  it('pulses only while open for hire', async () => {
    expect(await render({ status: 'open' })).toContain('data-pulse');
    expect(await render({ status: 'limited' })).not.toContain('data-pulse');
    expect(await render({ status: 'closed' })).not.toContain('data-pulse');
  });

  it('is hidden from screen readers, since the text beside it says the status', async () => {
    expect(await render({ status: 'open' })).toMatch(/^\s*<span[^>]*aria-hidden="true"/);
  });

  it('falls back to the amber accent, still, when no status is given', async () => {
    const html = await render();

    expect(html).toMatch(/\btext-primary\b/);
    expect(html).not.toContain('data-pulse');
  });
});

describe('status pulse CSS', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');

  it('animates a ring with transform and opacity only', () => {
    const keyframes = css.match(/@keyframes status-pulse\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(keyframes).toContain('transform');
    expect(keyframes).toContain('opacity');
    expect(keyframes).not.toMatch(/box-shadow|width|height/);
  });

  it('runs the pulse only for people who did not ask for reduced motion', () => {
    const blocks = css.split('@media (prefers-reduced-motion: no-preference)').slice(1);

    expect(blocks.some((block) => /\[data-status-dot\]\[data-pulse\]::after[\s\S]*?animation:\s*status-pulse/.test(block.slice(0, 600)))).toBe(true);
  });
});
