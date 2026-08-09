/**
 * The four blocks of the archive, in positioning order.
 * Alphabetical order would put ai-product before ai-tooling, inverting the
 * hierarchy the BRIEF wants to communicate.
 */
export const BLOCKS = [
  'ai-tooling',
  'ai-product',
  'systems-cli',
  'professional',
] as const;

export type Block = (typeof BLOCKS)[number];

export const BLOCK_LABELS: Record<Block, string> = {
  'ai-tooling': 'Ferramental de AI coding',
  'ai-product': 'Produtos SaaS com IA',
  'systems-cli': 'Sistemas e CLI em Rust e Go',
  professional: 'Trabalho profissional e de cliente',
};
