import { describe, expect, it } from 'vitest';
import { markdownIn } from '../helpers/markdown-pairs';

/**
 * The content of 2026-11-12 that i18n-content translates (C8). A fixed list on
 * purpose: a post published later may live in pt-BR only (foundation D6), so
 * this guards the migration without forbidding that.
 */
const CASES = [
  'abracce',
  'amnesia-claude-code',
  'atelie-eh-pique',
  'bragstack',
  'coachbot-cli',
  'croonos',
  'data-insights-platform',
  'encantos-brincantes',
  'financial-normalization',
  'flipclock-app',
  'flipclock-screensaver-ascii',
  'forja',
  'forja-plugins',
  'grab-sh',
  'hypr-switcher',
  'job-radar',
  'mousai',
  'noctalia-aibar',
  'noctalia-daybar',
  'noctalia-desktop-sticky-notes',
  'noctalia-gistbar',
  'portfoliosnap',
  'rdo-solo',
  'seu-atelie-aqui',
  'sudadhara',
  'tumodori',
  'camilla-saboia',
  'terminal-noir',
];

const POSTS = [
  'o-falso-verde',
  'o-fone-mudo-e-o-jack-p2-no-pipewire',
  'como-construi-meu-site-que-conversa-com-ia-via-mcp',
  'fluxo-rpi-claude-code-grok-codex',
  'memoria-para-agentes-em-4-camadas',
  'sessao-de-agente-que-voltava-zerada',
  'rdo-solo-red-dead-online-sozinho-pelo-gateway',
  'criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos',
  'sessoes-do-red-dead-online-p2p-relays-e-nat-duplo',
  'analytics-sem-script-medindo-no-servidor-e-lendo-no-terminal',
  'job-radar-radar-de-vagas-em-python-puro',
  'de-cinco-dias-para-trinta-minutos',
  'scratchpad-no-niri-janelas-que-somem-com-um-atalho',
  'espanso-substituicao-de-texto-no-linux',
  'tratando-dotfiles-como-software',
  'meus-scripts-de-gitflow-de-31-linhas-a-uma-skill',
  'seu-sistema-tem-memoria-por-que-manter-um-dotfiles',
  'scripts-que-automatizam-meu-linux',
  'game-mode-congelando-o-trabalho-com-o-cgroup-freezer',
  'revisao-cruzada-entre-modelos',
  'meu-homelab-num-mac-mini-de-2018',
  'terminal-noir-o-tema-do-meu-site-no-sistema-inteiro',
  'tiling-dinamico-ou-janelas-sobrepostas',
  'paleta-de-comandos-ctrl-k-no-meu-site',
  'meu-harness-de-ia-com-rpi',
  'aeo-vs-seo-sera-que-o-seo-morreu',
  'comentarios-no-blog-sem-pesar-a-pagina',
  'gravar-a-tela-e-virar-gif-com-um-atalho',
  'meu-site-esta-na-versao-17',
  'noctalia-v4-para-v5-com-os-dois-shells-ligados',
  'o-designer-de-ia-pos-a-regra-de-negocio-no-texto',
  'sete-rodadas-de-revisao-quando-parar',
  'um-repositorio-de-skills-para-quatro-agentes',
];

const translated = (dir: string) => new Set(markdownIn(dir).map(file => file.field('translationOf')));

describe('initial translation coverage (REQ-012)', () => {
  it('lists 28 cases and the 33 non-archived posts of 2026-11-12', () => {
    expect(CASES).toHaveLength(28);
    expect(POSTS).toHaveLength(33);
  });

  it.each(CASES)('case %s is translated', slug => {
    expect(translated('src/content/projects-en').has(slug)).toBe(true);
  });

  it.each(POSTS)('post %s is translated', slug => {
    expect(translated('src/content/posts-en').has(slug)).toBe(true);
  });
});
