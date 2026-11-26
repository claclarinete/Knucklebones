import { describe, expect, it } from 'vitest';
import { applyMove } from './game.js';
import { decideWinner, getResult, type Winner } from './result.js';
import { scoreBoard } from './score.js';
import type { Board, GameState, Score } from './types.js';

const score = (total: number): Score => ({ columns: [total, 0, 0], total });

function playingState(p1: Board, p2: Board): GameState {
  return {
    status: 'playing',
    boards: { p1, p2 },
    scores: { p1: scoreBoard(p1), p2: scoreBoard(p2) },
    currentPlayer: 'p1',
    die: 6,
  };
}

describe('decideWinner', () => {
  it.each<[number, number, Winner]>([
    [30, 20, 'p1'],
    [12, 40, 'p2'],
    [25, 25, 'draw'],
    [0, 0, 'draw'],
  ])('com %d a %d, o resultado é %s', (p1, p2, expected) => {
    expect(decideWinner({ p1: score(p1), p2: score(p2) })).toBe(expected);
  });
});

describe('getResult', () => {
  it('é nulo enquanto a partida está em andamento', () => {
    expect(getResult(playingState([[], [], []], [[], [], []]))).toBeNull();
  });

  it('é nulo com a partida pausada', () => {
    expect(getResult({ ...playingState([[], [], []], [[], [], []]), status: 'paused' })).toBeNull();
  });

  it('dá a vitória a quem tem mais pontos no fim', () => {
    const state = playingState([[6, 6, 6], [5, 5, 5], [4, 4]], [[1], [2], [3]]);

    const result = applyMove(state, 'p1', 2);

    expect(result.ok && getResult(result.state)).toBe('p1');
  });

  it('considera os dados destruídos na última jogada', () => {
    const state = playingState([[1, 1, 1], [1, 1, 1], [1, 1]], [[], [], [6, 6, 6]]);

    const result = applyMove(state, 'p1', 2);

    expect(result.ok && getResult(result.state)).toBe('p1');
  });

  it('declara empate com totais iguais no fim', () => {
    // p1 termina com 18 + 6 + 26 = 50; p2 tem 45 + 5 + 0 = 50.
    const state = playingState([[2, 2, 2], [1, 2, 3], [5, 5]], [[5, 5, 5], [5], []]);

    const result = applyMove(state, 'p1', 2);

    expect(result.ok && getResult(result.state)).toBe('draw');
  });
});
