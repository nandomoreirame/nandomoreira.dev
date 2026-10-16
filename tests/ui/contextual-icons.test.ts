import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiBar from '../../src/components/ai-view/AiBar.astro';
import AiSwitcher from '../../src/components/ai-view/AiSwitcher.astro';
import LinkList from '../../src/components/catalog/LinkList.astro';
import Contact from '../../src/components/home/Contact.astro';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';
import { contactIconFor } from '../../src/lib/ui/contact-icons';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  // biome-ignore lint: the container accepts any Astro component
  return container.renderToString(component as never, { props });
};

const contacts = [
  { kind: 'email', value: 'oi@example.com' },
  { kind: 'github', value: 'https://github.com/x' },
  { kind: 'linkedin', value: 'https://www.linkedin.com/in/x' },
];

/** The anchor whose href is `href`, up to its closing tag. */
const anchor = (html: string, href: string) =>
  html.match(new RegExp(`<a[^>]*href="${href.replace(/[.?]/g, '\\$&')}"[\\s\\S]*?</a>`))?.[0] ?? '';

describe('contactIconFor', () => {
  it('maps each channel to its icon', () => {
    expect(contactIconFor('github')).toBe('simple-icons:github');
    expect(contactIconFor('linkedin')).toBe('simple-icons:linkedin');
    expect(contactIconFor('email')).toBe('lucide:mail');
    expect(contactIconFor('site')).toBe('lucide:globe');
    expect(contactIconFor('fax')).toBeUndefined();
  });
});

describe('contextual icons', () => {
  it('marks IA and Humano in the view switcher, one at a time', async () => {
    const human = await render(AiSwitcher, { humanPath: '/sobre', view: 'human' });
    expect(anchor(human, '/sobre/ia')).toContain('data-icon="lucide:bot"');
    const ai = await render(AiSwitcher, { humanPath: '/sobre', view: 'ai' });
    expect(anchor(ai, '/sobre')).toContain('data-icon="lucide:user"');
  });

  it('puts the GitHub logo on Código fonte and an external arrow on Ver projeto', async () => {
    const html = await render(LinkList, {
      repoUrl: 'https://github.com/x/y',
      liveUrl: 'https://y.app',
    });
    expect(anchor(html, 'https://github.com/x/y')).toContain('data-icon="simple-icons:github"');
    expect(anchor(html, 'https://y.app')).toContain('data-icon="lucide:arrow-up-right"');
  });

  // Terminal Noir (2026-10-16): the footer is one line of mono text, as in
  // the Stitch file; the logos stay on the home contact channels.
  it('keeps the footer channels as text, without logos', async () => {
    const html = await render(SiteFooter, { name: 'N', year: 2026, contacts });
    expect(anchor(html, '/go/contato/github')).not.toContain('data-icon');
    expect(anchor(html, '/go/contato/linkedin')).not.toContain('data-icon');
  });

  it('shows an icon on every home contact channel', async () => {
    const html = await render(Contact, { contacts });
    expect(anchor(html, '/go/contato/email')).toContain('data-icon="lucide:mail"');
    expect(anchor(html, '/go/contato/github')).toContain('data-icon="simple-icons:github"');
  });

  it('draws the AI bar actions from Lucide', async () => {
    const html = await render(AiBar, { humanPath: '/sobre', mdPath: '/sobre.md' });
    for (const name of ['copy', 'download', 'x']) {
      expect(html).toContain(`data-icon="lucide:${name}"`);
    }
  });

  it('hides every icon from assistive technology', async () => {
    const html = [
      await render(AiSwitcher, { humanPath: '/', view: 'human' }),
      await render(LinkList, { repoUrl: 'https://github.com/x/y', liveUrl: 'https://y.app' }),
      await render(SiteFooter, { name: 'N', year: 2026, contacts }),
    ].join('');
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  });
});
