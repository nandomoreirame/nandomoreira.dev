import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { techIconFor } from '../../src/lib/ui/tech-icons';

const simpleIcons = JSON.parse(
  readFileSync('node_modules/@iconify-json/simple-icons/icons.json', 'utf8'),
) as { icons: Record<string, unknown> };

const declaredTech = (): string[] => {
  const dir = 'src/content/projects';
  const names = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const front = readFileSync(`${dir}/${file}`, 'utf8').split('---')[1] ?? '';
    const block = front.match(/^tech:\n((?:\s+- .+\n?)+)/m)?.[1] ?? '';
    for (const line of block.split('\n')) {
      const name = line.replace(/^\s+- /, '').replace(/^["']|["']$/g, '').trim();
      if (name) names.add(name);
    }
  }
  return [...names];
};

describe('techIconFor', () => {
  it('maps known stacks to a simple-icons name', () => {
    expect(techIconFor('TypeScript')).toBe('simple-icons:typescript');
    expect(techIconFor('Next.js')).toBe('simple-icons:nextdotjs');
    expect(techIconFor('Node.js')).toBe('simple-icons:nodedotjs');
    expect(techIconFor('AWS')).toBe('simple-icons:amazonwebservices');
    expect(techIconFor('Google Cloud')).toBe('simple-icons:googlecloud');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(techIconFor('  rust ')).toBe('simple-icons:rust');
  });

  it('returns undefined for concepts without a logo', () => {
    expect(techIconFor('DDD')).toBeUndefined();
    expect(techIconFor('Arquitetura hexagonal')).toBeUndefined();
    expect(techIconFor('IA generativa')).toBeUndefined();
  });

  it('only points at icons that exist in the installed set', () => {
    for (const name of [...declaredTech(), 'Astro', 'Go', 'AWS', 'Google Cloud']) {
      const icon = techIconFor(name);
      if (icon) expect(simpleIcons.icons, icon).toHaveProperty(icon.replace('simple-icons:', ''));
    }
  });

  it('covers the profile stack', () => {
    const profile = readFileSync('src/content/profile/profile.md', 'utf8');
    const stack = profile.match(/^stack:\n((?:\s+- .+\n?)+)/m)?.[1] ?? '';
    const names = stack.split('\n').map((l) => l.replace(/^\s+- /, '').trim()).filter(Boolean);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(techIconFor(name), name).toBeDefined();
  });
});
