import { describe, expect, it } from 'vitest';
import { BLOCKS, BLOCK_LABELS } from '../../src/content/blocks';

describe('archive blocks', () => {
  it('declares the four blocks from the PRD', () => {
    expect(BLOCKS).toEqual(['ai-tooling', 'ai-product', 'systems-cli', 'professional']);
  });

  it('keeps positioning order, not alphabetical order', () => {
    expect(BLOCKS.indexOf('ai-tooling')).toBeLessThan(BLOCKS.indexOf('ai-product'));
  });

  it('carries a human label in pt-BR for every block', () => {
    for (const block of BLOCKS) {
      expect(BLOCK_LABELS[block]).toBeTruthy();
    }
  });
});
