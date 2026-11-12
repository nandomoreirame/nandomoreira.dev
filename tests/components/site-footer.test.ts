import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';

const contacts = [
  { kind: 'email', value: 'oi@nandomoreira.dev' },
  { kind: 'github', value: 'https://github.com/nandomoreirame' },
  { kind: 'linkedin', value: 'https://linkedin.com/in/nandomoreirame' },
];

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteFooter, {
    props: { name: 'Fernando Moreira Costa', year: 2026, contacts, version: 'v17.812', ...props },
  });
};

describe('SiteFooter', () => {
  it('states the copyright with the name and year it receives', async () => {
    const html = await render();

    expect(html).toContain('2026');
    expect(html).toContain('Fernando Moreira Costa');
  });

  it('never credits the theme author', async () => {
    expect(await render()).not.toContain('BracoZS');
  });

  it('lists YouTube, Twitch, Instagram and X, each through /go', async () => {
    const html = await render({
      contacts: [
        ...contacts,
        { kind: 'youtube', value: 'https://www.youtube.com/@nandomoreiradev' },
        { kind: 'twitch', value: 'https://www.twitch.tv/baratotonto' },
        { kind: 'instagram', value: 'https://www.instagram.com/nandomoreira.dev' },
        { kind: 'x', value: 'https://x.com/oseunando' },
        { kind: 'devnull', value: 'https://dev-null.sh/@nandomoreirame' },
      ],
    });

    for (const [kind, label] of [
      ['youtube', 'YouTube'],
      ['twitch', 'Twitch'],
      ['instagram', 'Instagram'],
      ['x', 'X'],
      ['devnull', '/dev/null'],
    ]) {
      const link = html.match(new RegExp(`<a[^>]*href="/go/contato/${kind}"[\\s\\S]*?</a>`))?.[0] ?? '';
      expect(link).toContain(`data-icon="${kind === 'devnull' ? 'devnull' : `simple-icons:${kind}`}"`);
      expect(link).toContain(`aria-label="${label}, abre em nova aba"`);
      expect(link).toMatch(new RegExp(`<span[^>]*aria-hidden="true"[^>]*>\\s*${label}\\s*</span>`));
    }
    expect(html).not.toContain('x.com');
    expect(html).not.toContain('youtube.com');
  });

  it('lists the profile social channels', async () => {
    const html = await render();

    expect(html).toContain('href="/go/contato/github"');
    expect(html).toContain('href="/go/contato/linkedin"');
    expect(html).not.toContain('github.com/nandomoreirame');
  });

  it('never publishes the email address in the footer', async () => {
    expect(await render()).not.toContain('@nandomoreira.dev');
  });

  // Both moved on 2026-11-08: the way back to the top is a fixed corner button
  // (BackToTop) and the theme switch sits in the header.
  it('no longer carries the back-to-top link or the theme switch', async () => {
    const html = await render();
    expect(html).not.toContain('href="#main"');
    expect(html).not.toContain('Topo');
    expect(html).not.toContain('data-theme-toggle');
  });

  it('receives the year rather than reading the clock, so the build is reproducible', async () => {
    expect(await render({ year: 2030 })).toContain('2030');
  });

  it('keeps the referrer on /go links and asserts no identity with a self-link', async () => {
    const html = await render();
    const links = html.match(/<a[^>]*href="\/go\/[^"]*"[^>]*>/g) ?? [];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toContain('rel="noopener"');
      expect(link).not.toMatch(/rel="[^"]*\bme\b/);
    }
  });

  it('puts RSS and AGENTS.md before the social icons, which close the row on the right', async () => {
    const html = await render();
    const agents = html.indexOf('href="/AGENTS.md"');

    expect(html.indexOf('href="/rss.xml"')).toBeGreaterThan(-1);
    expect(html.indexOf('href="/rss.xml"')).toBeLessThan(agents);
    expect(agents).toBeLessThan(html.indexOf('href="/go/contato/github"'));
  });

  it('opens the links page in a new tab, before RSS', async () => {
    const html = await render();
    const link = html.match(/<a[^>]*href="https:\/\/links\.nandomoreira\.dev\/?"[^>]*>\s*Links\s*<\/a>/)?.[0] ?? '';

    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener"');
    expect(html.indexOf('href="https://links.nandomoreira.dev')).toBeLessThan(html.indexOf('href="/rss.xml"'));
  });

  it('links the machine-readable entry points: RSS and AGENTS.md', async () => {
    const html = await render();

    expect(html).toMatch(/<a[^>]*href="\/rss\.xml"[^>]*>\s*RSS\s*<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/AGENTS\.md"[^>]*>\s*AGENTS\.md\s*<\/a>/);
  });

  // Social channels are icons with a hover tooltip (Fernando, 2026-11-08); the
  // rest of the row stays mono text.
  it('draws each social channel as an icon named by a tooltip, keeping the rest as mono text', async () => {
    const html = await render();
    const github = html.match(/<a[^>]*href="\/go\/contato\/github"[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(github).toContain('data-icon="simple-icons:github"');
    expect(github).toContain('aria-label="GitHub, abre em nova aba"');
    expect(github).toMatch(/<span[^>]*aria-hidden="true"[^>]*>\s*GitHub\s*<\/span>/);
    expect(github).toMatch(/group-hover\/social:opacity-100/);
    expect(html).toContain('font-mono');
  });

  it('shows the site version, linked to the releases of this version', async () => {
    const html = await render();

    expect(html).toMatch(/<a[^>]*href="\/releases\/17"[^>]*>\s*v17\.812\s*<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/releases\/17"[^>]*aria-label="Versão 17\.812: os lançamentos desta versão"/);
  });

  it('caps its inner row at the frame token, like the header', async () => {
    expect(await render()).toMatch(/<footer[^>]*>\s*<div[^>]*max-w-frame/);
  });
});
