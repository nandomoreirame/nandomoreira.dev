import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

/**
 * The code themes are Terminal Noir's own Shiki port, copied in (theme-modes,
 * REQ-007, REQ-013). The copy must match its source whenever the sibling repo is
 * checked out; in CI it is not, so that check is skipped with its reason.
 */
const FILES = ['terminal-noir.json', 'terminal-noir-paper.json'] as const;
const LOCAL = 'src/lib/code/themes';
const SOURCE = '../terminalnoir/ports/shiki';

interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: Array<{ name: string; settings: { foreground?: string } }>;
}

const read = (file: string): Theme => JSON.parse(readFileSync(`${LOCAL}/${file}`, 'utf8'));

describe('Shiki themes from Terminal Noir', () => {
  it.each(FILES)('%s puts every token at AA on its own background', file => {
    const theme = read(file);
    const background = theme.colors['editor.background']!;
    const tokens = theme.tokenColors.filter(token => token.settings.foreground);
    expect(tokens.length).toBeGreaterThan(10);
    for (const token of tokens) {
      expect(contrastRatio(token.settings.foreground!, background), `${file} ${token.name}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it('sits each theme on its site background', () => {
    expect(read('terminal-noir.json').colors['editor.background']!.toLowerCase()).toBe('#0b0b0c');
    expect(read('terminal-noir-paper.json').colors['editor.background']!.toLowerCase()).toBe('#fbfaf7');
  });

  it.skipIf(!existsSync(SOURCE))('matches the Terminal Noir port byte for byte (REQ-013)', () => {
    for (const file of FILES) {
      expect(readFileSync(`${LOCAL}/${file}`, 'utf8'), file).toBe(readFileSync(`${SOURCE}/${file}`, 'utf8'));
    }
  });
});
