import { describe, expect, it } from 'vitest';
import { getAllPostEntries, getPostEntry } from '../../src/lib/content';
import { readingMinutes } from '../../src/lib/posts/reading-time';

/** [pt-BR slug, English slug], appended by each translation task. */
const TRANSLATED: [string, string][] = [
  ['o-falso-verde', 'the-false-green'],
  ['o-fone-mudo-e-o-jack-p2-no-pipewire', 'mute-headphones-for-78-days'],
  ['memoria-para-agentes-em-4-camadas', 'four-layer-memory-for-agents'],
  ['como-construi-meu-site-que-conversa-com-ia-via-mcp', 'site-that-talks-to-ai-via-mcp'],
  ['fluxo-rpi-claude-code-grok-codex', 'rpi-flow-with-three-agents'],
  ['rdo-solo-red-dead-online-sozinho-pelo-gateway', 'rdo-solo-alone-via-home-gateway'],
  ['sessoes-do-red-dead-online-p2p-relays-e-nat-duplo', 'red-dead-online-sessions-p2p-double-nat'],
];

describe('translated posts', () => {
  it.each(TRANSLATED)('%s is served as /en/%s with the source structure', async (ptSlug, enSlug) => {
    const [pt, en] = await Promise.all([getPostEntry(ptSlug), getPostEntry(enSlug, 'en')]);
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
