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

describe('systems-cli label', () => {
  // The block holds Rust, Python and QML (CLIs, TUIs and Noctalia plugins);
  // naming languages made the label wrong for half of it (2026-10-09).
  it('describes the group without naming languages', () => {
    expect(BLOCK_LABELS['systems-cli']).toBe('CLI, automação e desktop Linux');
    expect(BLOCK_LABELS['systems-cli']).not.toMatch(/Rust|Go\b|Python|QML/);
  });
});
