import { describe, expect, it } from 'vitest';
import { readingMinutes } from '../../src/lib/posts/reading-time';

const words = (n: number) => Array.from({ length: n }, () => 'palavra').join(' ');

describe('readingMinutes', () => {
  it('reads 200 words a minute, rounding up', () => {
    expect(readingMinutes(words(400))).toBe(2);
    expect(readingMinutes(words(401))).toBe(3);
  });

  it('never goes below one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('Oi.')).toBe(1);
  });

  it('skips fenced code blocks', () => {
    expect(readingMinutes(`${words(200)}\n\n\`\`\`ts\n${words(1000)}\n\`\`\`\n`)).toBe(1);
  });

  it('skips the frontmatter', () => {
    expect(readingMinutes(`---\ntitle: x\nsummary: ${words(1000)}\n---\n${words(200)}`)).toBe(1);
  });

  it('counts link text but not the URL, and ignores images', () => {
    const link = '[texto do link](https://exemplo.com/um/caminho/muito/longo) ';
    expect(readingMinutes(link.repeat(100))).toBe(2);
    expect(readingMinutes('![alt](/img.png) '.repeat(500))).toBe(1);
  });

  it('keeps hyphenated and accented words whole', () => {
    expect(readingMinutes('pré-normalização ação é '.repeat(67))).toBe(2);
  });
});
