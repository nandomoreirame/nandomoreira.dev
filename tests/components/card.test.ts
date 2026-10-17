import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Card from '../../src/components/ui/Card.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(Card, { props, slots: { default: '<p>Conteúdo</p>' } });
};

const classesOf = (html: string) => (html.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/);

describe('Card', () => {
  it('is a raised surface bounded by the hairline, with the 6px radius', async () => {
    const classes = classesOf(await render());

    expect(classes).toEqual(expect.arrayContaining(['rounded-md', 'border', 'border-border', 'bg-surface']));
    expect(await render()).toContain('<p>Conteúdo</p>');
  });

  it('renders the element it is told to, so a list of cards stays a list', async () => {
    expect(await render({ as: 'li' })).toMatch(/^\s*<li\b/);
    expect(await render()).toMatch(/^\s*<div\b/);
  });

  it('lifts the border to the strong token on hover only when interactive', async () => {
    expect(classesOf(await render({ interactive: true }))).toContain('hover:border-border-strong');
    expect(classesOf(await render())).not.toContain('hover:border-border-strong');
  });

  it('never shadows the card: depth comes from tone and hairline', async () => {
    expect(await render({ interactive: true })).not.toMatch(/\bshadow-/);
  });

  it('forwards an id, so a card can be the target of a fragment', async () => {
    expect(await render({ id: 'x' })).toContain('id="x"');
  });
});
