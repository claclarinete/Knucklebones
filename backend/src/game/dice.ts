import type { Die, Rng } from './types.js';

const FACES = 6;

/**
 * Cria um gerador determinístico (mulberry32): a mesma semente produz sempre
 * a mesma sequência. Usado nos testes e com `DICE_SEED`.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Rola um dado de 6 faces usando o gerador informado. */
export function rollDie(rng: Rng = Math.random): Die {
  return (Math.floor(rng() * FACES) + 1) as Die;
}
