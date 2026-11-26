import type { Board, Column, Die } from './types.js';

export const COLUMN_COUNT = 3;
export const COLUMN_SIZE = 3;

export function createBoard(): Board {
  return [[], [], []];
}

/** Verifica se um valor recebido é um índice de coluna existente. */
export function isValidColumn(value: unknown): value is Column {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < COLUMN_COUNT;
}

export function isColumnFull(board: Board, column: Column): boolean {
  return board[column].length >= COLUMN_SIZE;
}

export function isBoardFull(board: Board): boolean {
  return board.every((dice) => dice.length >= COLUMN_SIZE);
}

/**
 * Devolve um novo tabuleiro com o dado no fim da coluna.
 * Não altera o tabuleiro recebido. Quem chama deve garantir que a coluna tem espaço.
 */
export function placeDie(board: Board, column: Column, die: Die): Board {
  if (isColumnFull(board, column)) {
    throw new RangeError(`A coluna ${column} está cheia`);
  }
  return board.map((dice, index) => (index === column ? [...dice, die] : [...dice])) as Board;
}
