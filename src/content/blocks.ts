/**
 * The four blocks of the archive, in positioning order.
 * Alphabetical order would put ai-product before ai-tooling, inverting the
 * hierarchy the BRIEF wants to communicate.
 */
export const BLOCKS = ['ai-tooling', 'ai-product', 'systems-cli', 'professional'] as const;

export type Block = (typeof BLOCKS)[number];

export const BLOCK_LABELS: Record<Block, string> = {
  'ai-tooling': 'Ferramental de AI coding',
  'ai-product': 'Produtos SaaS',
  'systems-cli': 'CLI, automação e desktop Linux',
  professional: 'Trabalho profissional e de cliente',
};
