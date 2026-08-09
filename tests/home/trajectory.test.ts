import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Trajectory from '../../src/components/home/Trajectory.astro';

const stats = [
  {
    value: '964',
    label: 'estrelas no GitHub',
    context: 'cerca de 700 vêm de temas Jekyll de 2018',
  },
  { value: '99', label: 'repositórios próprios', context: 'desde 2012' },
];

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(Trajectory, { props });
};

describe('Trajectory', () => {
  it('shows every number together with the narrative that explains it', async () => {
    const html = await render({ stats, narrative: 'A maior tração vem de 2018.' });

    expect(html).toContain('964');
    expect(html).toContain('cerca de 700 vêm de temas Jekyll de 2018');
  });

  it('refuses to render a stat with no context, per RISK-004', async () => {
    await expect(
      render({ stats: [{ value: '964', label: 'estrelas', context: '' }], narrative: 'n' }),
    ).rejects.toThrow();
  });

  it('states the trajectory narrative explicitly', async () => {
    const html = await render({ stats, narrative: 'A maior tração vem de 2018.' });
    expect(html).toContain('A maior tração vem de 2018.');
  });

  it('adds no second primary call to action', async () => {
    const html = await render({ stats, narrative: 'n' });
    expect(html).not.toContain('bg-primary');
  });
});
