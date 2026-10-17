import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home section rules', () => {
  it('separates each section after the hero with a full-bleed SectionRule', () => {
    const source = readFileSync('src/pages/index.astro', 'utf8');
    const body = source.slice(source.indexOf('<Hero'));
    const sections = ['<LatestPosts', '<CollectionSection\n    collection="portfolio"', '<CollectionSection collection="lab"', '<Trajectory', '<Services', '<AgentBrief'];
    expect(body.match(/<SectionRule \/>/g)).toHaveLength(sections.length);
    for (const section of sections) {
      const before = body.slice(0, body.indexOf(section)).trimEnd();
      expect(before.endsWith('<SectionRule />')).toBe(true);
    }
  });
});
