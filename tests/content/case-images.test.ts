import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = 'src/content/projects';

/** Width and height from a WebP header (VP8X, VP8 or VP8L). */
export const webpSize = (bytes: Buffer): { width: number; height: number } => {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP file');
  }
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8 ') {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
};

// Read from disk, not through the collection, like the other content gates.
const images = readdirSync(DIR)
  .filter(file => file.endsWith('.md'))
  .flatMap(file => {
    const frontmatter = readFileSync(join(DIR, file), 'utf8').split(/^---$/m)[1] ?? '';
    return [...frontmatter.matchAll(/- src: (\S+)\n\s+alt: .+\n\s+width: (\d+)\n\s+height: (\d+)/g)].map(match => ({
      file,
      src: match[1],
      width: Number(match[2]),
      height: Number(match[3]),
    }));
  });

describe('case images', () => {
  it('finds the declared images', () => {
    expect(images.length).toBeGreaterThan(0);
  });

  it.each(images)('$src is a WebP under public/ with the declared size', ({ src, width, height }) => {
    expect(src).toMatch(/^\/lab\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/);
    const path = join('public', src);
    expect(existsSync(path)).toBe(true);
    expect(webpSize(readFileSync(path))).toEqual({ width, height });
  });

  it.each(images)('$src stays under 250 KB', ({ src }) => {
    expect(readFileSync(join('public', src)).length).toBeLessThan(250 * 1024);
  });
});
