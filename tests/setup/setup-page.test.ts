import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';
import SetupPage from '../../src/pages/setup.astro';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { getProfile } from '../../src/lib/content';
import { SETUP_PATH, SETUP_SECTIONS, SETUP_UPDATED_AT, setupMarkdown } from '../../src/lib/setup/setup';

const site = new URL('https://nandomoreira.dev');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(SetupPage, { request: new Request('https://nandomoreira.dev/setup') });
};

describe('setup data', () => {
  it('lives at /setup', () => {
    expect(SETUP_PATH).toBe('/setup');
  });

  it('sends the old post URL to /setup with a real redirect', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain("'/apps-que-uso': '/setup'");
    expect(existsSync('src/pages/apps-que-uso.astro')).toBe(false);
  });

  it('covers the system, the terminal, the agents, the apps, the homelab and what was dropped', () => {
    const ids = SETUP_SECTIONS.map(section => section.id);
    for (const id of ['hardware', 'sistema', 'terminal', 'ia', 'apps', 'homelab', 'deixei-de-lado']) {
      expect(ids).toContain(id);
    }
  });

  it('opens with the hardware, as the reference /uses pages do', () => {
    expect(SETUP_SECTIONS[0]?.id).toBe('hardware');
    const names = SETUP_SECTIONS[0]!.items.map(item => item.name).join(' ');
    for (const model of ['Latitude 3450', 'MSI G272', 'Keychron K2', 'AULA F75', 'MX Master 3S', 'WH-1000XM5']) {
      expect(names).toContain(model);
    }
  });

  it('gives every item a name and the reason it is there, and only https links', () => {
    for (const section of SETUP_SECTIONS) {
      expect(section.items.length).toBeGreaterThan(0);
      for (const item of section.items) {
        expect(item.name.trim()).not.toBe('');
        expect(item.why.trim().length).toBeGreaterThan(10);
        if (item.url) expect(item.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('gives the apps the shortcuts that open them, as written in the Niri config', () => {
    const items = SETUP_SECTIONS.flatMap(section => section.items);
    const ghostty = items.find(item => item.name === 'Ghostty');
    expect(ghostty?.shortcuts).toContainEqual({ keys: 'Super+Enter' });
    for (const item of items) {
      for (const shortcut of item.shortcuts ?? []) expect(shortcut.keys).toMatch(/^(Super|Ctrl|Alt|Shift)(\+\S+)+$/);
    }
  });

  it('lists the Antigravity CLI right after the Grok CLI', () => {
    const names = SETUP_SECTIONS.find(section => section.id === 'ia')!.items.map(item => item.name);
    expect(names.indexOf('Antigravity CLI (agy)')).toBe(names.indexOf('Grok CLI') + 1);
  });

  it('points the hardware at the Mercado Livre affiliate links, marked as such', () => {
    const items = SETUP_SECTIONS.flatMap(section => section.items);
    const expected: Record<string, string> = {
      'Logitech MX Master 3S': 'https://meli.la/1gqJmJC',
      'Logitech MX Vertical': 'https://meli.la/2xmCMvP',
      'Sony WH-1000XM5': 'https://meli.la/2H5M9sr',
      'Logitech Zone Vibe 100': 'https://meli.la/1qUTCvu',
      'AULA F75': 'https://meli.la/1bCTqew',
      'MSI G272': 'https://meli.la/1WwJsLp',
      'Dell Latitude 3450': 'https://meli.la/2XtgKqp',
      'LG ultrawide 34" (2560x1080)': 'https://meli.la/2SGG5nP',
    };
    for (const [name, url] of Object.entries(expected)) {
      const item = items.find(candidate => candidate.name === name);
      expect(item?.url, name).toBe(url);
      expect(item?.affiliate, name).toBe(true);
    }
    for (const item of items)
      if (item.url?.startsWith('https://meli.la/')) expect(item.affiliate, item.name).toBe(true);
  });

  it('lists the AULA F75 as the main keyboard, before the Keychron K2', () => {
    const items = SETUP_SECTIONS[0]!.items;
    const aula = items.findIndex(item => item.name === 'AULA F75');
    const k2 = items.findIndex(item => item.name === 'Keychron K2');
    expect(aula).toBeLessThan(k2);
    expect(items[aula]?.why).toMatch(/principal/);
    expect(items[k2]?.why).toMatch(/secundário/);
  });

  it('discloses the affiliate links in the hardware section', () => {
    expect(SETUP_SECTIONS[0]?.intro).toMatch(/afiliado/);
  });

  it('links the homelab intro to the homelab post', () => {
    const homelab = SETUP_SECTIONS.find(section => section.id === 'homelab')!;
    expect(homelab.introLink).toEqual({ text: 'Um servidor em casa', href: '/meu-homelab-num-mac-mini-de-2018' });
    expect(homelab.intro).toContain(homelab.introLink!.text);
    expect(existsSync('src/content/posts/meu-homelab-num-mac-mini-de-2018.md')).toBe(true);
  });

  it('dates the page as a living document', () => {
    expect(SETUP_UPDATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('/setup page', () => {
  it('replaces the 2018 post', () => {
    expect(existsSync('src/content/posts/apps-que-uso.md')).toBe(false);
  });

  it('opens with the ~/setup path, one h1 and a heading per section', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));
    expect(main).toContain('~/setup');
    expect(main.match(/<h1/g)).toHaveLength(1);
    for (const section of SETUP_SECTIONS) expect(main).toContain(`id="${section.id}"`);
  });

  it('opens external links in a new tab with nofollow', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const external = main.match(/<a[^>]*href="https:\/\/(?!nandomoreira\.dev)[^"]*"[^>]*>/g) ?? [];
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link).toContain('target="_blank"');
      expect(link).toMatch(/rel="(sponsored )?nofollow noopener noreferrer"/);
    }
  });

  it('marks affiliate links as sponsored', async () => {
    const html = await render();
    const links = html.match(/<a[^>]*href="https:\/\/meli\.la\/[^"]*"[^>]*>/g) ?? [];
    expect(links).toHaveLength(8);
    for (const link of links) expect(link).toContain('rel="sponsored nofollow noopener noreferrer"');
  });

  it('closes with the newsletter card, answering back to /setup', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).toContain('id="novidades"');
    expect(main).toContain('action="/api/subscribe?origem=/setup"');
    expect(main.indexOf('id="novidades"')).toBeGreaterThan(main.indexOf('id="deixei-de-lado"'));
  });

  it('shows the subscription answer when it comes back', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SetupPage, {
      request: new Request('https://nandomoreira.dev/setup?assinatura=ok'),
    });
    expect(html).toMatch(/role="status"/);
  });

  it('shows each shortcut as keys', async () => {
    expect(await render()).toMatch(/<kbd[^>]*>Super<\/kbd>\s*\+\s*<kbd[^>]*>Enter<\/kbd>/);
  });

  it('renders the homelab intro link on the page and in the AI view', async () => {
    expect(await render()).toMatch(/<a href="\/meu-homelab-num-mac-mini-de-2018">Um servidor em casa<\/a>/);
    expect(setupMarkdown({ site })).toContain(
      '[Um servidor em casa](https://nandomoreira.dev/meu-homelab-num-mac-mini-de-2018), acessado',
    );
  });

  it('lists the shortcuts in the AI view too', () => {
    expect(setupMarkdown({ site })).toContain('`Super+Enter`');
  });

  it('shows when it was last updated', async () => {
    expect(await render()).toContain(`datetime="${SETUP_UPDATED_AT}"`);
  });
});

describe('Setup across the site', () => {
  it('sits in the main menu, after Blog and before Sobre', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteNav, { props: { hasPosts: true } });
    const desktop = html.slice(0, html.indexOf('id="site-menu"'));
    expect(desktop).toMatch(/<a[^>]*href="\/setup"[^>]*>[\s\S]*?Setup/);
    expect(desktop.indexOf('href="/posts"')).toBeLessThan(desktop.indexOf('href="/setup"'));
    expect(desktop.indexOf('href="/setup"')).toBeLessThan(desktop.indexOf('href="/sobre"'));
  });

  it('has an AI view with every section', async () => {
    const page = await markdownForPath(site, '/setup');
    expect(page?.mdPath).toBe('/setup.md');
    for (const section of SETUP_SECTIONS) expect(page?.markdown).toContain(`## ${section.title}`);
    expect(setupMarkdown({ site })).toBe(page?.markdown);
  });

  it('is listed in the sitemap and in the AI index', async () => {
    expect(buildSitemap({ site, projects: [] })).toContain('<loc>https://nandomoreira.dev/setup</loc>');
    const index = buildAiIndex({ site, profile: await getProfile(), projects: [], posts: [] });
    expect(JSON.stringify(index)).toContain('https://nandomoreira.dev/setup');
  });
});

describe('setup agents', () => {
  const section = (id: string) => SETUP_SECTIONS.find(item => item.id === id)!;

  it('lists only the agents of the current RPI flow, with the Grok CLI linked to its repository', () => {
    const agents = section('ia').items;
    expect(agents.map(item => item.name)).not.toContain('Codex');
    expect(agents.find(item => item.name === 'Grok CLI')?.url).toBe('https://github.com/xai-org/grok-build');
  });

  it('keeps the Codex once, under what was tried and dropped', () => {
    const dropped = section('deixei-de-lado').items.filter(item => item.name.startsWith('Codex'));
    expect(dropped).toHaveLength(1);
    expect(dropped[0]?.url).toBe('https://github.com/openai/codex');
  });
});
