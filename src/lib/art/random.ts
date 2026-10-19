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

export const between = (random: Random, min: number, max: number): number => min + random() * (max - min);

export const intBetween = (random: Random, min: number, max: number): number =>
  Math.floor(between(random, min, max + 1));
