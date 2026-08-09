import type { Block } from '../../content/blocks';

export type CatalogCollection = 'portfolio' | 'lab';

/**
 * Regrouping only: the four blocks stay exactly as cadastred. Portfolio is
 * delivered work, lab is tooling and experiments.
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
