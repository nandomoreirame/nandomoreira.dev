import { describe, expect, it } from 'vitest';
import { getAllPostEntries, getPostEntry, getUpcomingPosts } from '../../src/lib/content';
import { readingMinutes } from '../../src/lib/posts/reading-time';
import { postPairs } from '../helpers/markdown-pairs';

/** [pt-BR slug, English slug], appended by each translation task. */
const TRANSLATED: [string, string][] = [
  ['o-falso-verde', 'the-false-green'],
  ['o-fone-mudo-e-o-jack-p2-no-pipewire', 'mute-headphones-for-78-days'],
  ['memoria-para-agentes-em-4-camadas', 'four-layer-memory-for-agents'],
  ['como-construi-meu-site-que-conversa-com-ia-via-mcp', 'site-that-talks-to-ai-via-mcp'],
  ['fluxo-rpi-claude-code-grok-codex', 'rpi-flow-with-three-agents'],
  ['rdo-solo-red-dead-online-sozinho-pelo-gateway', 'rdo-solo-alone-via-home-gateway'],
  ['sessoes-do-red-dead-online-p2p-relays-e-nat-duplo', 'red-dead-online-sessions-p2p-double-nat'],
  ['criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos', 'four-noctalia-plugins-with-ai'],
  ['analytics-sem-script-medindo-no-servidor-e-lendo-no-terminal', 'analytics-without-browser-javascript'],
  ['job-radar-radar-de-vagas-em-python-puro', 'job-radar-pure-python'],
  ['de-cinco-dias-para-trinta-minutos', 'five-days-to-thirty-minutes'],
  ['scratchpad-no-niri-janelas-que-somem-com-um-atalho', 'niri-scratchpad-windows-vanish'],
  ['espanso-substituicao-de-texto-no-linux', 'espanso-text-replacement-on-linux'],
  ['game-mode-congelando-o-trabalho-com-o-cgroup-freezer', 'game-mode-freezing-work-with-cgroup'],
  ['revisao-cruzada-entre-modelos', 'cross-model-review'],
  ['meu-homelab-num-mac-mini-de-2018', 'homelab-on-a-2018-mac-mini'],
  ['sessao-de-agente-que-voltava-zerada', 'agent-session-that-came-back-empty'],
  ['tratando-dotfiles-como-software', 'treating-dotfiles-as-software'],
  ['meus-scripts-de-gitflow-de-31-linhas-a-uma-skill', 'gitflow-scripts-to-a-skill'],
  ['seu-sistema-tem-memoria-por-que-manter-um-dotfiles', 'dotfiles-from-symlink-to-reinstall'],
  ['scripts-que-automatizam-meu-linux', 'automate-your-own-problems'],
  ['terminal-noir-o-tema-do-meu-site-no-sistema-inteiro', 'terminal-noir-theme-across-my-system'],
  ['tiling-dinamico-ou-janelas-sobrepostas', 'dynamic-tiling-or-stacked-windows'],
  ['paleta-de-comandos-ctrl-k-no-meu-site', 'command-palette-ctrl-k'],
  ['meu-harness-de-ia-com-rpi', 'ai-harness-with-rpi'],
  ['aeo-vs-seo-sera-que-o-seo-morreu', 'aeo-vs-seo-is-seo-dead'],
  ['comentarios-no-blog-sem-pesar-a-pagina', 'blog-comments-without-page-weight'],
  ['gravar-a-tela-e-virar-gif-com-um-atalho', 'screen-recording-to-gif-shortcut'],
  ['meu-site-esta-na-versao-17', 'site-is-on-version-17'],
  ['noctalia-v4-para-v5-com-os-dois-shells-ligados', 'noctalia-v4-to-v5-both-shells'],
  ['o-designer-de-ia-pos-a-regra-de-negocio-no-texto', 'ai-designer-put-rules-in-copy'],
  ['sete-rodadas-de-revisao-quando-parar', 'seven-review-rounds-when-to-stop'],
  ['um-repositorio-de-skills-para-quatro-agentes', 'skills-repo-for-four-agents'],
];

const bodiesBySlug = new Map(
  postPairs().flatMap(({ pt, en }) => [[pt.field('slug')!, pt.body] as const, [en.field('slug')!, en.body] as const]),
);

describe('translated posts', () => {
  it.each(TRANSLATED)('%s is served as /en/%s with the source structure', async (ptSlug, enSlug) => {
    const [pt, en] = await Promise.all([getPostEntry(ptSlug), getPostEntry(enSlug, 'en')]);

    // Drafts are hidden in Vitest/production (SHOW_DRAFTS=false). C2: inherit
    // draft from the source, keep them out of public listings, still check length.
    if (!pt && !en) {
      const [upcomingPt, upcomingEn] = await Promise.all([getUpcomingPosts(), getUpcomingPosts('en')]);
      const src = upcomingPt.find(post => post.slug === ptSlug);
      const overlay = upcomingEn.find(post => post.slug === enSlug);
      expect(src).toBeDefined();
      expect(overlay).toBeDefined();
      expect(overlay!.draft).toBe(true);
      expect(overlay!.draft).toBe(src!.draft);
      expect(overlay!.date).toBe(src!.date);
      expect(overlay!.art).toBe(src!.art);
      const ratio = readingMinutes(bodiesBySlug.get(enSlug) ?? '') / readingMinutes(bodiesBySlug.get(ptSlug) ?? '');
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.4);
      return;
    }

    expect(en).toBeDefined();
    expect(en!.data.date).toBe(pt!.data.date);
    expect(en!.data.draft).toBe(pt!.data.draft);
    expect(en!.data.art).toBe(pt!.data.art);
    // A faithful translation has about the same length (catches a dropped section).
    const ratio = readingMinutes(en!.body ?? '') / readingMinutes(pt!.body ?? '');
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.4);
  });

  it('drafts stay out of the production English listing', async () => {
    for (const entry of await getAllPostEntries('en')) expect(entry.data.draft).toBe(false);
  });
});
