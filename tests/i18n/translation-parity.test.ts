import { describe, expect, it } from 'vitest';
import { englishHref, internalLinks } from '../../src/lib/i18n/links';
import { markdownIn, postPairs } from '../helpers/markdown-pairs';
import { ptLeftovers } from '../helpers/pt-leftovers';

const fences = (body: string) => body.match(/(```|~~~)[\s\S]*?\1/g) ?? [];
const headings = (body: string) =>
  body
    .replace(/(```|~~~)[\s\S]*?\1/g, '')
    .match(/^#{2,3} /gm)
    ?.map(mark => mark.trim()) ?? [];
const images = (body: string) => [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map(match => match[1]);
const externalLinks = (body: string) =>
  [...body.replace(/(```|~~~)[\s\S]*?\1/g, '').matchAll(/(?<!!)\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)]
    .map(match => match[1]!)
    .filter(href => !/nandomoreira\.dev/.test(href))
    .sort();
const prose = (text: string) => text.replace(/(```|~~~)[\s\S]*?\1/g, ' ').replace(/`[^`]*`/g, ' ');

const pairs = postPairs();
// Pairs known at test time, for the internal-link rule (REQ-010).
const linkPairs = pairs.map(({ pt, en }) => ({ 'pt-BR': `/${pt.field('slug')}`, en: `/en/${en.field('slug')}` }));

describe.each(pairs.map(pair => [pair.en.file, pair] as const))('%s', (_file, { pt, en }) => {
  it('has the same headings (REQ-007)', () => {
    expect(headings(en.body)).toEqual(headings(pt.body));
  });

  it('has byte-identical code blocks (REQ-007)', () => {
    expect(fences(en.body)).toEqual(fences(pt.body));
  });

  it('has the same images in the same order (REQ-007)', () => {
    expect(images(en.body)).toEqual(images(pt.body));
  });

  it('links the same external pages (REQ-007)', () => {
    expect(externalLinks(en.body)).toEqual(externalLinks(pt.body));
  });

  it('uses no em or en dash outside code (REQ-008)', () => {
    expect(prose(en.body + en.frontmatter)).not.toMatch(/[–—]/);
  });

  it('leaves no Portuguese behind (REQ-009)', () => {
    const words = ptLeftovers(`<p>${prose(en.body + en.frontmatter)}</p>`);
    expect(words.length, `Portuguese words: ${words.join(', ')}`).toBeLessThanOrEqual(3);
  });

  it('points internal links at the English pair when one exists (REQ-010)', () => {
    for (const href of internalLinks(en.body)) expect(href).toBe(englishHref(href, linkPairs));
  });
});

describe('English case files', () => {
  // Vitest 3 fails a suite whose it.each table is empty; keep a no-op until the
  // first English case lands (i18n-content translations).
  const files = markdownIn('src/content/projects-en');
  if (files.length === 0) {
    it('has nothing to check yet', () => {
      expect(files).toHaveLength(0);
    });
  } else {
    it.each(files.map(file => [file.file, file] as const))('%s has no dash and no Portuguese left', (_file, file) => {
      expect(file.frontmatter).not.toMatch(/[–—]/);
      expect(ptLeftovers(`<p>${file.frontmatter}</p>`).length).toBeLessThanOrEqual(3);
    });
  }
});

describe('the gate itself', () => {
  it('can fail', () => {
    expect(fences('```a```')).not.toEqual(fences('```b```'));
    expect(ptLeftovers('<p>não você também então porque</p>').length).toBeGreaterThan(3);
  });
});
