import { describe, expect, it } from 'vitest';
import { webPageLd } from '../../src/lib/aeo/webpage-ld';

const site = new URL('https://nandomoreira.dev');

describe('webPageLd page types', () => {
  it('declares the about page a ProfilePage whose main entity is the Person', () => {
    const ld = webPageLd({ site, path: '/sobre', title: 'Sobre', description: 'D', type: 'ProfilePage' });
    expect(ld['@type']).toBe('ProfilePage');
    expect(ld.mainEntity).toEqual({ '@id': 'https://nandomoreira.dev/#person' });
  });

  it('declares a listing a CollectionPage with its items in order', () => {
    const ld = webPageLd({
      site,
      path: '/lab',
      title: 'Lab',
      description: 'D',
      type: 'CollectionPage',
      items: ['/lab/forja', '/lab/tumodori'],
    });
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.mainEntity).toEqual({
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: 'https://nandomoreira.dev/lab/forja' },
        { '@type': 'ListItem', position: 2, url: 'https://nandomoreira.dev/lab/tumodori' },
      ],
    });
  });

  it('stays a plain WebPage by default', () => {
    const ld = webPageLd({ site, path: '/setup', title: 'Setup', description: 'D' });
    expect(ld['@type']).toBe('WebPage');
    expect(ld).not.toHaveProperty('mainEntity');
  });
});
