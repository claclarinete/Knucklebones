import { describe, expect, it } from 'vitest';
import {
  applyMove,
  COLUMN_SIZE,
  createGame,
  createSeededRng,
  type GameState,
  getResult,
  type Column,
} from './index.js';

const MAX_MOVES = 200;

/** Joga sempre na primeira coluna com espaço até a partida acabar. */
function playWholeGame(seed: number) {
  const rng = createSeededRng(seed);
  let state: GameState = createGame(rng);
  let moves = 0;

  while (state.status === 'playing' && moves < MAX_MOVES) {
    const board = state.boards[state.currentPlayer];
    const column = board.findIndex((dice) => dice.length < COLUMN_SIZE) as Column;
    const result = applyMove(state, state.currentPlayer, column, rng);
    if (!result.ok) throw new Error(`Jogada recusada: ${result.reason}`);
    state = result.state;
    moves += 1;
  }
  return { state, moves };
}

describe('partida completa pela API pública', () => {
  it.each([1, 2, 3, 42, 2026])('com a semente %d, a partida termina com um resultado', (seed) => {
    const { state } = playWholeGame(seed);

    expect(getResult(state)).toMatch(/^(p1|p2|draw)$/);
  });

  it('a mesma semente produz exatamente a mesma partida', () => {
    expect(playWholeGame(42)).toEqual(playWholeGame(42));
  });
});
