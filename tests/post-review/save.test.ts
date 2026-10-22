import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveReview } from '../../src/lib/post-review/save';

let root = '';
const now = () => new Date('2026-10-21T15:00:00.000Z');

const annotation = (quote: string, start: number) => ({
  quote,
  prefix: '',
  suffix: '',
  section: null,
  request: 'troca',
  replacement: '',
  start,
  end: start + quote.length,
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'post-review-save-'));
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/posts/meu-post.md'),
    '---\ntitle: "Meu post"\n---\n\nPrimeira frase.\n\nSegunda frase.\n',
  );
});

describe('saveReview', () => {
  it('writes the review in text order, with the probable lines', () => {
    const result = saveReview(
      { slug: 'meu-post', annotations: [annotation('Segunda frase', 40), annotation('Primeira frase', 5)] },
      root,
      now,
    );

    expect(result).toEqual({ ok: true, path: 'docs/post-reviews/meu-post.md' });
    const written = readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8');
    expect(written).toContain('# Revisão: Meu post');
    expect(written).toContain('- Gerada em: 2026-10-21T15:00:00.000Z');
    expect(written.indexOf('## 1. Abertura, linha 5')).toBeGreaterThan(-1);
    expect(written.indexOf('## 2. Abertura, linha 7')).toBeGreaterThan(written.indexOf('## 1.'));
  });

  it('overwrites the previous review', () => {
    saveReview({ slug: 'meu-post', annotations: [annotation('Primeira frase', 5)] }, root, now);
    saveReview({ slug: 'meu-post', annotations: [annotation('Segunda frase', 40)] }, root, now);
    const written = readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8');
    expect(written).toContain('- Anotações: 1');
    expect(written).not.toContain('Primeira frase');
  });

  it('writes the same bytes when the same payload is saved twice', () => {
    const payload = { slug: 'meu-post', annotations: [annotation('Primeira frase', 5)] };
    saveReview(payload, root, now);
    const first = readFileSync(join(root, 'docs/post-reviews/meu-post.md'));
    saveReview(payload, root, now);
    const second = readFileSync(join(root, 'docs/post-reviews/meu-post.md'));
    expect(Buffer.compare(first, second)).toBe(0);
  });

  it('leaves an unknown block in the post source untouched', () => {
    const sourcePath = join(root, 'src/content/posts/meu-post.md');
    const original = readFileSync(sourcePath, 'utf8');
    const injected = `${original}\n<!-- bloco que o revisor não entende -->\n`;
    writeFileSync(sourcePath, injected);
    const result = saveReview({ slug: 'meu-post', annotations: [annotation('Primeira frase', 5)] }, root, now);
    expect(result.ok).toBe(true);
    expect(readFileSync(sourcePath, 'utf8')).toBe(injected);
  });

  it('refuses an invalid payload without writing', () => {
    const result = saveReview({ slug: 'meu-post', annotations: [] }, root, now);
    expect(result.ok).toBe(false);
    expect(existsSync(join(root, 'docs/post-reviews'))).toBe(false);
  });

  it('refuses a slug without a post file', () => {
    const result = saveReview({ slug: 'outro-post', annotations: [annotation('x', 0)] }, root, now);
    expect(result).toEqual({ ok: false, reason: 'Post não encontrado: outro-post' });
    expect(existsSync(join(root, 'docs/post-reviews'))).toBe(false);
  });

  it('explains which field failed', () => {
    const result = saveReview(
      { slug: 'meu-post', annotations: [{ ...annotation('x', 0), request: '', replacement: '' }] },
      root,
      now,
    );
    expect(result).toEqual({ ok: false, reason: 'Escreva o pedido ou o texto novo' });
  });
});
