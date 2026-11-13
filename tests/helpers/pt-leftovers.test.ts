import { describe, expect, it } from 'vitest';
import { ptLeftovers, ptMarkerCount } from './pt-leftovers';

describe('ptLeftovers', () => {
  it('finds Portuguese words in visible text', () => {
    expect(ptLeftovers('<p>Ver todos os posts</p><p>Não sei</p>')).toEqual(expect.arrayContaining(['todos', 'não']));
  });

  it('ignores tags, attributes, scripts, styles and code', () => {
    const html =
      '<a href="/sobre" title="não">About</a><script>const você = 1</script><style>.não{}</style><code>para</code><pre>com</pre>';
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('ignores the allowlisted proper names', () => {
    expect(ptLeftovers('<p>Fernando Moreira Costa lives in São Paulo</p>')).toEqual([]);
  });

  it('passes clean English', () => {
    expect(ptLeftovers('<p>See all posts in the blog</p>')).toEqual([]);
  });
});

describe('ptMarkerCount', () => {
  it('counts repeated markers, not distinct types (REQ-009)', () => {
    expect(ptMarkerCount('<p>para para para para</p>')).toBe(4);
    expect(ptLeftovers('<p>para para para para</p>')).toEqual(['para']);
  });

  it('still ignores allowlisted names and non-visible text', () => {
    expect(ptMarkerCount('<p>Fernando Moreira Costa lives in São Paulo</p>')).toBe(0);
    expect(ptMarkerCount('<code>para para para para</code>')).toBe(0);
  });
});
