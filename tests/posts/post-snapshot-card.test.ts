import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostSnapshot from '../../src/components/posts/PostSnapshot.astro';

const snapshot = {
  version: 'v0.1.9',
  items: [
    { label: 'OS', value: 'CachyOS Linux' },
    { label: 'Compositor', value: 'Niri' },
  ],
};
const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(PostSnapshot, { props });

describe('PostSnapshot', () => {
  it('heads the card with the accent label and the version', async () => {
    const html = await render({ snapshot });
    expect(html).toMatch(
      /<span[^>]*text-primary[^>]*>\s*<span aria-hidden="true">\/\/ <\/span>stack snapshot\s*<\/span>/,
    );
    expect(html).toContain('v0.1.9');
  });

  it('lists every pair as a description list, in order', async () => {
    const html = await render({ snapshot });
    expect(html).toMatch(
      /<dl[\s\S]*<dt[^>]*>OS:<\/dt>\s*<dd[^>]*>CachyOS Linux<\/dd>[\s\S]*<dt[^>]*>Compositor:<\/dt>\s*<dd[^>]*>Niri<\/dd>/,
    );
  });

  it('omits the version when there is none, and leaves the page in reading mode', async () => {
    const html = await render({ snapshot: { items: snapshot.items } });
    expect(html).not.toContain('v0.1.9');
    expect(html).toContain('data-reader-hide');
  });
});
