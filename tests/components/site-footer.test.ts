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
    props: { name: 'Fernando Moreira Costa', year: 2026, contacts, ...props },
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

  it('never links to X', async () => {
    const html = await render();

    expect(html).not.toMatch(/>\s*X\s*</);
    expect(html).not.toContain('x.com');
    expect(html).not.toContain('twitter.com');
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

  it('offers a link back to the top', async () => {
    expect(await render()).toContain('href="#main"');
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

  it('links the machine-readable entry points: RSS and AGENTS.md', async () => {
    const html = await render();

    expect(html).toMatch(/<a[^>]*href="\/rss\.xml"[^>]*>\s*RSS\s*<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/AGENTS\.md"[^>]*>\s*AGENTS\.md\s*<\/a>/);
  });

  it('reads as one line of mono text, without icons', async () => {
    const html = await render();

    expect(html).not.toContain('<svg');
    expect(html).toContain('font-mono');
  });

  it('caps its inner row at the frame token, like the header', async () => {
    expect(await render()).toMatch(/<footer[^>]*>\s*<div[^>]*max-w-frame/);
  });
});
