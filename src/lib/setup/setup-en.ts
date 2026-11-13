import type { Locale } from '../i18n/locale';
import { routeFor } from '../i18n/routes';
import { SETUP_LEAD, SETUP_SECTIONS, type SetupSection } from './setup';

export const SETUP_LEAD_EN =
  'The hardware and tools I use every day, the ones I built myself to fill the gaps, and the ones I tried and dropped. This is not a static page: it changes when my setup changes.';

export const SETUP_SECTIONS_EN: SetupSection[] = [
  {
    id: 'hardware',
    title: 'Hardware',
    intro:
      'The Mercado Livre links are affiliate links: if you buy through them, I earn a commission, at no extra cost to you.',
    items: [
      {
        name: 'Dell Latitude 3450',
        url: 'https://meli.la/2XtgKqp',
        affiliate: true,
        why: 'My work laptop: 13th-gen Intel Core i5-1345U, 32 GB of RAM, 1 TB WD SN740 SSD and Intel Iris Xe. The 14" 1920x1080 screen doubles as a third monitor.',
      },
      {
        name: 'LG ultrawide 34" (2560x1080)',
        url: 'https://meli.la/2SGG5nP',
        affiliate: true,
        why: 'Ultrawide monitor in 21:9 (the LG HDR WFHD).',
      },
      {
        name: 'MSI G272',
        url: 'https://meli.la/1WwJsLp',
        affiliate: true,
        why: '27" 1920x1080 monitor, next to the ultrawide.',
      },
      {
        name: 'iPad 11" (primeira geração)',
        url: 'https://support.apple.com/pt-br/111974',
        why: 'I use it as a support screen.',
      },
      {
        name: 'iPhone 12',
        url: 'https://support.apple.com/pt-br/111876',
        why: 'My everyday phone.',
      },
      {
        name: 'Mesa ErgoDesk com regulagem de altura',
        url: 'https://www.ergodesk.com.br',
        why: 'Black electric ErgoDesk frame, bought without a top, with a custom-made desktop.',
      },
      {
        name: 'Cadeira Comfy Aryan',
        url: 'https://www.comfy.com.br',
        why: 'Black mesh, 4D armrests and a sliding seat, Relax version.',
      },
      {
        name: 'AULA F75',
        url: 'https://meli.la/1bCTqew',
        affiliate: true,
        why: 'My main keyboard: mechanical, compact, 75% layout.',
      },
      {
        name: 'Keychron K2',
        url: 'https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard',
        why: 'The secondary keyboard, also mechanical and 75% layout.',
      },
      {
        name: 'Logitech MX Master 3S',
        url: 'https://meli.la/1gqJmJC',
        affiliate: true,
        why: 'My main mouse.',
      },
      {
        name: 'Logitech MX Vertical',
        url: 'https://meli.la/2xmCMvP',
        affiliate: true,
        why: 'The secondary mouse, vertical, to vary wrist position.',
      },
      {
        name: 'Sony WH-1000XM5',
        url: 'https://meli.la/2H5M9sr',
        affiliate: true,
        why: 'My main headphones, with noise cancelling.',
      },
      {
        name: 'Logitech Zone Vibe 100',
        url: 'https://meli.la/1qUTCvu',
        affiliate: true,
        why: 'The second pair of headphones, light and wireless.',
      },
    ],
  },
  {
    id: 'sistema',
    title: 'System',
    intro:
      'After many years across Windows, macOS and Ubuntu-based distros, the laptop has run CachyOS since June 2026.',
    items: [
      {
        name: 'CachyOS',
        url: 'https://cachyos.org',
        why: 'Arch with an optimized kernel and packages. I came from ZorinOS and a few months of Omarchy, and this is where I stayed.',
      },
      {
        name: 'Niri',
        url: 'https://github.com/YaLTeR/niri',
        why: 'Wayland compositor that lays windows out in scrollable columns. I have a shortcut for almost everything, and messaging and music apps live in scratchpads that show and hide with one key.',
      },
      {
        name: 'Noctalia',
        url: 'https://github.com/noctalia-dev/noctalia',
        why: 'The whole shell: bar, launcher, notifications and lock screen. It has a plugin system, and that is what got me writing my own.',
        shortcuts: [
          { keys: 'Ctrl+Space', label: 'launcher' },
          { keys: 'Super+Alt+B', label: 'restarts the shell' },
        ],
      },
    ],
    related: [
      {
        title: 'I built four Noctalia plugins 100% with AI on my CachyOS',
        href: '/criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos',
      },
    ],
  },
  {
    id: 'terminal',
    title: 'Terminal and editor',
    items: [
      {
        name: 'Ghostty',
        url: 'https://ghostty.org',
        why: 'My everyday terminal, with selection going only to the primary clipboard so I can paste with the middle button.',
        shortcuts: [{ keys: 'Super+Enter' }],
      },
      {
        name: 'Zsh com Oh My Zsh',
        url: 'https://ohmyz.sh',
        why: 'My usual shell, with my Git, system and utility scripts versioned in the dotfiles repo.',
      },
      {
        name: 'mise',
        url: 'https://mise.jdx.dev',
        why: 'One manager for Node, Python and the rest. It replaced nvm, pyenv and company.',
      },
      {
        name: 'RTK',
        url: 'https://github.com/rtk-ai/rtk',
        why: 'A CLI proxy that trims command output before it reaches the agent. It saves context, with one caveat: it cuts long lists, so to check something for real I call the binary directly.',
      },
      {
        name: 'btop',
        url: 'https://github.com/aristocratau/btop',
        why: 'To see what is eating CPU and memory when tests or a build get heavy.',
        shortcuts: [{ keys: 'Super+Alt+T' }],
      },
      {
        name: 'VS Code e Neovim',
        url: 'https://code.visualstudio.com',
        why: 'Both stay configured in my dotfiles, but most of the code today comes from the agents.',
        shortcuts: [{ keys: 'Super+Shift+I', label: 'VS Code' }],
      },
    ],
  },
  {
    id: 'ia',
    title: 'AI and agents',
    intro: 'I work in an RPI flow (research, plan and implementation), with one agent for each role.',
    items: [
      {
        name: 'Claude Code',
        url: 'https://www.anthropic.com/claude-code',
        why: 'It leads: researches, writes the spec and the plan, validates, reviews and commits. On top of it runs my framework of skills, rules, hooks and memory.',
        shortcuts: [{ keys: 'Super+Shift+Enter', label: 'opens in a new Ghostty' }],
      },
      {
        name: 'Grok CLI',
        url: 'https://github.com/xai-org/grok-build',
        why: 'Implements the plan tasks, one at a time, with no permission to run git.',
      },
      {
        name: 'Antigravity CLI (agy)',
        url: 'https://antigravity.google',
        why: 'Reviews each task diff in a throwaway copy of the repo, as a second model beside the Claude Code review.',
      },
      {
        name: 'Ollama e OpenCode',
        url: 'https://ollama.com',
        why: 'Local AI, with qwen2.5-coder running on the machine itself.',
      },
    ],
    related: [
      {
        title: 'RPI flow with three agents: Claude Code plans, Grok implements and Codex reviews',
        href: '/fluxo-rpi-claude-code-grok-codex',
      },
      {
        title: 'How I built my site that talks to AI via MCP',
        href: '/como-construi-meu-site-que-conversa-com-ia-via-mcp',
      },
    ],
  },
  {
    id: 'apps',
    title: 'Apps',
    items: [
      {
        name: 'Google Chrome',
        url: 'https://www.google.com/chrome',
        why: 'My main browser. A script makes Niri focus its window when a link opens from another app.',
        shortcuts: [{ keys: 'Super+Shift+B' }, { keys: 'Super+Shift+Alt+B', label: 'incognito' }],
      },
      {
        name: '1Password',
        url: 'https://1password.com',
        why: 'Passwords, keys and secrets. It is one of the two apps that start with the session, and quick access sits on Ctrl+Shift+Space.',
        shortcuts: [{ keys: 'Ctrl+Shift+Space', label: 'quick access' }],
      },
      {
        name: 'Obsidian',
        url: 'https://obsidian.md',
        why: 'Notes and docs, in a Niri scratchpad.',
        shortcuts: [{ keys: 'Super+Shift+O' }],
      },
      {
        name: 'YouTube Music, Spotify, WhatsApp e Discord',
        url: 'https://music.youtube.com',
        why: 'Music and chat, each in its own Niri scratchpad. Discord also gets the alerts from my radars.',
        shortcuts: [
          { keys: 'Super+Shift+U', label: 'YouTube Music' },
          { keys: 'Super+Shift+S', label: 'Spotify' },
          { keys: 'Super+Shift+A', label: 'WhatsApp' },
          { keys: 'Super+Shift+D', label: 'Discord' },
        ],
      },
      {
        name: 'mpv',
        url: 'https://mpv.io',
        why: 'The default video player. It replaced VLC.',
      },
      {
        name: 'Steam e RetroArch',
        url: 'https://store.steampowered.com',
        why: 'For gaming. Game mode freezes the work apps and turns on the performance profile.',
        shortcuts: [{ keys: 'Super+Alt+G', label: 'game mode' }],
      },
    ],
  },
  {
    id: 'homelab',
    title: 'Homelab',
    intro: 'A home server, reached from anywhere through Tailscale, with each service on a .home address.',
    introLink: { text: 'A home server', href: '/meu-homelab-num-mac-mini-de-2018' },
    items: [
      {
        name: 'Mac mini (2018)',
        url: 'https://support.apple.com/pt-br/111912',
        why: 'The server, with a Core i3-8100B, running Linux.',
      },
      {
        name: 'CasaOS',
        url: 'https://casaos.zimaspace.com',
        why: 'The panel that installs and manages the server Docker apps.',
      },
      {
        name: 'Tailscale',
        url: 'https://tailscale.com',
        why: 'The private network that ties the laptop to the homelab from wherever I am. SSH comes in straight, with a key.',
      },
      {
        name: 'Pi-hole',
        url: 'https://pi-hole.net',
        why: 'Home DNS: blocks ads and resolves the .home names of the services.',
      },
      {
        name: 'Caddy',
        url: 'https://caddyserver.com',
        why: 'The reverse proxy that puts each container behind a name. Staging for this site lives behind it.',
      },
      {
        name: 'Jellyfin e Swing Music',
        url: 'https://jellyfin.org',
        why: 'Movies, shows and my music library, served from home.',
      },
      {
        name: 'Samba',
        url: 'https://www.samba.org',
        why: 'Shares a file folder with the home network.',
      },
      {
        name: 'Uptime Kuma',
        url: 'https://github.com/louislam/uptime-kuma',
        why: 'Alerts when a home service goes down.',
      },
    ],
  },
  {
    id: 'feito-por-mim',
    title: 'Made by me',
    intro: 'When I could not find the tool, I wrote it. All open source, with the case in the lab.',
    items: [
      {
        name: 'Daybar',
        url: 'https://github.com/nandomoreirame/noctalia-daybar',
        why: 'Quick capture, Google Calendar agenda, focus timer, favorites and Markdown notes, on the Noctalia bar.',
        shortcuts: [
          { keys: 'Super+Space', label: 'quick capture' },
          { keys: 'Super+Shift+Space', label: 'panel' },
        ],
      },
      {
        name: 'AI Bar',
        url: 'https://github.com/nandomoreirame/noctalia-aibar',
        why: 'How much of the Claude Code and Grok plan is already used, and the usage pace of each window.',
      },
      {
        name: 'Gistbar',
        url: 'https://github.com/nandomoreirame/noctalia-gistbar',
        why: 'Search, copy and create my GitHub gists, from the keyboard.',
        shortcuts: [
          { keys: 'Super+G', label: 'search' },
          { keys: 'Super+Ctrl+G', label: 'new gist' },
        ],
      },
      {
        name: 'Desktop Sticky Notes',
        url: 'https://github.com/nandomoreirame/noctalia-desktop-sticky-notes',
        why: 'Markdown sticky notes pinned to the desktop.',
      },
      {
        name: 'Forja',
        url: 'https://github.com/nandomoreirame/forja',
        why: 'Desktop client that brings Claude Code, Codex and Gemini into one interface.',
      },
    ],
    related: [{ title: 'Every project in the lab', href: routeFor('/lab', 'en') }],
  },
  {
    id: 'deixei-de-lado',
    title: 'Tried and dropped',
    items: [
      {
        name: 'Omarchy',
        url: 'https://omarchy.org',
        why: 'DHH\'s distro, with Hyprland. I used it for a few months before landing on CachyOS.',
      },
      {
        name: 'Model Usage',
        url: 'https://github.com/noctalia-dev/noctalia-plugins/tree/main/model-usage',
        why: 'Noctalia plugin for AI model usage. I used it for months, until I wrote AI Bar.',
      },
      {
        name: 'Gemini no fluxo de implementação',
        url: 'https://gemini.google.com',
        why: 'It did the final validation of tasks. It left because the free plan was too fragile: request limits blowing up mid-run.',
      },
      {
        name: 'Codex',
        url: 'https://github.com/openai/codex',
        why: 'It started by committing, until it got a list with one file and made five commits. It moved to only reviewing the diff in a read-only sandbox, and later left the RPI flow, which today is Claude Code, Grok and agy.',
      },
      {
        name: 'TickTick',
        url: 'https://ticktick.com',
        why: 'Task app that lived in a Niri scratchpad on Super+Shift+T. It left autostart and then the routine.',
      },
      {
        name: 'VLC',
        url: 'https://www.videolan.org',
        why: 'Replaced by mpv as the default player.',
      },
    ],
  },
];

/** Lead and sections for the given locale. */
export const setupFor = (locale: Locale = 'pt-BR') =>
  locale === 'en'
    ? { lead: SETUP_LEAD_EN, sections: SETUP_SECTIONS_EN }
    : { lead: SETUP_LEAD, sections: SETUP_SECTIONS };
