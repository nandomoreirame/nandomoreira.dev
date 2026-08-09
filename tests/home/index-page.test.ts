import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/index.astro', 'utf8');
const about = readFileSync('src/components/home/About.astro', 'utf8');

describe('home page assembly', () => {
  it('reads through the access layer, never through getCollection', () => {
    expect(page).toContain('getAllProjects');
    expect(page).toContain('getProfile');
    expect(page).not.toContain('getCollection(');
  });

  it('places the six sections in the order the PRD declares', () => {
    const order = ['Hero', 'CollectionSection', 'Trajectory', 'Services', 'About', 'Contact'];
    const positions = order.map((name) => page.lastIndexOf(`<${name}`));

    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('puts proof before offer: projects come before services', () => {
    expect(page.lastIndexOf('<FeaturedProjects')).toBeLessThan(
      page.lastIndexOf('<Services'),
    );
  });

  it('embeds the Person structured data', () => {
    expect(page).toContain('application/ld+json');
    expect(page).toContain('personLd');
  });

  it('drops the placeholder noindex now that the content is real', () => {
    expect(page).not.toContain('noindex');
  });

  it('links the about section to /sobre without duplicating the full bio', () => {
    expect(about).toContain('href="/sobre"');
    expect(about).not.toContain('{bio}');
  });
});
