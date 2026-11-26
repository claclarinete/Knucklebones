// Tipos do contrato em docs/contrato-socket.md.
export type Die = 1 | 2 | 3 | 4 | 5 | 6;
export type Board = [Die[], Die[], Die[]];

export type PlayerId = 'p1' | 'p2';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Score = { columns: [number, number, number]; total: number };

export interface GameState {
  status: 'playing' | 'paused' | 'finished';
  boards: Record<PlayerId, Board>;
  scores: Record<PlayerId, Score>;
  currentPlayer: PlayerId;
  die: Die | null;
}

export interface PlayerInfo {
  nickname: string;
  bot?: Difficulty;
}

export interface GameStart {
  code: string;
  playerToken: string;
  you: PlayerId;
  players: Record<PlayerId, PlayerInfo>;
  state: GameState;
}

export type Column = 0 | 1 | 2;
export type MotivoDeJogadaRecusada =
  | 'not_your_turn'
  | 'column_full'
  | 'game_not_active'
  | 'invalid_payload';

export interface GameOver {
  winner: PlayerId | 'draw';
  scores: Record<PlayerId, Score>;
  reason: 'finished' | 'forfeit' | 'disconnect';
}
