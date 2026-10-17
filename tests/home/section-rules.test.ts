import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home section rules', () => {
  it('runs the hero straight into the posts, then separates every later section with a SectionRule', () => {
    const source = readFileSync('src/pages/index.astro', 'utf8');
    const body = source.slice(source.indexOf('<Hero'));
    const heroEnd = body.indexOf('/>') + 2;
    expect(body.slice(heroEnd).trimStart().startsWith('<LatestPosts')).toBe(true);

    const sections = ['<CollectionSection\n    collection="portfolio"', '<CollectionSection collection="lab"', '<Trajectory', '<Services', '<AgentBrief'];
    expect(body.match(/<SectionRule \/>/g)).toHaveLength(sections.length);
    for (const section of sections) {
      const before = body.slice(0, body.indexOf(section)).trimEnd();
      expect(before.endsWith('<SectionRule />')).toBe(true);
    }
  });
});
