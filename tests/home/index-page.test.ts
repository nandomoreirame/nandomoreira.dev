import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/index.astro', 'utf8');

describe('home page assembly', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(page).toContain('getAllProjects');
    expect(page).toContain('getProfile');
    expect(page).toContain('getAllPosts');
    expect(page).not.toContain('getCollection(');
  });

  it('places the sections in the order the home now declares', () => {
    const order = [
      'Hero',
      'LatestPosts',
      'NewsletterCard',
      'Trajectory',
      'Services',
    ];
    const positions = order.map((name) => page.lastIndexOf(`<${name}`));

    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('puts a quiet newsletter card under the recent posts, posting back to the home', () => {
    expect(page).toMatch(/<NewsletterCard outcome=\{outcome\} quiet returnTo="\/" \/>/);
    expect(page).toContain("outcomeOf(Astro.url.searchParams.get('assinatura'))");
  });

  it('leaves portfolio and lab to their own listings', () => {
    expect(page).not.toContain('<CollectionSection');
  });

  it('embeds the Person structured data', () => {
    expect(page).toContain('application/ld+json');
    expect(page).toContain('personLd');
  });

  it('drops the placeholder noindex now that the content is real', () => {
    expect(page).not.toContain('noindex');
  });

  it('no longer mounts the home About or Contact sections', () => {
    expect(page).not.toContain('<About');
    expect(page).not.toContain('<Contact');
  });

  it('feeds LatestPosts the three newest posts and the site origin', () => {
    expect(page).toContain('const recentPosts = latestPosts(allPosts, 3);');
    expect(page).toContain('<LatestPosts posts={recentPosts} site={site} />');
    expect(page).not.toContain('latestPosts(allPosts, 4)');
  });
});
