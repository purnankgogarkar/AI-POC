/**
 * Deterministic, seeded PRNG utilities. Every synthetic dataset in this app
 * is generated from a fixed seed so the demo is reproducible — re-running
 * `npm run seed` produces byte-identical data.
 */

export type Rng = () => number;

/** mulberry32 — small, fast, good-enough-for-synthetic-data PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive a stable numeric seed from a string (e.g. an entity id). */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function randFloat(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(randFloat(rng, min, max + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

export function weightedPick<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

/** Approximate standard normal via sum of uniforms (Irwin–Hall / CLT trick). */
export function gaussian(rng: Rng, mean = 0, stdDev = 1): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rng();
  return mean + (sum - 3) * stdDev;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
