import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import About from '../../src/components/home/About.astro';
import Contact from '../../src/components/home/Contact.astro';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, { props });
};

const contacts = [
  { kind: 'email', value: 'fernando@nandomoreira.dev' },
  { kind: 'github', value: 'https://github.com/nandomoreirame' },
];

describe('About', () => {
  it('renders the bio it receives, with no copy duplicated in code', async () => {
    const html = await render(About, { bio: 'Construo ferramental de agentes.' });
    expect(html).toContain('Construo ferramental de agentes.');
  });
});

describe('Contact', () => {
  it('offers a direct channel with no form', async () => {
    const html = await render(Contact, { contacts });

    expect(html).toContain('mailto:fernando@nandomoreira.dev');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<input');
  });

  it('refuses to render with no channel at all', async () => {
    await expect(render(Contact, { contacts: [] })).rejects.toThrow();
  });

  it('marks external profile links as external', async () => {
    const html = await render(Contact, { contacts });
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('never turns the email into an external target', async () => {
    const html = await render(Contact, { contacts: [contacts[0]] });
    expect(html).not.toContain('target="_blank"');
  });
});
