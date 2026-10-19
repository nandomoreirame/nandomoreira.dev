/**
 * Stack name (as written in content frontmatter) to a Simple Icons logo.
 * Keys are lowercase; anything missing renders as text only, which is the
 * right outcome for concepts such as "DDD" that have no logo.
 */
const TECH_ICONS: Record<string, string> = {
  angular: 'angular',
  // Google's agent CLI (agy); Simple Icons has no Antigravity mark.
  antigravity: 'google',
  astro: 'astro',
  aws: 'amazonwebservices',
  bun: 'bun',
  bigquery: 'googlebigquery',
  'claude code': 'claude',
  codex: 'openai',
  cursor: 'cursor',
  discord: 'discord',
  docker: 'docker',
  dynamodb: 'amazondynamodb',
  electron: 'electron',
  express: 'express',
  fastapi: 'fastapi',
  firebase: 'firebase',
  'gemini cli': 'googlegemini',
  go: 'go',
  'google calendar': 'googlecalendar',
  'google cloud': 'googlecloud',
  'google gemini': 'googlegemini',
  graphql: 'graphql',
  hono: 'hono',
  hyprland: 'hyprland',
  javascript: 'javascript',
  laravel: 'laravel',
  markdown: 'markdown',
  mcp: 'modelcontextprotocol',
  mysql: 'mysql',
  'next.js': 'nextdotjs',
  'node.js': 'nodedotjs',
  nuxt: 'nuxt',
  php: 'php',
  playwright: 'playwright',
  polars: 'polars',
  postgresql: 'postgresql',
  pytest: 'pytest',
  python: 'python',
  qml: 'qt',
  ratatui: 'ratatui',
  react: 'react',
  'react router': 'reactrouter',
  ruby: 'ruby',
  'ruby on rails': 'rubyonrails',
  rust: 'rust',
  shell: 'gnubash',
  svelte: 'svelte',
  symfony: 'symfony',
  'tailwind css': 'tailwindcss',
  tauri: 'tauri',
  typescript: 'typescript',
  vitest: 'vitest',
  'vue.js': 'vuedotjs',
  wayland: 'wayland',
  wordpress: 'wordpress',
};

export const techIconFor = (name: string): string | undefined => {
  const slug = TECH_ICONS[name.trim().toLowerCase()];
  return slug ? `simple-icons:${slug}` : undefined;
};
