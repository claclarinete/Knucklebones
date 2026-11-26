// Tipos do contrato em docs/contrato-socket.md. Altere os dois juntos.

export type PlayerId = 'p1' | 'p2';
export type Column = 0 | 1 | 2;
export type Die = 1 | 2 | 3 | 4 | 5 | 6;

/** Cada coluna tem de 0 a 3 dados, na ordem de colocação. */
export type Board = [Die[], Die[], Die[]];

export interface Score {
  columns: [number, number, number];
  total: number;
}

export type GameStatus = 'playing' | 'paused' | 'finished';

export interface GameState {
  status: GameStatus;
  boards: Record<PlayerId, Board>;
  scores: Record<PlayerId, Score>;
  currentPlayer: PlayerId;
  /** Dado da vez; `null` quando a partida terminou. */
  die: Die | null;
}

/** Gerador de números aleatórios no intervalo [0, 1), como `Math.random`. */
export type Rng = () => number;
