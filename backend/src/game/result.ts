import type { GameState, PlayerId, Score } from './types.js';

export type Winner = PlayerId | 'draw';

/** Vence o maior total; totais iguais dão empate. */
export function decideWinner(scores: Record<PlayerId, Score>): Winner {
  if (scores.p1.total > scores.p2.total) return 'p1';
  if (scores.p2.total > scores.p1.total) return 'p2';
  return 'draw';
}

/** Resultado de uma partida terminada, ou `null` se ela ainda não acabou. */
export function getResult(state: GameState): Winner | null {
  return state.status === 'finished' ? decideWinner(state.scores) : null;
}
