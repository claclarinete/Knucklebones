import { describe, expect, it } from 'vitest';
import { createBoard, isBoardFull, isColumnFull, isValidColumn, placeDie } from './board.js';
import type { Board } from './types.js';

describe('createBoard', () => {
  it('cria 3 colunas vazias', () => {
    expect(createBoard()).toEqual([[], [], []]);
  });
});

describe('isValidColumn', () => {
  it.each([0, 1, 2])('aceita a coluna %d', (column) => {
    expect(isValidColumn(column)).toBe(true);
  });

  it.each([-1, 3, 1.5, Number.NaN, '1', null, undefined])('recusa %s', (value) => {
    expect(isValidColumn(value)).toBe(false);
  });
});

describe('placeDie', () => {
  it('coloca o dado no fim da coluna escolhida', () => {
    const board: Board = [[2], [], [5]];

    expect(placeDie(board, 0, 6)).toEqual([[2, 6], [], [5]]);
  });

  it('não altera o tabuleiro recebido', () => {
    const board: Board = [[2], [], [5]];

    placeDie(board, 1, 3);

    expect(board).toEqual([[2], [], [5]]);
  });

  it('recusa coluna cheia sem alterar o tabuleiro', () => {
    const board: Board = [[1, 2, 3], [], []];

    expect(() => placeDie(board, 0, 4)).toThrow(RangeError);
    expect(board).toEqual([[1, 2, 3], [], []]);
  });
});

describe('isColumnFull', () => {
  it.each<[Board, boolean]>([
    [[[], [], []], false],
    [[[1, 2], [], []], false],
    [[[1, 2, 3], [], []], true],
  ])('para %j, a coluna 0 cheia é %s', (board, expected) => {
    expect(isColumnFull(board, 0)).toBe(expected);
  });
});

describe('isBoardFull', () => {
  it('é falso enquanto alguma coluna tem espaço', () => {
    expect(isBoardFull([[1, 2, 3], [4, 5, 6], [1, 2]])).toBe(false);
  });

  it('é verdadeiro com as 9 posições ocupadas', () => {
    expect(isBoardFull([[1, 2, 3], [4, 5, 6], [1, 2, 3]])).toBe(true);
  });
});
