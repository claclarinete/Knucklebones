import type { Board, Die, Score } from './types.js';

/** Soma `valor × quantidade²` para cada valor distinto da coluna. */
export function scoreColumn(dice: readonly Die[]): number {
  const counts = new Map<Die, number>();
  for (const die of dice) {
    counts.set(die, (counts.get(die) ?? 0) + 1);
  }

  let total = 0;
  for (const [value, count] of counts) {
    total += value * count * count;
  }
  return total;
}

export function scoreBoard(board: Board): Score {
  const columns: Score['columns'] = [
    scoreColumn(board[0]),
    scoreColumn(board[1]),
    scoreColumn(board[2]),
  ];
  return { columns, total: columns[0] + columns[1] + columns[2] };
}
