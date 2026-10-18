import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FILES = [
  'public/servicos/projetos/encantos-brincantes.webp',
  'public/servicos/projetos/portfoliosnap.webp',
  'public/servicos/projetos/bragstack.webp',
  'public/servicos/projetos/mousai.webp',
  'public/servicos/fernando.webp',
];

describe('sales assets', () => {
  it.each(FILES)('%s is a real WebP under 300 KB', (file) => {
    const head = readFileSync(file).subarray(0, 12).toString('latin1');
    expect(head.startsWith('RIFF') && head.endsWith('WEBP')).toBe(true);
    expect(statSync(file).size).toBeLessThan(300 * 1024);
  });
});
