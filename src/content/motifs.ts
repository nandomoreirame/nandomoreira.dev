/**
 * Art motifs a case may declare in its frontmatter (`art`). The type of
 * product picks the drawing, not the block: seven client cases share one
 * block and would otherwise share one drawing (docs/specs/generative-case-art,
 * amendment of 2026-10-08).
 */
export const ART_MOTIFS = [
  'orbit',
  'wave',
  'terminal',
  'flow',
  'chart',
  'storefront',
  'map',
  'wireframe',
  'play',
  'panels',
  'windows',
  'timer',
  'ascent',
  'mosaic',
  'timeline',
  'gantt',
  'calendar',
  'usage',
  'gists',
] as const;

export type ArtMotif = (typeof ART_MOTIFS)[number];
