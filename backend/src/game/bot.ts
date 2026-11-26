import { COLUMN_SIZE } from './board.js';
import { applyMove, opponentOf } from './game.js';
import type { Column, Difficulty, GameState, Rng } from './types.js';

const ALL_COLUMNS: readonly Column[] = [0, 1, 2];

/** Colunas com espaço no tabuleiro do jogador. */
export function validColumns(state: GameState, player = state.currentPlayer): Column[] {
  return ALL_COLUMNS.filter((column) => state.boards[player][column].length < COLUMN_SIZE);
}

function pickRandom<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

/** Fácil: qualquer coluna com espaço, ao acaso. */
function chooseEasy(state: GameState, rng: Rng): Column {
  return pickRandom(validColumns(state), rng);
}

/** Pontos que a jogada soma para quem joga mais os que tira do adversário. */
function immediateValue(state: GameState, column: Column): number {
  const player = state.currentPlayer;
  const opponent = opponentOf(player);
  const result = applyMove(state, player, column, () => 0);
  if (!result.ok) return Number.NEGATIVE_INFINITY;

  const gained = result.state.scores[player].total - state.scores[player].total;
  const taken = state.scores[opponent].total - result.state.scores[opponent].total;
  return gained + taken;
}

/** Médio: a coluna de maior ganho imediato; empates são decididos ao acaso. */
function chooseMedium(state: GameState, rng: Rng): Column {
  const options = validColumns(state).map((column) => ({
    column,
    value: immediateValue(state, column),
  }));
  const best = Math.max(...options.map((option) => option.value));
  return pickRandom(
    options.filter((option) => option.value === best).map((option) => option.column),
    rng,
  );
}

/**
 * Escolhe a coluna do jogador da vez para o dado atual.
 * Nunca escolhe coluna cheia. Lança erro se a partida não estiver em andamento.
 */
export function chooseColumn(
  state: GameState,
  difficulty: Difficulty,
  rng: Rng = Math.random,
): Column {
  if (state.status !== 'playing' || state.die === null) {
    throw new Error('O bot só joga com a partida em andamento');
  }
  switch (difficulty) {
    case 'easy':
      return chooseEasy(state, rng);
    case 'medium':
    case 'hard':
      return chooseMedium(state, rng);
  }
}
