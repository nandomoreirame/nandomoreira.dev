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

/** Four strokes around a box: panes and frames, where a filled bar would hide content. */
const outline = (x: number, y: number, w: number, h: number, layer: Layer, weight: number): Shape[] => [
  { kind: 'line', x1: x, y1: y, x2: x + w, y2: y, layer, weight },
  { kind: 'line', x1: x + w, y1: y, x2: x + w, y2: y + h, layer, weight },
  { kind: 'line', x1: x + w, y1: y + h, x2: x, y2: y + h, layer, weight },
  { kind: 'line', x1: x, y1: y + h, x2: x, y2: y, layer, weight },
];

/** Data analysis: bars, the trend over them, the tallest bars lit. */
export const chart: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const left = width * 0.08;
  const right = width * 0.94;
  const base = height * 0.86;
  for (let line = 0; line < 4; line += 1) {
    const y = base - ((base - height * 0.12) * (line + 1)) / 4;
    shapes.push({ kind: 'line', x1: left, y1: y, x2: right, y2: y, layer: 0, weight: 0 });
  }
  shapes.push({ kind: 'line', x1: left, y1: base, x2: right, y2: base, layer: 0, weight: 0 });

  const bars = intBetween(random, 10, 16);
  const slot = (right - left) / bars;
  let level = between(random, 0.2, 0.4);
  const tops: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < bars; i += 1) {
    level = Math.min(0.95, Math.max(0.1, level + between(random, -0.12, 0.2)));
    const h = (base - height * 0.12) * level;
    const x = left + i * slot + slot * 0.2;
    shapes.push({ kind: 'bar', x, y: base - h, w: slot * 0.6, h, layer: 1, weight: 0.1 + 0.8 * level });
    tops.push({ x: x + slot * 0.3, y: base - h - 3 });
  }
  tops.forEach((top, i) => {
    shapes.push({ kind: 'dot', x: top.x, y: top.y, r: 0.9, layer: 2, weight: 0.05 });
    const next = tops[i + 1];
    if (next) shapes.push({ kind: 'line', x1: top.x, y1: top.y, x2: next.x, y2: next.y, layer: 2, weight: 0 });
  });
  return shapes;
};

/** Online shop: a shelf of products, a few featured. */
export const storefront: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  shapes.push({ kind: 'bar', x: width * 0.06, y: height * 0.06, w: width * 0.88, h: height * 0.07, layer: 0, weight: 0 });
  const cols = intBetween(random, 5, 7);
  const rows = 3;
  const gap = 3;
  const tileW = (width * 0.88 - gap * (cols - 1)) / cols;
  const tileH = (height * 0.74 - gap * (rows - 1)) / rows;
  const featured = new Set(Array.from({ length: 3 }, () => intBetween(random, 0, cols * rows - 1)));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const x = width * 0.06 + col * (tileW + gap);
      const y = height * 0.18 + row * (tileH + gap);
      const star = featured.has(index);
      shapes.push({ kind: 'bar', x, y, w: tileW, h: tileH * 0.7, layer: 1, weight: star ? 1 : 0.05 + random() * 0.4 });
      shapes.push({ kind: 'bar', x, y: y + tileH * 0.78, w: tileW * between(random, 0.35, 0.7), h: tileH * 0.14, layer: 2, weight: star ? 0.9 : 0.02 });
    }
  }
  return shapes;
};

/** Places by proximity: streets, pins, and the reach around you. */
export const map: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  for (let i = 0; i < intBetween(random, 6, 9); i += 1) {
    const vertical = random() < 0.5;
    const at = random();
    shapes.push(
      vertical
        ? { kind: 'line', x1: at * width, y1: 0, x2: at * width + between(random, -20, 20), y2: height, layer: 0, weight: 0 }
        : { kind: 'line', x1: 0, y1: at * height, x2: width, y2: at * height + between(random, -12, 12), layer: 0, weight: 0 },
    );
  }
  const you = { x: width * between(random, 0.35, 0.65), y: height * between(random, 0.35, 0.65) };
  const reach = height * between(random, 0.28, 0.38);
  shapes.push({ kind: 'ring', x: you.x, y: you.y, r: reach, layer: 1, weight: 0 });
  shapes.push({ kind: 'ring', x: you.x, y: you.y, r: reach * 0.5, layer: 1, weight: 0 });
  shapes.push({ kind: 'dot', x: you.x, y: you.y, r: 2.6, layer: 2, weight: 1 });
  for (let i = 0; i < intBetween(random, 26, 40); i += 1) {
    const x = random() * width;
    const y = random() * height;
    const distance = Math.hypot(x - you.x, y - you.y);
    const inside = distance < reach;
    shapes.push({ kind: 'dot', x, y, r: inside ? 1.4 : 0.9, layer: inside ? 2 : 1, weight: inside ? 0.2 + 0.7 * (1 - distance / reach) : 0.01 });
  }
  return shapes;
};

/** Institutional site: the page itself, with its call to action lit. */
export const wireframe: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const x0 = width * 0.08;
  const w = width * 0.84;
  shapes.push(...outline(x0, height * 0.05, w, height * 0.9, 0, 0));
  shapes.push({ kind: 'bar', x: x0 + 4, y: height * 0.09, w: w * 0.16, h: 4, layer: 1, weight: 0.3 });
  const navItems = intBetween(random, 3, 5);
  const active = intBetween(random, 0, navItems - 1);
  for (let i = 0; i < navItems; i += 1) {
    shapes.push({ kind: 'bar', x: x0 + w - 6 - (navItems - i) * 13, y: height * 0.1, w: 9, h: 2.4, layer: 1, weight: i === active ? 0.8 : 0.05 });
  }
  const heroH = height * between(random, 0.24, 0.32);
  shapes.push({ kind: 'bar', x: x0 + 4, y: height * 0.2, w: w - 8, h: heroH, layer: 0, weight: 0 });
  shapes.push({ kind: 'bar', x: x0 + 10, y: height * 0.2 + heroH * 0.25, w: w * between(random, 0.35, 0.55), h: 4, layer: 1, weight: 0.7 });
  shapes.push({ kind: 'bar', x: x0 + 10, y: height * 0.2 + heroH * 0.48, w: w * 0.3, h: 2.4, layer: 1, weight: 0.2 });
  shapes.push({ kind: 'bar', x: x0 + 10, y: height * 0.2 + heroH * 0.68, w: 18, h: 5, layer: 2, weight: 1 });
  const columns = intBetween(random, 2, 4);
  const gap = 4;
  const colW = (w - 8 - gap * (columns - 1)) / columns;
  const top = height * 0.24 + heroH;
  for (let c = 0; c < columns; c += 1) {
    const x = x0 + 4 + c * (colW + gap);
    shapes.push(...outline(x, top, colW, height * 0.2, 0, 0));
    for (let l = 0; l < 3; l += 1) {
      shapes.push({ kind: 'bar', x: x + 3, y: top + 4 + l * 4.5, w: colW * between(random, 0.4, 0.8), h: 1.8, layer: 1, weight: l === 0 ? 0.4 : 0.03 });
    }
  }
  shapes.push({ kind: 'bar', x: x0 + 4, y: height * 0.86, w: w - 8, h: 3, layer: 0, weight: 0 });
  return shapes;
};

/** Children's learning: loose shapes at play. */
export const play: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  for (let i = 0; i < intBetween(random, 24, 36); i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height, r: 0.5, layer: 0, weight: 0 });
  }
  for (let i = 0; i < intBetween(random, 14, 20); i += 1) {
    const x = between(random, width * 0.08, width * 0.92);
    const y = between(random, height * 0.12, height * 0.88);
    const size = between(random, 4, 11);
    const weight = 0.05 + random() * 0.9;
    const kind = random();
    if (kind < 0.4) shapes.push({ kind: 'dot', x, y, r: size / 2, layer: 2, weight });
    else if (kind < 0.75) shapes.push({ kind: 'bar', x, y, w: size, h: size, layer: 1, weight });
    else shapes.push({ kind: 'ring', x, y, r: size / 2, layer: 1, weight });
  }
  return shapes;
};

/** Several CLIs side by side: panes, one in focus. */
export const panels: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const panes = intBetween(random, 3, 4);
  const gap = 3;
  const x0 = width * 0.05;
  const paneW = (width * 0.9 - gap * (panes - 1)) / panes;
  const focus = intBetween(random, 0, panes - 1);
  for (let p = 0; p < panes; p += 1) {
    const x = x0 + p * (paneW + gap);
    const y = height * 0.1;
    const h = height * 0.8;
    shapes.push(...outline(x, y, paneW, h, 0, 0));
    shapes.push({ kind: 'bar', x: x + 2, y: y + 2, w: paneW - 4, h: 3.5, layer: 1, weight: p === focus ? 1 : 0.4 });
    const lines = intBetween(random, 6, 9);
    for (let l = 0; l < lines; l += 1) {
      shapes.push({ kind: 'bar', x: x + 3, y: y + 9 + l * 5.5, w: (paneW - 6) * between(random, 0.25, 0.9), h: 2, layer: 1, weight: p === focus ? 0.15 + random() * 0.4 : 0.02 });
    }
  }
  return shapes;
};

/** Window switcher: a strip of thumbnails, one selected. */
export const windows: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const count = intBetween(random, 4, 6);
  const gap = 4;
  const thumbW = (width * 0.86 - gap * (count - 1)) / count;
  const thumbH = thumbW * 0.7;
  const y = (height - thumbH) / 2;
  const selected = intBetween(random, 0, count - 1);
  shapes.push(...outline(width * 0.04, y - 6, width * 0.92, thumbH + 12, 0, 0));
  for (let i = 0; i < count; i += 1) {
    const x = width * 0.07 + i * (thumbW + gap);
    const on = i === selected;
    shapes.push({ kind: 'bar', x, y, w: thumbW, h: thumbH, layer: 0, weight: 0 });
    shapes.push({ kind: 'bar', x, y, w: thumbW, h: 2.6, layer: 1, weight: on ? 0.9 : 0.1 });
    for (let l = 0; l < 3; l += 1) {
      shapes.push({ kind: 'bar', x: x + 2, y: y + 6 + l * 4, w: thumbW * between(random, 0.3, 0.8), h: 1.6, layer: 1, weight: on ? 0.5 : 0.02 });
    }
    if (on) shapes.push(...outline(x - 1.5, y - 1.5, thumbW + 3, thumbH + 3, 2, 1));
  }
  return shapes;
};

/** Pomodoro: a ring of minutes, the elapsed arc lit up to now. */
export const timer: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = height * 0.4;
  const ticks = 48;
  const elapsed = Math.floor(ticks * between(random, 0.25, 0.8));
  const start = random() * Math.PI * 2;
  for (let t = 0; t < ticks; t += 1) {
    const angle = start + (t / ticks) * Math.PI * 2;
    const inner = t % 4 === 0 ? radius * 0.82 : radius * 0.9;
    shapes.push({
      kind: 'line',
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * radius,
      y2: cy + Math.sin(angle) * radius,
      layer: t <= elapsed ? 2 : 0,
      weight: t <= elapsed ? 0.2 + 0.8 * (t / elapsed) : 0,
    });
  }
  for (let d = 0; d < 4; d += 1) {
    shapes.push({ kind: 'bar', x: cx - 16 + d * 8.5 + (d > 1 ? 2 : 0), y: cy - 6, w: 6, h: 12, layer: 1, weight: 0.1 });
  }
  shapes.push({ kind: 'dot', x: cx, y: cy - 2.5, r: 0.8, layer: 1, weight: 0.1 });
  shapes.push({ kind: 'dot', x: cx, y: cy + 2.5, r: 0.8, layer: 1, weight: 0.1 });
  return shapes;
};

/** Achievements: steps rising, the highest ones lit. */
export const ascent: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  for (let line = 1; line <= 4; line += 1) {
    shapes.push({ kind: 'line', x1: 0, y1: (height * line) / 5, x2: width, y2: (height * line) / 5, layer: 0, weight: 0 });
  }
  const steps = intBetween(random, 7, 11);
  const stepW = (width * 0.84) / steps;
  let level = between(random, 0.08, 0.18);
  for (let s = 0; s < steps; s += 1) {
    level = Math.min(0.85, level + between(random, 0.03, 0.1));
    const h = height * level;
    const x = width * 0.08 + s * stepW;
    shapes.push({ kind: 'bar', x, y: height * 0.92 - h, w: stepW * 0.86, h, layer: 1, weight: 0.1 + 0.8 * (s / steps) });
    if (random() < 0.6) {
      shapes.push({ kind: 'dot', x: x + stepW * 0.43, y: height * 0.92 - h - 4, r: 1.2, layer: 2, weight: 0.2 + 0.7 * (s / steps) });
    }
  }
  for (let i = 0; i < intBetween(random, 8, 14); i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height * 0.5, r: 0.5, layer: 0, weight: 0 });
  }
  return shapes;
};

/** Mood board: a masonry of references, a few accents. */
export const mosaic: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const cols = intBetween(random, 5, 7);
  const gap = 2.5;
  const colW = (width * 0.9 - gap * (cols - 1)) / cols;
  for (let c = 0; c < cols; c += 1) {
    const x = width * 0.05 + c * (colW + gap);
    let y = height * 0.06 - between(random, 0, 10);
    while (y < height * 0.94) {
      const h = between(random, 8, 22);
      const top = Math.max(y, height * 0.04);
      const bottom = Math.min(y + h, height * 0.96);
      if (bottom - top > 2) {
        shapes.push({ kind: 'bar', x, y: top, w: colW, h: bottom - top, layer: random() < 0.5 ? 1 : 0, weight: 0.05 + random() * 0.9 });
      }
      y += h + gap;
    }
  }
  for (let i = 0; i < intBetween(random, 6, 10); i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height, r: 0.9, layer: 2, weight: 0.02 });
  }
  return shapes;
};

/** Activity log: events along time, closing in a report. */
export const timeline: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const axis = height * 0.5;
  shapes.push({ kind: 'line', x1: width * 0.04, y1: axis, x2: width * 0.96, y2: axis, layer: 0, weight: 0 });
  const events = intBetween(random, 12, 18);
  for (let e = 0; e < events; e += 1) {
    const x = width * 0.06 + (width * 0.8 * e) / (events - 1);
    const up = e % 2 === 0;
    const reach = height * between(random, 0.14, 0.32);
    const y = up ? axis - reach : axis + reach;
    shapes.push({ kind: 'line', x1: x, y1: axis, x2: x, y2: y, layer: 0, weight: 0 });
    shapes.push({ kind: 'dot', x, y: axis, r: 1.3, layer: 2, weight: 0.1 + 0.6 * (e / events) });
    shapes.push({ kind: 'bar', x: x - 4, y: up ? y - 3 : y, w: 8 + random() * 6, h: 3, layer: 1, weight: 0.05 + random() * 0.3 });
  }
  shapes.push({ kind: 'bar', x: width * 0.88, y: axis - 9, w: width * 0.08, h: 18, layer: 2, weight: 1 });
  return shapes;
};

/** Time tracking: a schedule of staggered bars and today's line. */
export const gantt: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const left = width * 0.06;
  const right = width * 0.94;
  for (let g = 0; g <= 8; g += 1) {
    const x = left + ((right - left) * g) / 8;
    shapes.push({ kind: 'line', x1: x, y1: height * 0.06, x2: x, y2: height * 0.94, layer: 0, weight: 0 });
  }
  const today = left + (right - left) * between(random, 0.45, 0.7);
  const rows = intBetween(random, 6, 9);
  const rowH = (height * 0.84) / rows;
  let start = left;
  for (let r = 0; r < rows; r += 1) {
    const y = height * 0.1 + r * rowH;
    start = Math.min(right - 20, start + between(random, 0, (right - left) * 0.12));
    const length = between(random, (right - left) * 0.15, (right - left) * 0.4);
    const end = Math.min(right, start + length);
    const live = start < today && end > today;
    shapes.push({ kind: 'bar', x: start, y, w: end - start, h: rowH * 0.5, layer: 1, weight: live ? 0.7 + random() * 0.2 : 0.05 + random() * 0.2 });
    shapes.push({ kind: 'dot', x: end, y: y + rowH * 0.25, r: 1.1, layer: 2, weight: live ? 0.6 : 0.03 });
  }
  shapes.push({ kind: 'line', x1: today, y1: height * 0.04, x2: today, y2: height * 0.96, layer: 2, weight: 1 });
  return shapes;
};

/** Day planner: a month of five weeks, events on some days, today lit. */
export const calendar: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const left = width * 0.06;
  const gridWidth = width * 0.88;
  const top = height * 0.26;
  const gridHeight = height * 0.68;
  const colW = gridWidth / 7;
  const rowH = gridHeight / 5;

  // Month title and the previous/next arrows.
  shapes.push({ kind: 'bar', x: left, y: height * 0.07, w: gridWidth * between(random, 0.22, 0.32), h: 3, layer: 2, weight: 0.35 });
  shapes.push({ kind: 'dot', x: left + gridWidth - 7, y: height * 0.1, r: 1, layer: 1, weight: 0.02 });
  shapes.push({ kind: 'dot', x: left + gridWidth - 2, y: height * 0.1, r: 1, layer: 1, weight: 0.02 });

  // Weekday initials.
  for (let col = 0; col < 7; col += 1) {
    shapes.push({ kind: 'bar', x: left + col * colW + 1.2, y: height * 0.19, w: colW * 0.3, h: 1.4, layer: 0, weight: 0 });
  }

  const lead = intBetween(random, 0, 5);
  const days = intBetween(random, 28, 31);
  const today = intBetween(random, 6, Math.min(days, 35 - lead) - 4);

  // A ruled grid, like the gantt: filled cells read as one heavy block.
  for (let col = 0; col <= 7; col += 1) {
    const x = left + col * colW;
    shapes.push({ kind: 'line', x1: x, y1: top, x2: x, y2: top + gridHeight, layer: 0, weight: 0 });
  }
  for (let row = 0; row <= 5; row += 1) {
    const y = top + row * rowH;
    shapes.push({ kind: 'line', x1: left, y1: y, x2: left + gridWidth, y2: y, layer: 0, weight: 0 });
  }

  for (let cell = 0; cell < 35; cell += 1) {
    const x = left + (cell % 7) * colW;
    const y = top + Math.floor(cell / 7) * rowH;

    const day = cell - lead + 1;
    if (day < 1 || day > days) continue;

    const isToday = day === today;
    if (isToday) {
      shapes.push({ kind: 'dot', x: x + 3.5, y: y + 3.4, r: 2.2, layer: 2, weight: 1 });
    } else {
      shapes.push({ kind: 'bar', x: x + 2, y: y + 2.4, w: 2.4, h: 1.6, layer: 1, weight: 0 });
    }

    // Busier around today, the way a real week fills up.
    const chance = Math.abs(day - today) < 4 ? 0.85 : 0.5;
    const events = isToday ? 2 : random() < chance ? intBetween(random, 1, 2) : 0;
    for (let e = 0; e < events; e += 1) {
      shapes.push({
        kind: 'bar',
        x: x + 1.6,
        y: y + rowH * 0.48 + e * 2.8,
        w: (colW - 3.2) * between(random, 0.5, 0.9),
        h: 1.8,
        layer: 1,
        weight: isToday ? 0.9 : 0.1 + random() * 0.5,
      });
    }
  }
  return shapes;
};

/** Plan usage meter: rows of tracks filled by how much is used, the fullest lit. */
export const usage: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const left = width * 0.08;
  const trackWidth = width * 0.84;
  const rows = intBetween(random, 3, 5);
  const top = height * 0.22;
  const rowH = (height * 0.72) / rows;
  const critical = intBetween(random, 0, rows - 1);

  // Panel title and the refresh button.
  shapes.push({ kind: 'bar', x: left, y: height * 0.07, w: trackWidth * between(random, 0.25, 0.35), h: 2.6, layer: 2, weight: 0.3 });
  shapes.push({ kind: 'ring', x: left + trackWidth - 2, y: height * 0.1, r: 2, layer: 1, weight: 0.02 });

  for (let row = 0; row < rows; row += 1) {
    const y = top + row * rowH;
    const used = row === critical ? between(random, 0.88, 0.97) : between(random, 0.12, 0.75);
    const trackY = y + rowH * 0.32;

    // Label on the left, percent on the right.
    shapes.push({ kind: 'bar', x: left, y, w: trackWidth * between(random, 0.15, 0.3), h: 1.8, layer: 1, weight: 0.05 + random() * 0.1 });
    shapes.push({ kind: 'bar', x: left + trackWidth * 0.9, y, w: trackWidth * 0.1, h: 1.8, layer: 1, weight: 0.05 + used * 0.2 });
    // The track and, drawn over it from the same start, the used part.
    shapes.push({ kind: 'bar', x: left, y: trackY, w: trackWidth, h: 2.2, layer: 0, weight: 0 });
    shapes.push({ kind: 'bar', x: left, y: trackY, w: trackWidth * used, h: 2.2, layer: 2, weight: row === critical ? 1 : used * 0.8 });
    // Reset countdown under the track.
    shapes.push({ kind: 'bar', x: left, y: trackY + 4, w: trackWidth * between(random, 0.2, 0.4), h: 1.2, layer: 0, weight: 0.02 });
  }

  const dust = intBetween(random, 12, 20);
  for (let i = 0; i < dust; i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height, r: 0.4, layer: 0, weight: 0 });
  }
  return shapes;
};

/** Gist search panel: a search field, visibility chips, a list of snippets with language pills, one selected. */
export const gists: Motif = (random, { width, height }) => {
  const shapes: Shape[] = [];
  const left = width * 0.08;
  const right = width * 0.92;

  // Search field and the "new gist" button beside it.
  shapes.push(...outline(left, height * 0.06, (right - left) * 0.7, height * 0.12, 1, 0.08));
  shapes.push({ kind: 'bar', x: left + 3, y: height * 0.11, w: (right - left) * 0.18, h: 1.4, layer: 0, weight: 0.3 });
  shapes.push(...outline(left + (right - left) * 0.75, height * 0.06, (right - left) * 0.25, height * 0.12, 1, 0.12));

  // Visibility chips: all, public, secret.
  let chipX = left;
  for (let chip = 0; chip < 3; chip += 1) {
    const w = (right - left) * between(random, 0.1, 0.14);
    shapes.push({ kind: 'bar', x: chipX, y: height * 0.25, w, h: 2, layer: chip === 0 ? 2 : 1, weight: chip === 0 ? 0.35 : 0.06 });
    chipX += w + 4;
  }

  const rows = intBetween(random, 4, 6);
  const top = height * 0.36;
  const rowH = (height * 0.6) / rows;
  const selected = intBetween(random, 0, rows - 1);

  for (let row = 0; row < rows; row += 1) {
    const y = top + row * rowH;
    const lit = row === selected;
    const pillW = (right - left) * between(random, 0.08, 0.13);

    // The </> glyph, the title, the file names under it, and the language pill.
    shapes.push({ kind: 'dot', x: left + 1.2, y: y + 1.5, r: 1, layer: 1, weight: lit ? 0.5 : 0.03 });
    shapes.push({ kind: 'bar', x: left + 5, y, w: (right - left) * between(random, 0.3, 0.55), h: 2, layer: lit ? 2 : 1, weight: lit ? 1 : 0.04 + random() * 0.05 });
    shapes.push({ kind: 'bar', x: left + 5, y: y + 3.6, w: (right - left) * between(random, 0.12, 0.3), h: 1.2, layer: lit ? 1 : 0, weight: lit ? 0.4 : 0.02 });
    shapes.push({ kind: 'bar', x: right - pillW, y: y - 0.5, w: pillW, h: 3, layer: lit ? 2 : 0, weight: lit ? 0.6 : 0.03 });
  }

  const dust = intBetween(random, 8, 14);
  for (let i = 0; i < dust; i += 1) {
    shapes.push({ kind: 'dot', x: random() * width, y: random() * height, r: 0.4, layer: 0, weight: 0 });
  }
  return shapes;
};
