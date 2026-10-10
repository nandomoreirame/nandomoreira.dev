/**
 * Stack name (as written in content frontmatter) to a Simple Icons logo.
 * Keys are lowercase; anything missing renders as text only, which is the
 * right outcome for concepts such as "DDD" that have no logo.
 */
const TECH_ICONS: Record<string, string> = {
  astro: 'astro',
  aws: 'amazonwebservices',
  'claude code': 'claude',
  discord: 'discord',
  firebase: 'firebase',
  go: 'go',
  'google calendar': 'googlecalendar',
  'google cloud': 'googlecloud',
  'google gemini': 'googlegemini',
  hyprland: 'hyprland',
  javascript: 'javascript',
  markdown: 'markdown',
  'next.js': 'nextdotjs',
  'node.js': 'nodedotjs',
  php: 'php',
  pytest: 'pytest',
  qml: 'qt',
  python: 'python',
  ratatui: 'ratatui',
  react: 'react',
  'react router': 'reactrouter',
  rust: 'rust',
  shell: 'gnubash',
  svelte: 'svelte',
  tauri: 'tauri',
  typescript: 'typescript',
  vitest: 'vitest',
  wayland: 'wayland',
  wordpress: 'wordpress',
};

export const techIconFor = (name: string): string | undefined => {
  const slug = TECH_ICONS[name.trim().toLowerCase()];
  return slug ? `simple-icons:${slug}` : undefined;
};
