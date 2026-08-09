import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';
import { COLLECTION_BLOCKS, blocksOf, collectionOfBlock } from '../../src/lib/catalog/groups';

describe('catalogue collections', () => {
  it('splits the archive into portfolio and lab', () => {
    expect(Object.keys(COLLECTION_BLOCKS)).toEqual(['portfolio', 'lab']);
  });

  it('puts delivered work in portfolio', () => {
    expect(blocksOf('portfolio')).toEqual(['ai-product', 'professional']);
  });

  it('puts tooling and systems in lab', () => {
    expect(blocksOf('lab')).toEqual(['ai-tooling', 'systems-cli']);
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
