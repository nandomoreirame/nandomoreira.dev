import { describe, expect, it } from 'vitest';
import { visibleLinks } from '../../src/lib/catalog/links';

describe('visibleLinks', () => {
  it('shows both links when the project has both', () => {
    const links = visibleLinks({
      repoUrl: 'https://github.com/x/y',
      liveUrl: 'https://y.app',
    });

    expect(links.map((link) => link.kind)).toEqual(['repo', 'live']);
  });

  it('omits the repo link entirely when the repository is private', () => {
    const links = visibleLinks({ repoUrl: null, liveUrl: 'https://y.app' });

    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('live');
  });

  it('omits the live link when there is no deployed version', () => {
    const links = visibleLinks({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('repo');
  });

  it('never emits an entry with an empty href, which would render a dead anchor', () => {
    const links = visibleLinks({ repoUrl: null, liveUrl: 'https://y.app' });

    for (const link of links) {
      expect(link.href).toBeTruthy();
    }
  });

  it('treats undefined the same as null', () => {
    expect(visibleLinks({ repoUrl: undefined, liveUrl: 'https://y.app' })).toHaveLength(1);
  });

  it('labels each link with meaningful text, never "clique aqui"', () => {
    const links = visibleLinks({
      repoUrl: 'https://github.com/x/y',
      liveUrl: 'https://y.app',
    });

    expect(links.map((link) => link.label)).toEqual(['Ver repositório', 'Ver no ar']);
  });
});
