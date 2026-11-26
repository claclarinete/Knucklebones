import {
  createBoard,
  isBoardFull,
  isColumnFull,
  isValidColumn,
  placeDie,
  removeMatching,
} from './board.js';
import { rollDie } from './dice.js';
import { scoreBoard } from './score.js';
import type { GameState, PlayerId, Rng } from './types.js';

/**
 * Motivos de recusa de uma jogada. `invalid_column` só ocorre se a camada de
 * socket deixar passar uma coluna fora de 0 a 2; lá ela vira `invalid_payload`.
 */
export type MoveError = 'game_not_active' | 'not_your_turn' | 'invalid_column' | 'column_full';

export type MoveResult = { ok: true; state: GameState } | { ok: false; reason: MoveError };

export function opponentOf(player: PlayerId): PlayerId {
  return player === 'p1' ? 'p2' : 'p1';
}

/** Cria uma partida: sorteia quem começa e rola o primeiro dado. */
export function createGame(rng: Rng = Math.random): GameState {
  const currentPlayer: PlayerId = rng() < 0.5 ? 'p1' : 'p2';
  const boards = { p1: createBoard(), p2: createBoard() };

  return {
    status: 'playing',
    boards,
    scores: { p1: scoreBoard(boards.p1), p2: scoreBoard(boards.p2) },
    currentPlayer,
    die: rollDie(rng),
  };
}

/**
 * Aplica a jogada de `player` na coluna escolhida, sem alterar o estado recebido.
 * Coloca o dado, destrói os iguais na coluna do adversário e recalcula o placar.
 * Se o tabuleiro de quem jogou encher, a partida termina; senão a vez passa e
 * um novo dado é rolado.
 */
export function applyMove(
  state: GameState,
  player: PlayerId,
  column: unknown,
  rng: Rng = Math.random,
): MoveResult {
  if (state.status !== 'playing' || state.die === null) {
    return { ok: false, reason: 'game_not_active' };
  }
  if (player !== state.currentPlayer) {
    return { ok: false, reason: 'not_your_turn' };
  }
  if (!isValidColumn(column)) {
    return { ok: false, reason: 'invalid_column' };
  }
  if (isColumnFull(state.boards[player], column)) {
    return { ok: false, reason: 'column_full' };
  }

  const opponent = opponentOf(player);
  const boards = {
    [player]: placeDie(state.boards[player], column, state.die),
    [opponent]: removeMatching(state.boards[opponent], column, state.die),
  } as GameState['boards'];
  const scores = { p1: scoreBoard(boards.p1), p2: scoreBoard(boards.p2) };

  if (isBoardFull(boards[player])) {
    return {
      ok: true,
      state: { status: 'finished', boards, scores, currentPlayer: player, die: null },
    };
  }

  return {
    ok: true,
    state: { status: 'playing', boards, scores, currentPlayer: opponent, die: rollDie(rng) },
  };
}
