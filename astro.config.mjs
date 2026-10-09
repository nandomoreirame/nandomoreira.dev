import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nandomoreira.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Icons are inlined as SVG at render time; nothing ships to the browser.
  // Only the icons used are bundled into the server build.
  integrations: [icon()],
  // Legacy /notas never made the production sitemap; these are courtesy 301s.
  // Declared here, not as pre-rendered pages: `Astro.redirect` in a pre-rendered
  // page cannot send a status, so it degrades to 200 plus a <meta refresh>.
  // Trade-off accepted: the pattern redirects any /notas/<slug>, including one
  // that never existed, so a typo gets a 301 to a 404 instead of a direct 404.
  // Validating the slug would mean a page under src/pages/notas/ again, which is
  // the shape that shipped broken; the path was never indexed, so the cost is nil.
  redirects: {
    '/notas': '/posts',
    '/notas/[slug]': '/[slug]',
    // Browsers and crawlers ask for /favicon.ico by default; without this the
    // post route [slug] answers it.
    '/favicon.ico': '/favicon.svg',
    // The MCP page moved on 2026-10-08; old links keep working.
    '/conectar': '/mcp',
  },
  markdown: {
    // Shiki writes its colours inline, from its own theme, so the palette gate
    // in tests/design-system/contrast.test.ts never saw them. The default
    // `github-dark` renders comments at #6a737d on #24292e — 3.04:1, below AA,
    // which Lighthouse found in a published post.
    //
    // `github-dark-default` is the same family (so the look barely moves) and
    // measures 6.15:1 at its worst token. The choice was measured, not picked:
    // tests/design-system/code-contrast.test.ts fails on any theme that drops a
    // token below 4.5:1.
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
