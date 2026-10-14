import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import About from '../../src/components/home/About.astro';
import Contact from '../../src/components/home/Contact.astro';
import Index from '../../src/pages/index.astro';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, { props });
};

const contacts = [
  { kind: 'email', value: 'oi@nandomoreira.dev' },
  { kind: 'github', value: 'https://github.com/nandomoreirame' },
];

const srcFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? srcFiles(path) : [path];
  });

describe('About', () => {
  it('renders the summary it receives and links to the full about page', async () => {
    const html = await render(About, { summary: 'Construo ferramental de agentes.' });
    expect(html).toContain('Construo ferramental de agentes.');
    expect(html).toContain('href="/sobre"');
  });
});

describe('Contact', () => {
  it('offers a direct channel with no form', async () => {
    const html = await render(Contact, { contacts });

    expect(html).toContain('href="/go/contato/email"');
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

  it('sends every contact through /go/contato', async () => {
    const html = await render(Contact, { contacts });
    expect(html).toContain('href="/go/contato/github"');
    expect(html).not.toContain('href="https://github.com/nandomoreirame"');
  });

  it('never turns the email into an external target', async () => {
    const html = await render(Contact, { contacts: [contacts[0]] });
    expect(html).not.toContain('target="_blank"');
  });
});

describe('home no longer hosts About or Contact', () => {
  it('does not render id="sobre" or id="contato" on the home page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index, {});

    expect(html).not.toContain('id="sobre"');
    expect(html).not.toContain('id="contato"');
  });

  it('has no src/ links pointing at the old home anchors', () => {
    const offenders = srcFiles('src')
      .filter((path) => path.endsWith('.astro') || path.endsWith('.ts') || path.endsWith('.tsx'))
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        return source.includes('/#contato') || source.includes('/#sobre');
      });

    expect(offenders).toEqual([]);
  });
});
