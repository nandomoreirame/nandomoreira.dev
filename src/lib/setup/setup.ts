import { absoluteUrl } from '../aeo/urls';

/**
 * The /setup page: what I use every day, in the spirit of a /uses page.
 * Replaces the 2018 post of the same address, so the URL keeps working.
 * One source for the page and for its AI view (setupMarkdown).
 */
export const SETUP_PATH = '/setup';

/** Bump when the list changes: it is a living document. */
export const SETUP_UPDATED_AT = '2026-10-19';

export const SETUP_LEAD =
  'O hardware e as ferramentas que eu uso todo dia, as que eu mesmo fiz para preencher o que faltava e as que testei e deixei de lado. Não é uma página estática: muda quando o meu setup muda.';

export interface SetupItem {
  name: string;
  /** Official page; absent when there is no stable one to point at. */
  url?: string;
  /** The url is a Mercado Livre affiliate link: rendered with rel="sponsored". */
  affiliate?: boolean;
  /** Why it is here, in one or two sentences. */
  why: string;
  /** Keys that open it, from the Niri config (`Mod` written as Super). */
  shortcuts?: SetupShortcut[];
}

export interface SetupShortcut {
  keys: string;
  /** What the keys do, when the item has more than one shortcut. */
  label?: string;
}

export interface SetupLink {
  title: string;
  href: string;
}

export interface SetupSection {
  id: string;
  title: string;
  intro?: string;
  /** Turns the first occurrence of `text` in the intro into a link. */
  introLink?: { text: string; href: string };
  items: SetupItem[];
  /** "Veja também": published posts and site pages only, never drafts. */
  related?: SetupLink[];
}

export const SETUP_SECTIONS: SetupSection[] = [
  {
    id: 'hardware',
    title: 'Hardware',
    intro:
      'Os links do Mercado Livre são de afiliado: se você comprar por eles, eu recebo uma comissão, sem custo extra para você.',
    items: [
      {
        name: 'Dell Latitude 3450',
        url: 'https://meli.la/2XtgKqp',
        affiliate: true,
        why: 'O notebook de trabalho: Intel Core i5-1345U de 13ª geração, 32 GB de RAM, SSD WD SN740 de 1 TB e Intel Iris Xe. A tela de 14" em 1920x1080 fica como terceiro monitor.',
      },
      {
        name: 'LG ultrawide 34" (2560x1080)',
        url: 'https://meli.la/2SGG5nP',
        affiliate: true,
        why: 'Monitor ultrawide em 21:9 (o LG HDR WFHD).',
      },
      {
        name: 'MSI G272',
        url: 'https://meli.la/1WwJsLp',
        affiliate: true,
        why: 'Monitor de 27" em 1920x1080, ao lado do ultrawide.',
      },
      {
        name: 'iPad 11" (primeira geração)',
        url: 'https://support.apple.com/pt-br/111974',
        why: 'Uso como tela de suporte.',
      },
      {
        name: 'iPhone 12',
        url: 'https://support.apple.com/pt-br/111876',
        why: 'O celular do dia a dia.',
      },
      {
        name: 'Mesa ErgoDesk com regulagem de altura',
        url: 'https://www.ergodesk.com.br',
        why: 'Estrutura elétrica preta da ErgoDesk, comprada sem tampo, com um tampo feito sob medida.',
      },
      {
        name: 'Cadeira Comfy Aryan',
        url: 'https://www.comfy.com.br',
        why: 'Tela mesh preta, braço 4D e assento deslizante, na versão Relax.',
      },
      {
        name: 'AULA F75',
        url: 'https://meli.la/1bCTqew',
        affiliate: true,
        why: 'O teclado principal: mecânico, compacto, de layout 75%.',
      },
      {
        name: 'Keychron K2',
        url: 'https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard',
        why: 'O teclado secundário, também mecânico e de layout 75%.',
      },
      {
        name: 'Logitech MX Master 3S',
        url: 'https://meli.la/1gqJmJC',
        affiliate: true,
        why: 'O mouse principal.',
      },
      {
        name: 'Logitech MX Vertical',
        url: 'https://meli.la/2xmCMvP',
        affiliate: true,
        why: 'O mouse secundário, vertical, para variar a posição do pulso.',
      },
      {
        name: 'Sony WH-1000XM5',
        url: 'https://meli.la/2H5M9sr',
        affiliate: true,
        why: 'O headphone principal, com cancelamento de ruído.',
      },
      {
        name: 'Logitech Zone Vibe 100',
        url: 'https://meli.la/1qUTCvu',
        affiliate: true,
        why: 'O segundo headphone, leve e sem fio.',
      },
    ],
  },
  {
    id: 'sistema',
    title: 'Sistema',
    intro:
      'Depois de muitos anos entre Windows, macOS e distros base Ubuntu, o notebook roda CachyOS desde junho de 2026.',
    items: [
      {
        name: 'CachyOS',
        url: 'https://cachyos.org',
        why: 'Arch com kernel e pacotes otimizados. Vim do ZorinOS e de uns meses de Omarchy, e foi aqui que eu fiquei.',
      },
      {
        name: 'Niri',
        url: 'https://github.com/YaLTeR/niri',
        why: 'Compositor Wayland que organiza as janelas em colunas roláveis. Tenho atalho para quase tudo, e os apps de mensagem e música ficam em scratchpads que aparecem e somem com uma tecla.',
      },
      {
        name: 'Noctalia',
        url: 'https://github.com/noctalia-dev/noctalia',
        why: 'O shell inteiro: barra, launcher, notificações e tela de bloqueio. Tem sistema de plugins, e foi por ele que comecei a escrever os meus.',
        shortcuts: [{ keys: 'Ctrl+Space', label: 'launcher' }, { keys: 'Super+Alt+B', label: 'reinicia o shell' }],
      },
    ],
    related: [
      {
        title: 'Criei quatro plugins para o Noctalia 100% com IA no meu CachyOS',
        href: '/criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos',
      },
    ],
  },
  {
    id: 'terminal',
    title: 'Terminal e editor',
    items: [
      {
        name: 'Ghostty',
        url: 'https://ghostty.org',
        why: 'O terminal do dia a dia, com a seleção indo só para o clipboard primário, para colar com o botão do meio.',
        shortcuts: [{ keys: 'Super+Enter' }],
      },
      {
        name: 'Zsh com Oh My Zsh',
        url: 'https://ohmyz.sh',
        why: 'O shell de sempre, com os meus scripts de Git, de sistema e de utilidades versionados no repositório de dotfiles.',
      },
      {
        name: 'mise',
        url: 'https://mise.jdx.dev',
        why: 'Um gerenciador só para as versões de Node, Python e o resto. Substituiu nvm, pyenv e companhia.',
      },
      {
        name: 'RTK',
        url: 'https://github.com/rtk-ai/rtk',
        why: 'Um proxy de CLI que enxuga a saída dos comandos antes de chegar ao agente. Economiza contexto, com uma ressalva: ele corta listas longas, então para conferir algo de verdade eu chamo o binário direto.',
      },
      {
        name: 'btop',
        url: 'https://github.com/aristocratau/btop',
        why: 'Para ver o que está comendo CPU e memória quando os testes ou um build pesam.',
        shortcuts: [{ keys: 'Super+Alt+T' }],
      },
      {
        name: 'VS Code e Neovim',
        url: 'https://code.visualstudio.com',
        why: 'Os dois seguem configurados nos meus dotfiles, mas hoje a maior parte do código sai dos agentes.',
        shortcuts: [{ keys: 'Super+Shift+I', label: 'VS Code' }],
      },
    ],
  },
  {
    id: 'ia',
    title: 'IA e agentes',
    intro:
      'Trabalho em fluxo RPI (pesquisa, plano e implementação), com um agente para cada papel.',
    items: [
      {
        name: 'Claude Code',
        url: 'https://www.anthropic.com/claude-code',
        why: 'Conduz: pesquisa, escreve a spec e o plano, valida, revisa e commita. Por cima dele roda o meu framework de skills, regras, hooks e memória.',
        shortcuts: [{ keys: 'Super+Shift+Enter', label: 'abre num Ghostty novo' }],
      },
      {
        name: 'Grok CLI',
        url: 'https://github.com/xai-org/grok-build',
        why: 'Implementa as tarefas do plano, uma por vez, sem permissão para rodar git.',
      },
      {
        name: 'Antigravity CLI (agy)',
        url: 'https://antigravity.google',
        why: 'Revisa o diff de cada tarefa numa cópia descartável do repositório, como um segundo modelo ao lado da revisão do Claude Code.',
      },
      {
        name: 'Ollama e OpenCode',
        url: 'https://ollama.com',
        why: 'IA local, com o qwen2.5-coder rodando na própria máquina.',
      },
    ],
    related: [
      {
        title: 'Fluxo RPI com três agentes: o Claude Code planeja, o Grok implementa e o Codex revisa',
        href: '/fluxo-rpi-claude-code-grok-codex',
      },
      {
        title: 'Como construí meu site que conversa com IA via MCP',
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
        why: 'O navegador principal. Um script faz o Niri focar a janela dele quando um link abre de outro app.',
        shortcuts: [{ keys: 'Super+Shift+B' }, { keys: 'Super+Shift+Alt+B', label: 'anônimo' }],
      },
      {
        name: '1Password',
        url: 'https://1password.com',
        why: 'Senhas, chaves e segredos. É um dos dois apps que sobem sozinhos com a sessão, e o acesso rápido fica no Ctrl+Shift+Space.',
        shortcuts: [{ keys: 'Ctrl+Shift+Space', label: 'acesso rápido' }],
      },
      {
        name: 'Obsidian',
        url: 'https://obsidian.md',
        why: 'Anotações e documentação, num scratchpad do Niri.',
        shortcuts: [{ keys: 'Super+Shift+O' }],
      },
      {
        name: 'YouTube Music, Spotify, WhatsApp e Discord',
        url: 'https://music.youtube.com',
        why: 'Música e conversa, cada um no seu scratchpad do Niri. O Discord também recebe os avisos dos meus radares.',
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
        why: 'O player de vídeo padrão. Substituiu o VLC.',
      },
      {
        name: 'Steam e RetroArch',
        url: 'https://store.steampowered.com',
        why: 'Para jogar. O modo de jogo congela os apps de trabalho e liga o perfil de desempenho.',
        shortcuts: [{ keys: 'Super+Alt+G', label: 'modo de jogo' }],
      },
    ],
  },
  {
    id: 'homelab',
    title: 'Homelab',
    intro:
      'Um servidor em casa, acessado de qualquer lugar pelo Tailscale, com cada serviço num endereço .home.',
    introLink: { text: 'Um servidor em casa', href: '/meu-homelab-num-mac-mini-de-2018' },
    items: [
      {
        name: 'Mac mini (2018)',
        url: 'https://support.apple.com/pt-br/111912',
        why: 'O servidor, com um Core i3-8100B, rodando Linux.',
      },
      {
        name: 'CasaOS',
        url: 'https://casaos.zimaspace.com',
        why: 'O painel que instala e gerencia os apps em Docker do servidor.',
      },
      {
        name: 'Tailscale',
        url: 'https://tailscale.com',
        why: 'A rede privada que liga o notebook ao homelab de onde eu estiver. O SSH entra direto, com chave.',
      },
      {
        name: 'Pi-hole',
        url: 'https://pi-hole.net',
        why: 'DNS da casa: bloqueia anúncio e resolve os nomes .home dos serviços.',
      },
      {
        name: 'Caddy',
        url: 'https://caddyserver.com',
        why: 'O proxy reverso que põe cada container atrás de um nome. A homologação deste site mora atrás dele.',
      },
      {
        name: 'Jellyfin e Swing Music',
        url: 'https://jellyfin.org',
        why: 'Filmes, séries e a minha biblioteca de música, servidos de casa.',
      },
      {
        name: 'Samba',
        url: 'https://www.samba.org',
        why: 'Compartilha uma pasta de arquivos com a rede de casa.',
      },
      {
        name: 'Uptime Kuma',
        url: 'https://github.com/louislam/uptime-kuma',
        why: 'Avisa quando algum serviço da casa cai.',
      },
    ],
  },
  {
    id: 'feito-por-mim',
    title: 'Feito por mim',
    intro: 'Quando não achei a ferramenta, escrevi. Todas abertas, com o case no laboratório.',
    items: [
      {
        name: 'Daybar',
        url: 'https://github.com/nandomoreirame/noctalia-daybar',
        why: 'Captura rápida, agenda do Google Calendar, timer de foco, favoritos e anotações em Markdown, na barra do Noctalia.',
        shortcuts: [{ keys: 'Super+Space', label: 'captura rápida' }, { keys: 'Super+Shift+Space', label: 'painel' }],
      },
      {
        name: 'AI Bar',
        url: 'https://github.com/nandomoreirame/noctalia-aibar',
        why: 'Quanto do plano do Claude Code e do Grok já foi usado, e o ritmo de uso de cada janela.',
      },
      {
        name: 'Gistbar',
        url: 'https://github.com/nandomoreirame/noctalia-gistbar',
        why: 'Busca, cópia e criação dos meus gists do GitHub, pelo teclado.',
        shortcuts: [{ keys: 'Super+G', label: 'busca' }, { keys: 'Super+Ctrl+G', label: 'novo gist' }],
      },
      {
        name: 'Desktop Sticky Notes',
        url: 'https://github.com/nandomoreirame/noctalia-desktop-sticky-notes',
        why: 'Post-its em Markdown presos na área de trabalho.',
      },
      {
        name: 'Forja',
        url: 'https://github.com/nandomoreirame/forja',
        why: 'Cliente desktop que reúne Claude Code, Codex e Gemini numa interface só.',
      },
    ],
    related: [{ title: 'Todos os projetos no laboratório', href: '/lab' }],
  },
  {
    id: 'deixei-de-lado',
    title: 'Testei e deixei de lado',
    items: [
      {
        name: 'Omarchy',
        url: 'https://omarchy.org',
        why: 'A distro do DHH, com Hyprland. Usei por uns meses antes de chegar ao CachyOS.',
      },
      {
        name: 'Model Usage',
        url: 'https://github.com/noctalia-dev/noctalia-plugins/tree/main/model-usage',
        why: 'Plugin do Noctalia para o uso dos modelos de IA. Usei por meses, até escrever o AI Bar.',
      },
      {
        name: 'Gemini no fluxo de implementação',
        url: 'https://gemini.google.com',
        why: 'Fazia a validação final das tarefas. Saiu porque o plano gratuito era frágil demais: limite de requisições estourando no meio da execução.',
      },
      {
        name: 'Codex',
        url: 'https://github.com/openai/codex',
        why: 'Começou commitando, até receber uma lista com um arquivo e fazer cinco commits. Passou a só revisar o diff em sandbox somente leitura, e depois saiu do fluxo RPI, que hoje é o Claude Code, o Grok e o agy.',
      },
      {
        name: 'TickTick',
        url: 'https://ticktick.com',
        why: 'App de tarefas que ficava num scratchpad do Niri, no Super+Shift+T. Saiu do autostart e depois da rotina.',
      },
      {
        name: 'VLC',
        url: 'https://www.videolan.org',
        why: 'Trocado pelo mpv como player padrão.',
      },
    ],
  },
];

/** The same content as the page, for the AI view (/setup.md). */
export const setupMarkdown = ({ site }: { site: URL }): string => {
  const lines: string[] = [
    '---',
    'title: Setup',
    `url: ${absoluteUrl(site, SETUP_PATH)}`,
    `updated: ${SETUP_UPDATED_AT}`,
    '---',
    '',
    '# O que eu uso',
    '',
    SETUP_LEAD,
    '',
  ];

  for (const section of SETUP_SECTIONS) {
    lines.push(`## ${section.title}`, '');
    if (section.intro) {
      const link = section.introLink;
      const intro = link
        ? section.intro.replace(link.text, `[${link.text}](${absoluteUrl(site, link.href)})`)
        : section.intro;
      lines.push(intro, '');
    }
    for (const item of section.items) {
      const name = item.url ? `[${item.name}](${item.url})` : item.name;
      const keys = (item.shortcuts ?? [])
        .map((shortcut) => (shortcut.label ? `\`${shortcut.keys}\` (${shortcut.label})` : `\`${shortcut.keys}\``))
        .join(', ');
      const label = (item.shortcuts?.length ?? 0) > 1 ? 'Atalhos' : 'Atalho';
      lines.push(`- ${name}: ${item.why}${keys ? ` ${label}: ${keys}.` : ''}`);
    }
    lines.push('');
    if (section.related?.length) {
      lines.push('Veja também:', '');
      for (const link of section.related) lines.push(`- [${link.title}](${absoluteUrl(site, link.href)})`);
      lines.push('');
    }
  }

  return lines.join('\n');
};
