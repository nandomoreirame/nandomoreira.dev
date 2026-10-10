import type { Block } from '../../content/blocks';

export type CatalogCollection = 'portfolio' | 'lab';

/**
 * Regrouping only: the four blocks stay exactly as cadastred. Since
 * 2026-10-10 the split is product in production (own SaaS and client work)
 * versus open-source tooling. `ai-product` moved as a whole block, so no SaaS
 * is left in the lab with nothing distinguishing it from the others.
 */
export const COLLECTION_BLOCKS = {
  portfolio: ['ai-product', 'professional'],
  lab: ['ai-tooling', 'systems-cli'],
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
