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
        // y grows downwards, so a visual crest is a negative sine. Floor keeps
        // every primary-wave dot eligible so the amber quota is pure signal.
        weight: index === 0 ? Math.max(0.05, -s) : 0,
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

  const maxDistance = Math.hypot(width, height);
  for (let i = 0; i < sources; i += 1) {
    const x = between(random, width * 0.04, width * 0.38);
    const y = between(random, height * 0.08, height * 0.92);
    const distance = Math.hypot(x - hub.x, y - hub.y);
    // Closer sources rank higher for amber; lines stay noise (weight 0).
    const weight = 0.5 * (1 - distance / maxDistance);
    shapes.push({ kind: 'dot', x, y, r: between(random, 0.6, 1.4), layer: 1, weight });
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
