import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nandomoreira.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
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
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
