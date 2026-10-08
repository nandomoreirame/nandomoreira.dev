# Plano: Arte generativa dos cases

> **Spec:** `docs/specs/generative-case-art/SPEC.md`
> **Slug:** `generative-case-art` · **Criado:** 2026-10-07
> **Profundidade:** Deep (17 requisitos) — quatro lotes com dependência declarada
> **Tarefas:** 13

**Objetivo:** cada case ganha uma arte SVG única, gerada no build a partir do slug e do bloco, exibida num grid de cards em `/portfolio` e `/lab` e numa faixa no topo do case, com um efeito de ponteiro de no máximo 1,5 KB gzip.

**Arquitetura:** funções puras em `src/lib/art/` geram formas a partir de um gerador pseudoaleatório semeado pelo slug e as serializam em SVG colorido só por classes CSS ligadas a tokens. `PointerField.astro` é o único script do site: escreve `--gx`, `--gy`, `--mx` e `--my`, e o CSS faz o resto (grade de pontos mascarada e paralaxe por `--depth`). O portão `no-client-js.build-test.ts` passa a ler o HTML servido, porque o Astro embute o script inline.

**Stack:** Astro 7, Tailwind CSS 4, Vitest com `experimental_AstroContainer`, Node `zlib` para o orçamento.

**Complexidade estimada:** large.

---

## Fatos verificados antes de planejar

| Fato | Evidência |
|---|---|
| O Astro 7 **embute** um `<script>` pequeno de componente no HTML; nenhum `.js` vai para `dist/client/_astro` | Build de sonda numa cópia descartável: `_astro` sem `.js`, código presente em `dist/server/entry.mjs` |
| O portão atual só lê `dist/client/_astro` e deixaria esse script passar | `tests/design-system/no-client-js.build-test.ts:11` |
| Páginas de case são pré-renderizadas (`prerender = true`); `/portfolio` e `/lab` são SSR | `src/pages/lab/[slug].astro:9`, `src/pages/lab/index.astro` sem `prerender` |
| Card clicável precisa de borda perceptível (`border-strong`), nunca o token `border` | `tests/components/card-and-prose.test.ts:37` |
| `aspect-[...]` não é pego pelo portão de valor arbitrário, mas a proporção 21:9 fica em classe no arquivo de tokens, por clareza | `tests/design-system/no-ad-hoc-values.test.ts:43` |
| Hex é proibido fora de `src/styles/global.css`; `0x...` em TypeScript não casa o padrão `#...` | `tests/design-system/no-ad-hoc-values.test.ts:31` |
| A suíte unitária lê collections de `.astro/data-store.json`, que só é regravado no desligamento do `astro dev` | CLAUDE.md, "Armadilhas já pagas" |

## Ordem e dependências

```
Lote 1 (gerador)     T1 → T2 → T3          T4 (CSS) em paralelo
        │
        └─ bloqueia o lote 2 (componentes chamam generateArt)
Lote 2 (componentes) T5 → T6 → T7, T8
Lote 3 (portão)      T9 → T10              depende de T5 (marcador data-pointer-field)
Lote 4 (limpeza)     T11 → T12 → T13       depende de tudo
```

Antes de começar, se o conteúdo mudou desde o último `astro dev`, regrave o store:
`npx astro dev --port 4399` em background, `curl` em `/sobre` até responder, `npx astro dev stop`.

---

## Lote 1 — Gerador

### Task 1: Gerador pseudoaleatório semeado

**Requirement:** REQ-001, REQ-002
**Files:**
- Create: `src/lib/art/random.ts`
- Test: `tests/art/random.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer, type-safety-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { createRandom, hashString, intBetween } from '../../src/lib/art/random';

describe('hashString', () => {
  it('is the 32-bit FNV-1a hash, stable across runtimes', () => {
    expect(hashString('a')).toBe(0xe40c292c);
    expect(hashString('')).toBe(0x811c9dc5);
  });

  it('separates slugs that differ by one character', () => {
    expect(hashString('ai-tooling:forja')).not.toBe(hashString('ai-tooling:forje'));
  });
});

describe('createRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const first = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(first);
  });

  it('stays inside [0, 1)', () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('intBetween', () => {
  it('includes both ends', () => {
    const random = createRandom(1);
    const seen = new Set(Array.from({ length: 500 }, () => intBetween(random, 2, 4)));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/art/random.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/art/random'"

**Step 3: Write minimal implementation**
```ts
/** 32-bit FNV-1a: stable across runtimes and machines, no dependency. */
export const hashString = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export type Random = () => number;

/**
 * mulberry32. Seeded, so the same slug draws the same art on every build
 * (REQ-002). Math.random would make the page change between deploys.
 */
export const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const between = (random: Random, min: number, max: number): number =>
  min + random() * (max - min);

export const intBetween = (random: Random, min: number, max: number): number =>
  Math.floor(between(random, min, max + 1));
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/art/random.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 2: Quatro motivos e a serialização em SVG

**Requirement:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-015
**Depends on:** Task 1
**Files:**
- Create: `src/lib/art/motifs.ts`
- Create: `src/lib/art/index.ts`
- Test: `tests/art/generate.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development, frontend-design)
- Reviewers: test-reviewer, type-safety-reviewer, accessibility-guardrails

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';
import { ELEMENT_BUDGET, generateArt, heroCount, type ArtAspect } from '../../src/lib/art';

const ASPECTS: ArtAspect[] = ['card', 'banner'];
const shapesOf = (svg: string) => svg.match(/<(circle|line|rect)\b/g) ?? [];
const heroesOf = (svg: string) => svg.match(/class="art-hero\b/g) ?? [];

const cases = BLOCKS.flatMap((block) => ASPECTS.map((aspect) => ({ block, aspect })));

describe('generateArt', () => {
  it('draws the same markup for the same input, byte for byte', () => {
    const input = { slug: 'forja', block: 'ai-tooling', aspect: 'card' } as const;
    expect(generateArt(input)).toBe(generateArt(input));
  });

  it('gives each block its own motif', () => {
    const motifs = BLOCKS.map(
      (block) => generateArt({ slug: 'x', block, aspect: 'card' }).match(/data-motif="([a-z]+)"/)?.[1],
    );
    expect(motifs).toEqual(['orbit', 'wave', 'terminal', 'flow']);
  });

  it('varies the drawing with the slug inside the same block', () => {
    const a = generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' });
    const b = generateArt({ slug: 'amnesia', block: 'ai-tooling', aspect: 'card' });
    expect(a).not.toBe(b);
  });

  it.each(cases)('colours $block/$aspect only through classes, never hex or presentation attributes', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(svg).not.toMatch(/\s(fill|stroke)="/);
  });

  it.each(cases)('keeps amber on 10% to 20% of the $block/$aspect elements', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
    const ratio = heroesOf(svg).length / shapesOf(svg).length;
    expect(ratio).toBeGreaterThanOrEqual(0.1);
    expect(ratio).toBeLessThanOrEqual(0.2);
  });

  it.each(cases)('stays under the element budget for $block/$aspect', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
    expect(shapesOf(svg).length).toBeLessThanOrEqual(ELEMENT_BUDGET[aspect]);
    expect(shapesOf(svg).length).toBeGreaterThan(20);
  });

  it('is decorative, hidden from assistive technology and from the tab order', () => {
    const svg = generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' });
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('focusable="false"');
  });

  it('frames the card in 16:9 and the banner in 21:9', () => {
    expect(generateArt({ slug: 'x', block: 'ai-product', aspect: 'card' })).toContain('viewBox="0 0 160 90"');
    expect(generateArt({ slug: 'x', block: 'ai-product', aspect: 'banner' })).toContain('viewBox="0 0 210 90"');
  });

  it('splits the drawing into three depth layers for the parallax', () => {
    const svg = generateArt({ slug: 'x', block: 'professional', aspect: 'card' });
    expect(svg.match(/style="--depth:\d"/g)).toHaveLength(3);
  });
});

describe('heroCount', () => {
  it.each([20, 37, 64, 150, 300])('stays between 10% and 20% of %i', (total) => {
    expect(heroCount(total)).toBeGreaterThanOrEqual(Math.ceil(total * 0.1));
    expect(heroCount(total)).toBeLessThanOrEqual(Math.floor(total * 0.2));
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/art/generate.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/art'"

**Step 3: Write minimal implementation**

`src/lib/art/motifs.ts`:
```ts
import { between, intBetween, type Random } from './random';

/** 0 = far (moves least), 2 = near (moves most). */
export type Layer = 0 | 1 | 2;

/** `weight` ranks hero candidates: the highest-weighted shapes turn amber. */
interface Base {
  layer: Layer;
  weight: number;
}

export type Shape =
  | (Base & { kind: 'dot'; x: number; y: number; r: number })
  | (Base & { kind: 'ring'; x: number; y: number; r: number })
  | (Base & { kind: 'line'; x1: number; y1: number; x2: number; y2: number })
  | (Base & { kind: 'bar'; x: number; y: number; w: number; h: number });

export interface Frame {
  width: number;
  height: number;
}

export type Motif = (random: Random, frame: Frame) => Shape[];

/** ai-tooling: agents orbiting a coordinator. */
export const orbit: Motif = (random, { width, height }) => {
  const cx = width / 2 + between(random, -width * 0.12, width * 0.12);
  const cy = height / 2;
  const shapes: Shape[] = [{ kind: 'dot', x: cx, y: cy, r: 3.2, layer: 2, weight: 1 }];
  const rings = intBetween(random, 2, 4);

  for (let ring = 1; ring <= rings; ring += 1) {
    const radius = (height * 0.42 * ring) / rings;
    shapes.push({ kind: 'ring', x: cx, y: cy, r: radius, layer: 0, weight: 0 });
    const nodes = intBetween(random, 5, 9) + ring * 2;
    const phase = random() * Math.PI * 2;

    for (let node = 0; node < nodes; node += 1) {
      const angle = phase + (node / nodes) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      shapes.push({
        kind: 'dot',
        x,
        y,
        r: between(random, 0.8, 1.8),
        layer: ring === rings ? 2 : 1,
        weight: random() * 0.9,
      });
      if (random() < 0.35) {
        shapes.push({ kind: 'line', x1: cx, y1: cy, x2: x, y2: y, layer: 0, weight: 0.1 });
      }
    }
  }

  const dust = intBetween(random, 30, 50);
  for (let i = 0; i < dust; i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height, r: 0.4, layer: 0, weight: 0 });
  }
  return shapes;
};

/** ai-product: a signal, its crests the product moments. */
export const wave: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const waves = intBetween(random, 2, 3);
  const columns = Math.round(width / 4);

  for (let index = 0; index < waves; index += 1) {
    const amplitude = between(random, height * 0.12, height * 0.28);
    const frequency = between(random, 1.2, 2.6);
    const phase = random() * Math.PI * 2;
    const baseline = height * (0.35 + (0.3 * index) / Math.max(1, waves - 1));
    const layer = (2 - Math.min(index, 2)) as Layer;

    for (let column = 0; column <= columns; column += 1) {
      const t = column / columns;
      const s = Math.sin(phase + t * frequency * Math.PI * 2);
      shapes.push({
        kind: 'dot',
        x: t * width,
        y: baseline + s * amplitude,
        r: index === 0 ? 1.3 : 0.9,
        layer,
        // y grows downwards, so a visual crest is a negative sine.
        weight: index === 0 ? Math.max(0, -s) : 0,
      });
    }
  }
  return shapes;
};

/** systems-cli: lines of output and a cursor waiting for the next command. */
export const terminal: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const rows = intBetween(random, 6, 9);
  const lineHeight = height / (rows + 2);
  const left = width * 0.1;
  const right = width * 0.9;

  for (let row = 0; row < rows; row += 1) {
    const y = lineHeight * (row + 1.2);
    shapes.push({ kind: 'dot', x: left, y: y + lineHeight * 0.3, r: 1, layer: 1, weight: 0.3 });
    let x = left + 5;
    const segments = intBetween(random, 2, 6);

    for (let segment = 0; segment < segments && x < right - 2; segment += 1) {
      const w = Math.min(between(random, 4, 22), right - x);
      shapes.push({
        kind: 'bar',
        x,
        y,
        w,
        h: lineHeight * 0.55,
        layer: segment === 0 ? 2 : 1,
        weight: segment === 0 && random() < 0.5 ? 0.6 : random() * 0.3,
      });
      x += w + between(random, 2, 5);
    }
  }

  const cursorY = lineHeight * (rows + 1.2);
  shapes.push({ kind: 'dot', x: left, y: cursorY + lineHeight * 0.3, r: 1, layer: 1, weight: 0.3 });
  shapes.push({ kind: 'bar', x: left + 5, y: cursorY, w: 3, h: lineHeight * 0.6, layer: 2, weight: 1 });

  for (let y = 0; y < height; y += 3) {
    shapes.push({ kind: 'line', x1: 0, y1: y, x2: width, y2: y, layer: 0, weight: 0 });
  }
  return shapes;
};

/** professional: scattered client data converging into one pipeline. */
export const flow: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const hub = {
    x: width * between(random, 0.58, 0.68),
    y: height * between(random, 0.4, 0.6),
  };
  const sources = intBetween(random, 18, 30);

  for (let i = 0; i < sources; i += 1) {
    const x = between(random, width * 0.04, width * 0.38);
    const y = between(random, height * 0.08, height * 0.92);
    shapes.push({ kind: 'dot', x, y, r: between(random, 0.6, 1.4), layer: 1, weight: 0 });
    shapes.push({ kind: 'line', x1: x, y1: y, x2: hub.x, y2: hub.y, layer: 0, weight: 0 });
  }

  shapes.push({ kind: 'dot', x: hub.x, y: hub.y, r: 3.4, layer: 2, weight: 1 });
  const end = width * 0.96;
  const steps = intBetween(random, 6, 10);
  for (let step = 1; step <= steps; step += 1) {
    shapes.push({ kind: 'dot', x: hub.x + ((end - hub.x) * step) / steps, y: hub.y, r: 1.4, layer: 2, weight: 0.9 });
  }
  shapes.push({ kind: 'line', x1: hub.x, y1: hub.y, x2: end, y2: hub.y, layer: 1, weight: 0.8 });
  return shapes;
};
```

`src/lib/art/index.ts`:
```ts
import type { Block } from '../../content/blocks';
import { flow, orbit, terminal, wave, type Motif, type Shape } from './motifs';
import { createRandom, hashString } from './random';

export type ArtAspect = 'card' | 'banner';

const FRAMES: Record<ArtAspect, { width: number; height: number }> = {
  card: { width: 160, height: 90 },
  banner: { width: 210, height: 90 },
};

/** Keeps the listing HTML small: fifteen cards render fifteen SVGs (REQ-015). */
export const ELEMENT_BUDGET: Record<ArtAspect, number> = { card: 200, banner: 300 };

/** Exhaustive by type: a new block without a motif fails the type-check. */
const MOTIFS: Record<Block, { name: string; draw: Motif }> = {
  'ai-tooling': { name: 'orbit', draw: orbit },
  'ai-product': { name: 'wave', draw: wave },
  'systems-cli': { name: 'terminal', draw: terminal },
  professional: { name: 'flow', draw: flow },
};

/** Amber on 10% to 20% of the elements: the signal, never the noise (REQ-004). */
export const heroCount = (total: number): number =>
  Math.min(Math.floor(total * 0.2), Math.max(Math.ceil(total * 0.1), Math.round(total * 0.15)));

const heroIndexes = (shapes: Shape[]): Set<number> =>
  new Set(
    shapes
      .map((shape, index) => ({ weight: shape.weight, index }))
      .sort((a, b) => b.weight - a.weight || a.index - b.index)
      .slice(0, heroCount(shapes.length))
      .map(({ index }) => index),
  );

const n = (value: number): string => String(Number(value.toFixed(2)));

const toneOf = (shape: Shape, hero: boolean): string => {
  if (hero) return 'art-hero';
  return shape.layer === 0 ? 'art-faint' : 'art-base';
};

const element = (shape: Shape, tone: string): string => {
  switch (shape.kind) {
    case 'dot':
      return `<circle class="${tone}" cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.r)}"/>`;
    case 'ring':
      return `<circle class="${tone} art-ring" cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.r)}"/>`;
    case 'line':
      return `<line class="${tone} art-line" x1="${n(shape.x1)}" y1="${n(shape.y1)}" x2="${n(shape.x2)}" y2="${n(shape.y2)}"/>`;
    case 'bar':
      return `<rect class="${tone}" x="${n(shape.x)}" y="${n(shape.y)}" width="${n(shape.w)}" height="${n(shape.h)}" rx="0.6"/>`;
  }
};

export interface ArtInput {
  slug: string;
  block: Block;
  aspect: ArtAspect;
}

/**
 * Pure: same input, same markup (REQ-001, REQ-002). Colours are classes bound
 * to tokens in global.css, never attributes, so the hex gate holds (REQ-004).
 */
export const generateArt = ({ slug, block, aspect }: ArtInput): string => {
  const frame = FRAMES[aspect];
  const motif = MOTIFS[block];
  const random = createRandom(hashString(`${block}:${slug}`));
  const shapes = motif.draw(random, frame).slice(0, ELEMENT_BUDGET[aspect]);
  const heroes = heroIndexes(shapes);

  const layers = ([0, 1, 2] as const)
    .map((layer) => {
      const body = shapes
        .map((shape, index) => ({ shape, index }))
        .filter(({ shape }) => shape.layer === layer)
        .map(({ shape, index }) => element(shape, toneOf(shape, heroes.has(index))))
        .join('');
      return `<g class="art-layer" style="--depth:${layer + 1}"><g class="art-drift">${body}</g></g>`;
    })
    .join('');

  return `<svg class="art" viewBox="0 0 ${frame.width} ${frame.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-motif="${motif.name}">${layers}</svg>`;
};
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/art/generate.test.ts`
Expected: PASS. Se o teste de fração de âmbar falhar num motivo, ajuste os `weight` daquele motivo; nunca afrouxe o intervalo.

**Step 5: Commit**
Run: `/git commit`

---

### Task 3: Unicidade entre os cases publicados

**Requirement:** REQ-014
**Depends on:** Task 2
**Files:**
- Test: `tests/art/uniqueness.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: test-driven-development)
- Reviewers: test-reviewer

**Step 1: Write the test**

Lê o frontmatter direto do disco, e não por `getAllProjects`, para não depender do `data-store.json` congelado.

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/content/blocks';
import { generateArt } from '../../src/lib/art';

const DIR = 'src/content/projects';

const published = readdirSync(DIR)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const frontmatter = readFileSync(join(DIR, file), 'utf8').split(/^---$/m)[1] ?? '';
    return {
      slug: frontmatter.match(/^slug:\s*(\S+)/m)?.[1] ?? '',
      block: frontmatter.match(/^block:\s*(\S+)/m)?.[1] as Block,
    };
  });

describe('art across the published cases', () => {
  it('reads every case', () => {
    expect(published.length).toBeGreaterThanOrEqual(15);
    for (const entry of published) expect(entry.slug).not.toBe('');
  });

  it.each(['card', 'banner'] as const)('never repeats a %s between two cases', (aspect) => {
    const drawings = published.map((entry) => generateArt({ ...entry, aspect }));
    expect(new Set(drawings).size).toBe(drawings.length);
  });
});
```

**Step 2: Run test**
Run: `./node_modules/.bin/vitest run tests/art/uniqueness.test.ts`
Expected: PASS. Se falhar, a correção é no gerador (mais entropia na semente), nunca renomear um case. Para provar que o teste morde, troque temporariamente a semente em `generateArt` por `hashString(block)` e confirme o FAIL; reverta.

**Step 3: Commit**
Run: `/git commit`

---

### Task 4: CSS da arte e do ponteiro, com movimento só sob `no-preference`

**Requirement:** REQ-004, REQ-008, REQ-009, REQ-010, REQ-011
**Files:**
- Modify: `src/styles/global.css` (fim do arquivo)
- Test: `tests/design-system/art-motion.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: accessibility-guardrails, test-reviewer

**Step 1: Write the failing test**
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

/** Removes every `@media <query> { ... }` block, matching braces. */
const without = (source: string, query: string): string => {
  let result = source;
  for (;;) {
    const start = result.indexOf(`@media ${query}`);
    if (start === -1) return result;
    let depth = 0;
    let end = result.indexOf('{', start);
    for (; end < result.length; end += 1) {
      if (result[end] === '{') depth += 1;
      if (result[end] === '}' && --depth === 0) break;
    }
    result = result.slice(0, start) + result.slice(end + 1);
  }
};

const outsideMotion = without(css, '(prefers-reduced-motion: no-preference)');

describe('art motion', () => {
  it('defines the art and the pointer field', () => {
    expect(css).toContain('.art-hero');
    expect(css).toContain('.pointer-field::after');
    expect(css).toMatch(/@keyframes art-drift/);
  });

  it('animates the banner only when the visitor has not asked for less motion', () => {
    expect(css).toMatch(/animation:\s*art-drift/);
    expect(outsideMotion).not.toMatch(/animation:\s*art-drift/);
  });

  it('eases the pointer glow and the parallax only under no-preference', () => {
    expect(outsideMotion).not.toMatch(/transition:[^;]*--gx/);
    expect(outsideMotion).not.toMatch(/\.art-layer\s*\{[^}]*transition/);
  });

  it('colours the art through tokens', () => {
    expect(css).toMatch(/\.art-hero\s*\{[^}]*var\(--color-primary\)/);
    expect(css).toMatch(/\.art-base\s*\{[^}]*var\(--color-muted-foreground\)/);
    expect(css).toMatch(/\.art-faint\s*\{[^}]*var\(--color-border-strong\)/);
  });

  it('moves the parallax with transform only, never a layout property', () => {
    const layer = css.match(/\.art-layer\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(layer).toMatch(/transform:/);
    expect(layer).not.toMatch(/\b(top|left|margin|padding|width|height):/);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/design-system/art-motion.test.ts`
Expected: FAIL with "expected ... to contain '.art-hero'"

**Step 3: Write minimal implementation**

Acrescentar ao fim de `src/styles/global.css` (fora de `@layer`, porque `@property` precisa ser top-level):

```css
/* Generative case art (docs/specs/generative-case-art). Colours only through
   tokens; motion only under no-preference. Registered so the glow can ease
   after the cursor instead of jumping to it. */
@property --gx {
  syntax: '<length>';
  inherits: true;
  initial-value: -9999px;
}

@property --gy {
  syntax: '<length>';
  inherits: true;
  initial-value: -9999px;
}

@layer components {
  .art {
    display: block;
    width: 100%;
    height: 100%;
  }

  .art-hero {
    fill: var(--color-primary);
    stroke: var(--color-primary);
  }

  .art-base {
    fill: var(--color-muted-foreground);
    stroke: var(--color-muted-foreground);
  }

  .art-faint {
    fill: var(--color-border-strong);
    stroke: var(--color-border-strong);
  }

  .art circle:not(.art-ring),
  .art rect {
    stroke: none;
  }

  .art-ring {
    fill: none;
    stroke-width: 0.3;
  }

  .art-line {
    stroke-width: 0.25;
  }

  /* Without the script --mx and --my fall back to the centre: no offset. */
  .art-layer {
    transform-box: view-box;
    transform-origin: center;
    transform: translate(
      calc((var(--mx, 0.5) - 0.5) * var(--depth) * 6px),
      calc((var(--my, 0.5) - 0.5) * var(--depth) * 4px)
    );
  }

  .art-banner {
    aspect-ratio: 21 / 9;
  }

  /* Decorative dot grid. The amber copy shows only near the cursor, through
     a mask the script positions; the neutral copy is always there. */
  .pointer-field {
    position: relative;
    isolation: isolate;
  }

  .pointer-field::before,
  .pointer-field::after {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--spacing-lg));
    z-index: -1;
    pointer-events: none;
    background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1.5px);
    background-size: var(--spacing-md) var(--spacing-md);
  }

  .pointer-field::after {
    background-image: radial-gradient(circle, var(--color-primary) 1px, transparent 1.5px);
    mask-image: radial-gradient(circle 7rem at var(--gx) var(--gy), black, transparent);
    opacity: 0;
  }

  .pointer-field[data-active]::after {
    opacity: 1;
  }
}

@keyframes art-drift {
  from {
    transform: translateX(-3px);
  }

  to {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .pointer-field::after {
    transition:
      opacity var(--duration-base) var(--ease-out),
      --gx var(--duration-base) var(--ease-out),
      --gy var(--duration-base) var(--ease-out);
  }

  .art-layer {
    transition: transform var(--duration-base) var(--ease-out);
  }

  /* Only the case banner moves on its own; fifteen cards moving at once in
     the grid would tire the eye (REQ-011). */
  .art-banner .art-drift {
    animation: art-drift 18s ease-in-out infinite alternate;
  }
}
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/design-system/art-motion.test.ts tests/design-system/no-ad-hoc-values.test.ts tests/design-system/contrast.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`

---

## Lote 2 — Componentes

### Task 5: `PointerField`, o único script do site

**Requirement:** REQ-008, REQ-009, REQ-010, REQ-017
**Files:**
- Create: `src/components/art/PointerField.astro`
- Test: `tests/art/pointer-field.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: accessibility-guardrails, performance-guardrails, test-reviewer

**Step 1: Write the failing test**
```ts
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PointerField from '../../src/components/art/PointerField.astro';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');

describe('PointerField', () => {
  it('wraps its content in the marked field the script and the gate look for', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PointerField, { slots: { default: '<p>inside</p>' } });

    expect(html).toContain('data-pointer-field');
    expect(html).toContain('pointer-field');
    expect(html).toContain('<p>inside</p>');
  });

  it('starts only for a fine pointer and only without a reduced-motion request', () => {
    expect(source).toContain("matchMedia('(pointer: fine)')");
    expect(source).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
  });

  it('writes at most once per frame', () => {
    expect(source).toContain('requestAnimationFrame');
  });

  it('only writes CSS variables, leaving the drawing to CSS', () => {
    for (const variable of ['--gx', '--gy', '--mx', '--my']) expect(source).toContain(`'${variable}'`);
    expect(source).not.toMatch(/\.style\.(transform|left|top)\b/);
  });

  it('resets the parallax when the pointer leaves', () => {
    expect(source).toContain('pointerleave');
    expect(source).toContain('removeProperty');
  });

  it('uses no framework island', () => {
    expect(source).not.toContain('client:');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/art/pointer-field.test.ts`
Expected: FAIL with "Cannot find module '../../src/components/art/PointerField.astro'" (ou ENOENT no `readFileSync`)

**Step 3: Write minimal implementation**
```astro
---
/**
 * The only client script the site ships (docs/specs/generative-case-art,
 * REQ-012). It writes four CSS variables and nothing else: the dot grid and
 * the parallax are CSS. Removing this component removes the effect and
 * nothing more (REQ-017). Without JavaScript, on touch, or with reduced motion,
 * the art simply stays still (REQ-008).
 */
---

<div class="pointer-field" data-pointer-field>
  <slot />
</div>

<script>
  const fine = window.matchMedia('(pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (fine && !calm) {
    document.querySelectorAll<HTMLElement>('[data-pointer-field]').forEach((field) => {
      let last: PointerEvent | null = null;
      let frame = 0;
      let current: HTMLElement | null = null;

      const release = () => {
        current?.style.removeProperty('--mx');
        current?.style.removeProperty('--my');
        current = null;
      };

      const paint = () => {
        frame = 0;
        if (!last) return;
        const box = field.getBoundingClientRect();
        field.style.setProperty('--gx', `${last.clientX - box.left}px`);
        field.style.setProperty('--gy', `${last.clientY - box.top}px`);

        const art = (last.target as Element | null)?.closest<HTMLElement>('[data-art]') ?? null;
        if (art !== current) release();
        if (art) {
          const rect = art.getBoundingClientRect();
          art.style.setProperty('--mx', ((last.clientX - rect.left) / rect.width).toFixed(3));
          art.style.setProperty('--my', ((last.clientY - rect.top) / rect.height).toFixed(3));
          current = art;
        }
      };

      field.addEventListener('pointermove', (event) => {
        last = event;
        field.dataset.active = '';
        if (!frame) frame = requestAnimationFrame(paint);
      });

      field.addEventListener('pointerleave', () => {
        last = null;
        delete field.dataset.active;
        release();
      });
    });
  }
</script>
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/art/pointer-field.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 6: `ArtCard`, o card mínimo

**Requirement:** REQ-005, REQ-006
**Depends on:** Task 2
**Files:**
- Create: `src/components/catalog/ArtCard.astro`
- Test: `tests/catalog/art-card.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: accessibility-guardrails, test-reviewer

**Step 1: Write the failing test**
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArtCard from '../../src/components/catalog/ArtCard.astro';
import { generateArt } from '../../src/lib/art';

const props = {
  href: '/lab/forja',
  title: 'Forja',
  stamp: '01/2026',
  art: generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' }),
};

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(ArtCard, { props });
};

describe('ArtCard', () => {
  it('is a single link to the real case route', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/lab/forja"');
  });

  it('shows the art, the title and the date, and nothing else', async () => {
    const html = await render();
    expect(html).toContain('data-motif="orbit"');
    expect(html).toContain('Forja');
    expect(html).toContain('01/2026');
  });

  it('marks itself as the parallax target', async () => {
    expect(await render()).toContain('data-art');
  });

  it('keeps the art out of the accessible name', async () => {
    expect(await render()).toContain('aria-hidden="true"');
  });

  it('delimits its interactive surface with a perceivable border, not the hairline token', async () => {
    const html = await render();
    expect(html).toContain('border-border-strong');
    expect(html).not.toMatch(/\bborder-border\b(?!-)/);
  });

  it('exposes a visible focus ring, since the card is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/catalog/art-card.test.ts`
Expected: FAIL with "Cannot find module '../../src/components/catalog/ArtCard.astro'"

**Step 3: Write minimal implementation**
```astro
---
interface Props {
  href: string;
  title: string;
  stamp: string;
  /** Markup from generateArt; decorative, hidden from assistive technology. */
  art: string;
}

const { href, title, stamp, art } = Astro.props;
---

<a
  href={href}
  data-art
  class="group flex flex-col overflow-hidden rounded-md border border-border-strong bg-surface transition-[border-color] duration-(--duration-fast) ease-out hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  <div class="aspect-video w-full bg-background" set:html={art} />
  <span class="flex items-baseline justify-between gap-md p-md">
    <span class="font-serif text-h3 text-foreground transition-colors group-hover:text-primary">
      {title}
    </span>
    <span class="font-mono text-small text-muted-foreground">{stamp}</span>
  </span>
</a>
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/catalog/art-card.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 7: `/portfolio` e `/lab` viram grid de cards

**Requirement:** REQ-006, REQ-009, REQ-010
**Depends on:** Tasks 5, 6
**Files:**
- Modify: `src/components/catalog/CollectionListing.astro:1-58`
- Modify: `tests/catalog/collection-listing.test.ts:33-43`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: accessibility-guardrails, test-reviewer, consequences-reviewer

**Step 1: Write the failing test**

Substituir o caso `lists rows, never cards` (linhas 33-43). A revogação do `theme-restyle` é deliberada (spec, Grilling Log #2):

```ts
  it('lists a card per case, with its art, title and date, linking to the real route', async () => {
    const html = await render({
      collection: 'lab',
      projects: [project()],
    });

    // Cards replaced rows here on purpose: docs/specs/generative-case-art
    // revokes the theme-restyle "rows, never cards" rule for /portfolio and /lab.
    expect(html).toContain('href="/lab/forja"');
    expect(html).toContain('Forja');
    expect(html).toContain('01/2026');
    expect(html).toContain('data-motif="orbit"');
    expect(html).toContain('data-art');
  });

  it('puts the grid inside the pointer field', async () => {
    const html = await render({ collection: 'lab', projects: [project()] });
    expect(html.indexOf('data-pointer-field')).toBeLessThan(html.indexOf('href="/lab/forja"'));
  });
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/catalog/collection-listing.test.ts`
Expected: FAIL with "expected ... to contain 'data-motif=\"orbit\"'"

**Step 3: Write minimal implementation**

Em `src/components/catalog/CollectionListing.astro`, trocar o import de `ListRow` e a lista:

```astro
---
import ArtCard from './ArtCard.astro';
import PointerField from '../art/PointerField.astro';
import SectionHeader from '../ui/SectionHeader.astro';
import type { Project } from '../../content/schemas/project';
import { generateArt } from '../../lib/art';
import {
  COLLECTION_LABELS,
  blocksOf,
  collectionOfBlock,
  type CatalogCollection,
} from '../../lib/catalog/groups';
import { toCompactStamp } from '../../lib/format/date';
```

E substituir o `<ul class="list-none p-0">...</ul>` por:

```astro
      <PointerField>
        <ul class="grid list-none grid-cols-1 gap-lg p-0 sm:grid-cols-2">
          {items.map((project) => (
            <li>
              <ArtCard
                href={`/${collectionOfBlock(project.block)}/${project.slug}`}
                title={project.title}
                stamp={toCompactStamp(project.date)}
                art={generateArt({ slug: project.slug, block: project.block, aspect: 'card' })}
              />
            </li>
          ))}
        </ul>
      </PointerField>
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/catalog/collection-listing.test.ts tests/home tests/catalog/site-nav.test.ts`
Expected: PASS. A home continua em `ListRow` (o `CollectionSection` não é tocado).

**Step 5: Commit**
Run: `/git commit`

---

### Task 8: Faixa 21:9 no topo do case

**Requirement:** REQ-007, REQ-011
**Depends on:** Tasks 2, 4, 5
**Files:**
- Modify: `src/components/catalog/CaseArticle.astro:1-22`
- Modify: `tests/catalog/case-article.test.ts` (acrescentar casos ao `describe` existente)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, test-driven-development)
- Reviewers: accessibility-guardrails, test-reviewer

**Step 1: Write the failing test**

Acrescentar ao `describe` de `tests/catalog/case-article.test.ts`, reutilizando o renderizador e o fixture que o arquivo já declara (o fixture precisa de `slug` e `block`; acrescente `slug: 'forja', block: 'ai-tooling'` se faltarem):

```ts
  it('opens with the generated art band, before the block label and the title', async () => {
    const html = await render();
    const band = html.indexOf('art-banner');

    expect(band).toBeGreaterThan(-1);
    expect(band).toBeLessThan(html.indexOf('<h1'));
    expect(html).toContain('viewBox="0 0 210 90"');
  });

  it('keeps the band decorative and inside the pointer field', async () => {
    const html = await render();
    expect(html).toContain('aria-hidden="true"');
    expect(html.indexOf('data-pointer-field')).toBeLessThan(html.indexOf('art-banner'));
  });
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/catalog/case-article.test.ts`
Expected: FAIL with "expected -1 to be greater than -1"

**Step 3: Write minimal implementation**

No frontmatter de `CaseArticle.astro`:
```astro
import PointerField from '../art/PointerField.astro';
import { generateArt } from '../../lib/art';
```
e, depois de `const isDiscontinued = ...`:
```astro
const art = generateArt({ slug: project.slug, block: project.block, aspect: 'banner' });
```

Logo depois de `<article class="mt-2xl mb-3xl flex flex-col gap-xl">`, antes de `<header>`:
```astro
  <PointerField>
    <div
      data-art
      class="art-banner w-full overflow-hidden rounded-md border border-border bg-surface"
      set:html={art}
    />
  </PointerField>
```

A borda é o token `border` de propósito: a faixa não é interativa, então o separador decorativo é o correto.

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/catalog`
Expected: PASS, inclusive `rendered-integrity` (nenhuma largura fixa acima de 320px).

**Step 5: Commit**
Run: `/git commit`

---

## Lote 3 — Portão de JavaScript

### Task 9: Lógica do portão, testável sem build

**Requirement:** REQ-012, REQ-013
**Files:**
- Create: `tests/helpers/client-scripts.ts`
- Test: `tests/helpers/client-scripts.test.ts`

**Team:**
- Track: infra
- Implementer: rpi-implementer (skills: test-driven-development)
- Reviewers: security-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { executableScripts, scriptViolations } from './client-scripts';

const POINTER = "document.querySelectorAll('[data-pointer-field]')";

describe('executableScripts', () => {
  it('ignores JSON-LD data blocks', () => {
    const html = '<script type="application/ld+json">{"@type":"Person"}</script>';
    expect(executableScripts(html)).toEqual([]);
  });

  it('returns inline scripts, which is how Astro ships a small component script', () => {
    expect(executableScripts(`<script type="module">${POINTER}</script>`)).toEqual([POINTER]);
  });

  it('reads an external script through the given reader', () => {
    const html = '<script type="module" src="/_astro/x.js"></script>';
    expect(executableScripts(html, () => POINTER)).toEqual([POINTER]);
  });
});

describe('scriptViolations', () => {
  it('accepts the pointer effect on the listings and on a case page', () => {
    expect(
      scriptViolations([
        { route: '/lab', scripts: [POINTER] },
        { route: '/portfolio/financial-normalization', scripts: [POINTER] },
      ]),
    ).toEqual([]);
  });

  it('rejects any other script, inline or not', () => {
    expect(scriptViolations([{ route: '/sobre', scripts: ['console.log(1)'] }])).toEqual([
      '/sobre: script outside the allowlist',
    ]);
  });

  it('rejects the pointer effect outside /portfolio, /lab and case pages', () => {
    expect(scriptViolations([{ route: '/', scripts: [POINTER] }])).toEqual([
      '/: pointer effect outside /portfolio, /lab and case pages',
    ]);
  });

  it('rejects the pointer effect above 1.5 KB gzip', () => {
    const bloated = `${POINTER};${randomBytes(3000).toString('hex')}`;
    const [violation] = scriptViolations([{ route: '/lab', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/lab: pointer effect is \d+ B gzip, budget 1536$/);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `./node_modules/.bin/vitest run tests/helpers/client-scripts.test.ts`
Expected: FAIL with "Cannot find module './client-scripts'"

**Step 3: Write minimal implementation**
```ts
import { gzipSync } from 'node:zlib';

export interface PageScripts {
  route: string;
  scripts: string[];
}

export const POINTER_MARKER = 'data-pointer-field';
export const POINTER_BUDGET_BYTES = 1536;

const ALLOWED_ROUTE = /^\/(portfolio|lab)(\/[a-z0-9-]+)?\/?$/;

/**
 * Every executable script of a page: inline bodies, plus external ones read
 * through `readSrc`. JSON-LD is data, not code, and is skipped. Inline matters:
 * Astro inlines a small component script, so a gate that only lists files in
 * dist/client/_astro never sees it.
 */
export const executableScripts = (html: string, readSrc?: (src: string) => string): string[] =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/type\s*=\s*["']application\/ld\+json["']/i.test(attrs))
    .map(([, attrs, body]) => {
      const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      return src && readSrc ? readSrc(src) : body.trim();
    });

/** The single exception (docs/specs/generative-case-art, REQ-012). */
export const scriptViolations = (pages: PageScripts[]): string[] =>
  pages.flatMap(({ route, scripts }) =>
    scripts.flatMap((script) => {
      if (!script.includes(POINTER_MARKER)) return [`${route}: script outside the allowlist`];
      const problems: string[] = [];
      if (!ALLOWED_ROUTE.test(route)) {
        problems.push(`${route}: pointer effect outside /portfolio, /lab and case pages`);
      }
      const size = gzipSync(script).length;
      if (size > POINTER_BUDGET_BYTES) {
        problems.push(`${route}: pointer effect is ${size} B gzip, budget ${POINTER_BUDGET_BYTES}`);
      }
      return problems;
    }),
  );
```

**Step 4: Run test to verify it passes**
Run: `./node_modules/.bin/vitest run tests/helpers/client-scripts.test.ts`
Expected: PASS (7 tests)

**Step 5: Commit**
Run: `/git commit`

---

### Task 10: Portão de build lê o HTML servido, e é provado vermelho

**Requirement:** REQ-012, REQ-013
**Depends on:** Tasks 7, 8, 9
**Files:**
- Modify: `tests/design-system/no-client-js.build-test.ts:1-21` (reescrita completa)

**Team:**
- Track: infra
- Implementer: infra-engineer (skills: bash-linux, test-driven-development)
- Reviewers: security-reviewer, consequences-reviewer

**Step 1: Write the test**
```ts
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  POINTER_MARKER,
  executableScripts,
  scriptViolations,
  type PageScripts,
} from '../helpers/client-scripts';

const PORT = Number(process.env.GATE_PORT ?? 4931);
const BASE = `http://127.0.0.1:${PORT}`;
const CLIENT = 'dist/client';
const SSR_ROUTES = ['/', '/sobre', '/contato', '/posts', '/posts/arquivo', '/portfolio', '/lab'];

const readSrc = (src: string): string => readFileSync(join(CLIENT, src.replace(/^\//, '')), 'utf8');

/** Every pre-rendered page: case pages, posts, the yearly archive. */
const prerendered = (dir = CLIENT, route = ''): PageScripts[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === '_astro' ? [] : prerendered(path, `${route}/${entry}`);
    }
    if (entry !== 'index.html') return [];
    return [{ route: route || '/', scripts: executableScripts(readFileSync(path, 'utf8'), readSrc) }];
  });

const served = async (route: string): Promise<PageScripts> => ({
  route,
  scripts: executableScripts(await (await fetch(`${BASE}${route}`)).text(), readSrc),
});

let server: ChildProcess | undefined;

beforeAll(async () => {
  // Placeholders: /api/hire refuses to boot without them (REQ-010 of hire-endpoint).
  server = spawn('node', ['dist/server/entry.mjs'], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(PORT),
      RESEND_API_KEY: 're_placeholder_not_a_real_key',
      HIRE_NOTIFY_TO: 'gate@example.com',
      HIRE_NOTIFY_FROM: 'gate@example.com',
    },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`the built server never answered on ${BASE}; is the port free?`);
}, 20_000);

afterAll(() => {
  server?.kill();
});

describe('client JavaScript', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });

  it('ships only the pointer effect, only where allowed, within budget', async () => {
    const pages = [...(await Promise.all(SSR_ROUTES.map(served))), ...prerendered()];
    expect(scriptViolations(pages)).toEqual([]);
  });

  it('actually ships the effect on the listings, so the gate is not vacuous', async () => {
    const { scripts } = await served('/lab');
    expect(scripts.some((script) => script.includes(POINTER_MARKER))).toBe(true);
  });

  it('leaves no stray script file in the client asset dir', () => {
    const dir = join(CLIENT, '_astro');
    const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.js')) : [];
    for (const file of files) expect(readFileSync(join(dir, file), 'utf8')).toContain(POINTER_MARKER);
  });
});
```

**Step 2: Run the gate green**
Run: `npm run build > /tmp/gate-build.log 2>&1; echo BUILD=$?; npm run test:build > /tmp/gate.log 2>&1; echo GATE=$?; grep -E "Tests |FAIL" /tmp/gate.log`
Expected: `BUILD=0`, `GATE=0`, todos os testes de build passando.

**Step 3: Prove it red (REQ-013)**
1. Acrescente temporariamente `<script>console.log('gate')</script>` ao fim de `src/pages/sobre.astro`.
2. Run: `npm run build > /tmp/gate-build.log 2>&1; npm run test:build > /tmp/gate.log 2>&1; echo GATE=$?; grep -E "outside the allowlist" /tmp/gate.log`
   Expected: `GATE=1` e a linha `/sobre: script outside the allowlist`.
3. Remova o script, rode o Step 2 de novo e confirme verde.
4. Registre a prova (comando e linha de falha) no `STATE.md` da feature.

**Step 4: Commit**
Run: `/git commit`

---

## Lote 4 — Limpeza, documentos e verificação

### Task 11: Remover o código morto

**Requirement:** REQ-016
**Depends on:** Task 7
**Files:**
- Delete: `src/components/ui/ProjectCard.astro`
- Delete: `src/components/catalog/BlockSection.astro`
- Delete: `src/lib/image-fallback.ts`
- Delete: `tests/design-system/image-fallback.test.ts`
- Delete: `tests/catalog/block-section.test.ts`
- Modify: `tests/components/card-and-prose.test.ts:1-46` (remover o `describe('ProjectCard')` e seus imports, mantendo `Prose`)
- Modify: `tests/catalog/rendered-integrity.test.ts:3,35-47` (remover o import de `BlockSection` e o caso `falls back deterministically for a card with no image`, cujo papel passou para `tests/art/uniqueness.test.ts`)

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: architecture-guardrails)
- Reviewers: consequences-reviewer

**Step 1: Confirm nothing else uses them**
Run: `grep -rln "ProjectCard\|BlockSection\|image-fallback\|initialsFromSlug" src tests`
Expected: só os arquivos listados acima.

**Step 2: Delete and edit**, conforme a lista de arquivos.

**Step 3: Verify**
Run: `grep -rln "ProjectCard\|BlockSection\|image-fallback\|initialsFromSlug" src tests; ./node_modules/.bin/vitest run > /tmp/suite.log 2>&1; echo EXIT=$?; grep -E "Test Files|Tests |FAIL" /tmp/suite.log`
Expected: nenhum arquivo listado pelo `grep`, `EXIT=0`.

**Step 4: Commit**
Run: `/git commit`

---

### Task 12: Registrar as revogações

**Requirement:** REQ-016
**Files:**
- Modify: `CLAUDE.md` (tabela "Portões automatizados" e "Restrições que não são preferência")
- Modify: `docs/specs/theme-restyle/SPEC.md` (nota de revogação após `## Goals`)
- Modify: `docs/specs/00-roadmap.md` (tabela de status e Decision Log)

**Team:**
- Track: docs
- Implementer: rpi-implementer
- Reviewers: self-review

**Step 1: CLAUDE.md**
- Na tabela de portões, trocar a linha do JavaScript por:
  `| JavaScript de cliente sob lista de permissão | tests/design-system/no-client-js.build-test.ts | Script fora do efeito de ponteiro, acima de 1,5 KB gzip ou fora de /portfolio, /lab e cases |`
- Em "Restrições", trocar o item "Zero JavaScript de cliente no P0" por:
  `- **JavaScript de cliente só por exceção nomeada.** O único script é o efeito de ponteiro de generative-case-art (até 1,5 KB gzip, só em /portfolio, /lab e cases), autorizado pelo autor em 2026-10-07. Qualquer outro exige decisão registrada e passa pelo portão. Nenhuma diretiva client:*.`

**Step 2: theme-restyle**
Logo depois de `## Goals`:
```markdown
> **Revogação parcial (2026-10-07):** "substituir o grid de cards por listagem em linha"
> deixou de valer em `/portfolio` e `/lab`, que passaram a grid de cards com arte gerada
> (`docs/specs/generative-case-art/SPEC.md`). A home continua em linhas.
```

**Step 3: Roadmap**
- Na tabela de status, acrescentar: `| generative-case-art | — | generative-case-art/SPEC.md | 2026-10-07-generative-case-art.md | **Concluída** |`
- No topo do Decision Log:
  `- 2026-10-07: generative-case-art revoga duas decisões, por escolha do autor. Grid de cards volta a /portfolio e /lab (contra o theme-restyle), justificado pela arte gerada por case, que não é o card genérico que o restyle combatia. "Zero JS no P0" ganha uma exceção nomeada, o efeito de ponteiro, sob portão de lista de permissão e orçamento de 1,5 KB gzip.`

**Step 4: Commit**
Run: `/git commit`

---

### Task 13: Verificação final e checagem manual

**Requirement:** todos
**Depends on:** Tasks 1-12
**Files:**
- Create: `docs/reviews/generative-case-art-manual-check.md`
- Modify: `docs/specs/generative-case-art/STATE.md`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: webapp-testing)
- Reviewers: accessibility-guardrails, performance-guardrails

**Step 1: Portão completo**
Run: `npm run verify > /tmp/verify.log 2>&1; echo EXIT=$?; grep -E "errors|Test Files|Tests |FAIL|Complete!" /tmp/verify.log`
Expected: `EXIT=0`, 0 erros no `astro check`, suítes unitária e de build passando.

**Step 2: Verificações por HTTP**
Run: `PORT=8090 bash scripts/verify-keyboard.sh` e `PORT=8090 bash scripts/verify-viewport-320.sh`
Expected: `KEYBOARD WALK PASSED` e `VIEWPORT 320 PASSED` (a evidência é a linha de marca, nunca o código de saída).

**Step 3: Lighthouse nas rotas de 2026-08-10, mais `/lab`**
Run: `bash scripts/audit-lighthouse.sh` contra o build local em `/`, `/lab`, `/lab/amnesia-claude-code` e `/criar-site-completo-com-o-notion`
Expected: Performance, Acessibilidade e SEO acima de 90 nas três primeiras; o post segue limitado pelo GIF, como já registrado.

**Step 4: Checagem manual**, registrada em `docs/reviews/generative-case-art-manual-check.md`:
- os quatro motivos são distinguíveis num relance em `/lab` e `/portfolio`;
- a grade acende perto do cursor e apaga ao sair; a paralaxe acompanha o cursor no card sob ele;
- a faixa do topo do case se move sozinha, devagar;
- com "reduzir movimento" ligado no sistema: nada se move, e a arte aparece completa;
- com JavaScript desligado: a arte aparece completa e parada, sem erro;
- em 320px: grid em uma coluna, sem rolagem horizontal.

**Step 5: Fechar o estado**
Atualize `docs/specs/generative-case-art/STATE.md` para `phase: implemented`, com a prova vermelha da Task 10 e as medições.

**Step 6: Commit**
Run: `/git commit`

---

## Rastreabilidade

| REQ | Tarefas |
|---|---|
| REQ-001 | T1, T2 |
| REQ-002 | T1, T2 |
| REQ-003 | T2 |
| REQ-004 | T2, T4 |
| REQ-005 | T2, T6 |
| REQ-006 | T6, T7 |
| REQ-007 | T8 |
| REQ-008 | T4, T5, T13 |
| REQ-009 | T4, T5, T7 |
| REQ-010 | T4, T5, T7 |
| REQ-011 | T4, T8, T13 |
| REQ-012 | T9, T10 |
| REQ-013 | T9, T10 |
| REQ-014 | T3 |
| REQ-015 | T2 |
| REQ-016 | T11, T12 |
| REQ-017 | T5 |
