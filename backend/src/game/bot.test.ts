import { describe, expect, it } from 'vitest';
import { chooseColumn, validColumns } from './bot.js';
import { createSeededRng } from './dice.js';
import { applyMove, createGame } from './game.js';
import { getResult, type Winner } from './result.js';
import { scoreBoard } from './score.js';
import type { Board, Column, Die, Difficulty, GameState } from './types.js';

/** Estado com o bot (p2) na vez, segurando o dado `die`. */
function botTurn(die: Die, bot: Board, human: Board = [[], [], []]): GameState {
  return {
    status: 'playing',
    boards: { p1: human, p2: bot },
    scores: { p1: scoreBoard(human), p2: scoreBoard(bot) },
    currentPlayer: 'p2',
    die,
  };
}

/** Joga uma partida inteira entre duas dificuldades (p1 contra p2) e devolve o resultado. */
function playMatch(p1: Difficulty, p2: Difficulty, seed: number): Winner {
  const rng = createSeededRng(seed);
  let state = createGame(rng);
  while (state.status === 'playing') {
    const difficulty = state.currentPlayer === 'p1' ? p1 : p2;
    const result = applyMove(state, state.currentPlayer, chooseColumn(state, difficulty, rng), rng);
    if (!result.ok) throw new Error(`Bot fez jogada recusada: ${result.reason}`);
    state = result.state;
  }
  return getResult(state)!;
}

function tally(p1: Difficulty, p2: Difficulty, games: number) {
  const results = Array.from({ length: games }, (_, index) => playMatch(p1, p2, index + 1));
  return {
    wins: results.filter((winner) => winner === 'p1').length,
    losses: results.filter((winner) => winner === 'p2').length,
  };
}

const FIRST = () => 0;
const LAST = () => 0.9999;

describe('validColumns', () => {
  it('lista as colunas com espaço do jogador da vez', () => {
    expect(validColumns(botTurn(1, [[1, 2, 3], [], [4, 5, 6]]))).toEqual([1]);
  });

  it('aceita escolher o jogador', () => {
    expect(validColumns(botTurn(1, [[], [], []], [[1, 1, 1], [], []]), 'p1')).toEqual([1, 2]);
  });
});

describe('chooseColumn', () => {
  it.each<Difficulty>(['easy', 'medium', 'hard'])('no %s, nunca escolhe coluna cheia', (difficulty) => {
    const state = botTurn(6, [[1, 2, 3], [4, 5, 6], [1]]);

    expect(chooseColumn(state, difficulty, LAST)).toBe(2);
  });

  it.each<Difficulty>(['easy', 'medium', 'hard'])('no %s, recusa jogar com a partida encerrada', (difficulty) => {
    const state: GameState = { ...botTurn(1, [[], [], []]), status: 'finished', die: null };

    expect(() => chooseColumn(state, difficulty)).toThrow('partida em andamento');
  });

  describe('fácil', () => {
    it.each<[() => number, Column]>([
      [FIRST, 1],
      [LAST, 2],
    ])('sorteia entre as colunas com espaço', (rng, expected) => {
      expect(chooseColumn(botTurn(3, [[1, 2, 3], [], []]), 'easy', rng)).toBe(expected);
    });
  });

  describe('médio', () => {
    it('destrói a coluna mais valiosa do adversário', () => {
      const state = botTurn(5, [[], [], []], [[2], [5, 5], [5]]);

      expect(chooseColumn(state, 'medium', FIRST)).toBe(1);
    });

    it('junta dados iguais para multiplicar os próprios pontos', () => {
      const state = botTurn(4, [[1], [4, 4], [2]]);

      expect(chooseColumn(state, 'medium', FIRST)).toBe(1);
    });

    it('soma o ganho próprio com a perda causada', () => {
      // Coluna 0: ganha 3×4 − 3 = 9 e não tira nada. Coluna 2: ganha 3 e tira 3×4 = 12.
      const state = botTurn(3, [[3], [], []], [[], [], [3, 3]]);

      expect(chooseColumn(state, 'medium', FIRST)).toBe(2);
    });

    it.each<[() => number, Column]>([
      [FIRST, 0],
      [LAST, 2],
    ])('sorteia entre as colunas empatadas', (rng, expected) => {
      expect(chooseColumn(botTurn(2, [[], [], []]), 'medium', rng)).toBe(expected);
    });

    it('vence a maioria das partidas contra o fácil', () => {
      const { wins } = tally('medium', 'easy', 10);

      expect(wins).toBeGreaterThanOrEqual(7);
    });
  });

  describe('difícil', () => {
    it('destrói a coluna mais valiosa do adversário', () => {
      const state = botTurn(5, [[], [], []], [[2], [5, 5, 5], [1]]);

      expect(chooseColumn(state, 'hard', FIRST)).toBe(1);
    });

    it.each<[string, GameState]>([
      ['no começo da partida', botTurn(3, [[], [], []])],
      ['no meio da partida', botTurn(4, [[1, 4], [6], [2, 2]], [[3], [5, 5], [6, 1]])],
      ['perto do fim', botTurn(6, [[1, 2, 3], [4, 5], [6]], [[2, 2, 3], [1, 5, 5], [4]])],
    ])('responde em menos de 1 segundo %s', (_moment, state) => {
      const startedAt = performance.now();

      chooseColumn(state, 'hard', FIRST);

      expect(performance.now() - startedAt).toBeLessThan(1000);
    });

    it('vence a maioria das partidas contra o fácil', () => {
      const { wins } = tally('hard', 'easy', 10);

      expect(wins).toBeGreaterThanOrEqual(7);
    }, 20_000);

    it('vence mais do que perde contra o médio', () => {
      const { wins, losses } = tally('hard', 'medium', 20);

      expect(wins).toBeGreaterThan(losses);
    }, 30_000);
  });
});
