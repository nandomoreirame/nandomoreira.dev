import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';
import { COLLECTION_BLOCKS, blocksOf, collectionOfBlock } from '../../src/lib/catalog/groups';

describe('catalogue collections', () => {
  it('splits the archive into portfolio and lab', () => {
    expect(Object.keys(COLLECTION_BLOCKS)).toEqual(['portfolio', 'lab']);
  });

  it('puts client work in portfolio', () => {
    // The split is client versus own product. It used to be ai-product +
    // professional, which put two self-made SaaS in portfolio and a third in
    // lab with nothing separating them.
    expect(blocksOf('portfolio')).toEqual(['professional']);
  });

  it('puts own products, tooling and systems in lab', () => {
    expect(blocksOf('lab')).toEqual(['ai-tooling', 'ai-product', 'systems-cli']);
  });

  it('keeps every own-product block out of portfolio', () => {
    expect(collectionOfBlock('ai-product')).toBe('lab');
  });

  it('assigns every block to exactly one collection', () => {
    const assigned = [...blocksOf('portfolio'), ...blocksOf('lab')].sort();
    expect(assigned).toEqual([...BLOCKS].sort());
  });

  it('resolves the collection of a block', () => {
    expect(collectionOfBlock('ai-tooling')).toBe('lab');
    expect(collectionOfBlock('professional')).toBe('portfolio');
  });
});
