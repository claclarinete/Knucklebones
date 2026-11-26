import { COLUMN_SIZE } from './board.js';
import { applyMove, opponentOf } from './game.js';
import type { Column, Die, Difficulty, GameState, PlayerId, Rng } from './types.js';

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

const DIE_FACES: readonly Die[] = [1, 2, 3, 4, 5, 6];
const WIN_BONUS = 1000;

/** Quantas jogadas depois da atual o difícil considera. */
export const HARD_SEARCH_DEPTH = 3;

/** Aplica a jogada sem rolar o próximo dado: quem chama decide o valor. */
function simulate(state: GameState, column: Column): GameState {
  const result = applyMove(state, state.currentPlayer, column, () => 0);
  return result.ok ? result.state : state;
}

/** Vantagem de `me` no placar, com bônus decisivo para partidas terminadas. */
function evaluate(state: GameState, me: PlayerId): number {
  const diff = state.scores[me].total - state.scores[opponentOf(me)].total;
  if (state.status !== 'finished') return diff;
  return diff + Math.sign(diff) * WIN_BONUS;
}

/** Nó de acaso: média sobre os 6 valores possíveis do próximo dado. */
function chanceValue(state: GameState, depth: number, me: PlayerId): number {
  if (state.status === 'finished' || depth === 0) return evaluate(state, me);

  let sum = 0;
  for (const die of DIE_FACES) {
    sum += decisionValue({ ...state, die }, depth, me);
  }
  return sum / DIE_FACES.length;
}

/** Nó de decisão: `me` maximiza a vantagem e o adversário a minimiza. */
function decisionValue(state: GameState, depth: number, me: PlayerId): number {
  const values = validColumns(state).map((column) =>
    chanceValue(simulate(state, column), depth - 1, me),
  );
  return state.currentPlayer === me ? Math.max(...values) : Math.min(...values);
}

/**
 * Difícil: expectiminimax. Considera as próximas jogadas dos dois jogadores
 * e, entre elas, os 6 valores possíveis do dado.
 */
function chooseHard(state: GameState, rng: Rng): Column {
  const me = state.currentPlayer;
  const options = validColumns(state).map((column) => ({
    column,
    value: chanceValue(simulate(state, column), HARD_SEARCH_DEPTH, me),
  }));
  const best = Math.max(...options.map((option) => option.value));
  return pickRandom(
    options.filter((option) => best - option.value < 1e-9).map((option) => option.column),
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
      return chooseMedium(state, rng);
    case 'hard':
      return chooseHard(state, rng);
  }
}
