import { describe, expect, it } from 'vitest';
import { scoreBoard, scoreColumn } from './score.js';
import type { Die } from './types.js';

describe('scoreColumn', () => {
  it.each<[Die[], number]>([
    [[4, 4, 4], 36],
    [[4, 4, 2], 18],
    [[1, 2, 3], 6],
  ])('%j vale %d (exemplos da especificação)', (dice, expected) => {
    expect(scoreColumn(dice)).toBe(expected);
  });

  it.each<[Die[], number]>([
    [[], 0],
    [[5], 5],
    [[6, 6], 24],
    [[2, 4, 2], 12],
  ])('%j vale %d', (dice, expected) => {
    expect(scoreColumn(dice)).toBe(expected);
  });

  it('não depende da ordem dos dados', () => {
    expect(scoreColumn([2, 4, 4])).toBe(scoreColumn([4, 2, 4]));
  });
});

describe('scoreBoard', () => {
  it('pontua cada coluna e soma as 3 no total', () => {
    expect(scoreBoard([[4, 4, 4], [4, 4, 2], [1, 2, 3]])).toEqual({
      columns: [36, 18, 6],
      total: 60,
    });
  });

  it('tabuleiro vazio vale zero', () => {
    expect(scoreBoard([[], [], []])).toEqual({ columns: [0, 0, 0], total: 0 });
  });
});
