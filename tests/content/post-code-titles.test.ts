import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('code block titles', () => {
  it('names the scratchpad post blocks by the files the text names', () => {
    const md = readFileSync('src/content/posts/scratchpad-no-niri-janelas-que-somem-com-um-atalho.md', 'utf8');
    expect(md).toMatch(/^```kdl title="config\.kdl"$/m);
  });

  it('only uses the title="..." form, never a bare file name in the fence', () => {
    const md = readFileSync('src/content/posts/scratchpad-no-niri-janelas-que-somem-com-um-atalho.md', 'utf8');
    for (const fence of md.match(/^```\S+ .+$/gm) ?? []) {
      expect(fence).toMatch(/^```\S+ title="[^"]+"$/);
    }
  });
});
