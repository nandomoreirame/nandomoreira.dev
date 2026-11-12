import { describe, expect, it } from 'vitest';
import { ptLeftovers } from './pt-leftovers';

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
