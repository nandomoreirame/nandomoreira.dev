import type { Block } from '../../content/blocks';

export type CatalogCollection = 'portfolio' | 'lab';

/**
 * Regrouping only: the four blocks stay exactly as cadastred. The split is
 * client work versus own product. `ai-product` moved to lab in 2026-08 because
 * the earlier split left two self-made SaaS in portfolio and a third in lab,
 * with nothing distinguishing them.
 */
export const COLLECTION_BLOCKS = {
  portfolio: ['professional'],
  lab: ['ai-tooling', 'ai-product', 'systems-cli'],
} as const satisfies Record<CatalogCollection, readonly Block[]>;

export const COLLECTION_LABELS: Record<CatalogCollection, string> = {
  portfolio: 'Portfólio',
  lab: 'Laboratório',
};

export const blocksOf = (collection: CatalogCollection): readonly Block[] =>
  COLLECTION_BLOCKS[collection];

export const collectionOfBlock = (block: Block): CatalogCollection =>
  (Object.keys(COLLECTION_BLOCKS) as CatalogCollection[]).find((collection) =>
    (COLLECTION_BLOCKS[collection] as readonly Block[]).includes(block),
  )!;
