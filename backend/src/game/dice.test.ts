import { describe, expect, it } from 'vitest';
import { createSeededRng, rollDie } from './dice.js';

function rollMany(seed: number, count: number) {
  const rng = createSeededRng(seed);
  return Array.from({ length: count }, () => rollDie(rng));
}

describe('rollDie', () => {
  it.each([
    [0, 1],
    [0.17, 2],
    [0.34, 3],
    [0.5, 4],
    [0.67, 5],
    [0.9999, 6],
  ])('com o gerador em %d, tira %d', (value, expected) => {
    expect(rollDie(() => value)).toBe(expected);
  });

  it('só produz valores de 1 a 6, e todos aparecem', () => {
    expect(new Set(rollMany(42, 600))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('funciona sem gerador informado', () => {
    expect([1, 2, 3, 4, 5, 6]).toContain(rollDie());
  });
});

describe('createSeededRng', () => {
  it('repete a mesma sequência para a mesma semente', () => {
    expect(rollMany(7, 20)).toEqual(rollMany(7, 20));
  });

  it('produz sequências diferentes para sementes diferentes', () => {
    expect(rollMany(7, 20)).not.toEqual(rollMany(8, 20));
  });

  it('gera números no intervalo [0, 1)', () => {
    const rng = createSeededRng(123);
    const values = Array.from({ length: 1000 }, rng);

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});
