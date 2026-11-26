import { describe, expect, it } from 'vitest';
import { applyMove, createGame, type MoveResult, opponentOf } from './game.js';
import { scoreBoard } from './score.js';
import type { Board, Die, GameState, PlayerId } from './types.js';

/** Valor do gerador que faz `rollDie` tirar `die`. */
const forDie = (die: Die) => (die - 0.5) / 6;
const P1_STARTS = 0.1;
const P2_STARTS = 0.9;

/** Gerador que devolve os valores informados, em ordem e em ciclo. */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length]!;
}

function makeState(overrides: {
  p1?: Board;
  p2?: Board;
  currentPlayer?: PlayerId;
  die?: Die | null;
  status?: GameState['status'];
}): GameState {
  const boards = { p1: overrides.p1 ?? [[], [], []], p2: overrides.p2 ?? [[], [], []] };
  return {
    status: overrides.status ?? 'playing',
    boards,
    scores: { p1: scoreBoard(boards.p1), p2: scoreBoard(boards.p2) },
    currentPlayer: overrides.currentPlayer ?? 'p1',
    die: overrides.die === undefined ? 1 : overrides.die,
  };
}

/** Confirma que a jogada foi aceita e devolve o novo estado. */
function expectOk(result: MoveResult): GameState {
  expect(result).toMatchObject({ ok: true });
  return (result as Extract<MoveResult, { ok: true }>).state;
}

describe('opponentOf', () => {
  it.each<[PlayerId, PlayerId]>([
    ['p1', 'p2'],
    ['p2', 'p1'],
  ])('o adversário de %s é %s', (player, expected) => {
    expect(opponentOf(player)).toBe(expected);
  });
});

describe('createGame', () => {
  it('começa em andamento, com tabuleiros vazios e placar zerado', () => {
    const state = createGame(sequence(P1_STARTS, forDie(3)));

    expect(state).toMatchObject({
      status: 'playing',
      boards: { p1: [[], [], []], p2: [[], [], []] },
      scores: {
        p1: { columns: [0, 0, 0], total: 0 },
        p2: { columns: [0, 0, 0], total: 0 },
      },
    });
  });

  it.each<[number, PlayerId]>([
    [P1_STARTS, 'p1'],
    [P2_STARTS, 'p2'],
  ])('com o sorteio em %d, começa %s', (draw, expected) => {
    expect(createGame(sequence(draw, forDie(1))).currentPlayer).toBe(expected);
  });

  it('rola o primeiro dado', () => {
    expect(createGame(sequence(P1_STARTS, forDie(5))).die).toBe(5);
  });

  it('não compartilha tabuleiros entre os jogadores', () => {
    const state = createGame(sequence(P1_STARTS, forDie(1)));

    expect(state.boards.p1).not.toBe(state.boards.p2);
  });
});

describe('applyMove', () => {
  it('coloca o dado da vez na coluna escolhida', () => {
    const state = makeState({ die: 4 });

    const next = expectOk(applyMove(state, 'p1', 2, sequence(forDie(1))));

    expect(next.boards.p1).toEqual([[], [], [4]]);
  });

  it('passa a vez para o adversário', () => {
    const state = makeState({ currentPlayer: 'p2' });

    expect(expectOk(applyMove(state, 'p2', 0, sequence(forDie(1)))).currentPlayer).toBe('p1');
  });

  it('rola um novo dado para o próximo turno', () => {
    const state = makeState({ die: 2 });

    expect(expectOk(applyMove(state, 'p1', 0, sequence(forDie(6)))).die).toBe(6);
  });

  it('destrói os dados iguais na coluna correspondente do adversário', () => {
    const state = makeState({ die: 3, p2: [[5], [3, 1, 3], [3]] });

    expect(expectOk(applyMove(state, 'p1', 1)).boards.p2).toEqual([[5], [1], [3]]);
  });

  it('recalcula o placar dos dois jogadores', () => {
    const state = makeState({ die: 4, p1: [[4], [], []], p2: [[4, 2], [], []] });

    expect(expectOk(applyMove(state, 'p1', 0)).scores).toEqual({
      p1: { columns: [16, 0, 0], total: 16 },
      p2: { columns: [2, 0, 0], total: 2 },
    });
  });

  it('não altera o estado recebido', () => {
    const state = makeState({ die: 3, p2: [[3], [], []] });
    const before = structuredClone(state);

    applyMove(state, 'p1', 0);

    expect(state).toEqual(before);
  });

  it('recusa a jogada de quem não está na vez', () => {
    const state = makeState({ currentPlayer: 'p1' });

    expect(applyMove(state, 'p2', 0)).toEqual({ ok: false, reason: 'not_your_turn' });
  });

  it('recusa coluna cheia', () => {
    const state = makeState({ p1: [[1, 2, 3], [], []] });

    expect(applyMove(state, 'p1', 0)).toEqual({ ok: false, reason: 'column_full' });
  });

  it.each([-1, 3, 1.5, '0', null])('recusa a coluna inexistente %s', (column) => {
    expect(applyMove(makeState({}), 'p1', column)).toEqual({
      ok: false,
      reason: 'invalid_column',
    });
  });

  it.each<[GameState['status'], Die | null]>([
    ['paused', 1],
    ['finished', null],
  ])('recusa jogadas com a partida %s', (status, die) => {
    const state = makeState({ status, die });

    expect(applyMove(state, 'p1', 0)).toEqual({ ok: false, reason: 'game_not_active' });
  });

  describe('quando o tabuleiro de quem jogou enche', () => {
    const full = makeState({ die: 6, p1: [[1, 2, 3], [4, 5, 6], [1, 2]], p2: [[], [], [6, 1]] });
    const finished = () => expectOk(applyMove(full, 'p1', 2, sequence(forDie(1))));

    it('termina a partida', () => {
      expect(finished().status).toBe('finished');
    });

    it('não rola novo dado', () => {
      expect(finished().die).toBeNull();
    });

    it('ainda destrói os dados do adversário antes do placar final', () => {
      expect(finished().scores.p2.total).toBe(1);
    });
  });

  it('não termina a partida enquanto ainda há espaço', () => {
    const state = makeState({ p1: [[1, 2, 3], [4, 5, 6], []] });

    expect(expectOk(applyMove(state, 'p1', 2)).status).toBe('playing');
  });
});
