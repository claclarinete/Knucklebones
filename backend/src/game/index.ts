// API pública das regras do jogo. Código puro: sem rede, socket ou temporizador.
export { COLUMN_COUNT, COLUMN_SIZE, isValidColumn } from './board.js';
export { createSeededRng, rollDie } from './dice.js';
export { applyMove, createGame, opponentOf, type MoveError, type MoveResult } from './game.js';
export { decideWinner, getResult, type Winner } from './result.js';
export { scoreBoard, scoreColumn } from './score.js';
export { chooseColumn, validColumns } from './bot.js';
export { DIFFICULTIES } from './types.js';
export type {
  Board,
  Column,
  Die,
  Difficulty,
  GameState,
  GameStatus,
  PlayerId,
  Rng,
  Score,
} from './types.js';
