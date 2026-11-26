import { describe, expect, it } from 'vitest';
import { chooseColumn, validColumns } from './bot.js';
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
  });
});
