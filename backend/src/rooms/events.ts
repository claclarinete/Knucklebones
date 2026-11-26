import type { Difficulty, GameState, PlayerId, Score } from '../game/index.js';

// Eventos do Socket.IO conforme docs/contrato-socket.md. Altere os dois juntos.

export interface PlayerInfo {
  nickname: string;
  /** Presente apenas no assento do bot. */
  bot?: Difficulty;
}

export type RoomErrorReason = 'not_found' | 'full' | 'invalid_token' | 'invalid_payload';
export type GameErrorReason = 'not_your_turn' | 'column_full' | 'game_not_active' | 'invalid_payload';
export type GameOverReason = 'finished' | 'forfeit' | 'disconnect';

export interface GameStartPayload {
  code: string;
  playerToken: string;
  you: PlayerId;
  players: Record<PlayerId, PlayerInfo>;
  state: GameState;
}

export interface GameOverPayload {
  winner: PlayerId | 'draw';
  scores: Record<PlayerId, Score>;
  reason: GameOverReason;
}

export interface ServerToClientEvents {
  'queue:waiting': () => void;
  'room:created': (payload: { code: string; playerToken: string }) => void;
  'room:error': (payload: { reason: RoomErrorReason }) => void;
  'game:start': (payload: GameStartPayload) => void;
  'game:state': (payload: { state: GameState }) => void;
  'game:error': (payload: { reason: GameErrorReason }) => void;
  'game:over': (payload: GameOverPayload) => void;
  'game:rematch-requested': () => void;
  'opponent:disconnected': (payload: { timeoutSeconds: number }) => void;
  'opponent:reconnected': () => void;
  'opponent:left': () => void;
}

/** Os dados chegam como `unknown` porque são validados com Zod antes do uso. */
export interface ClientToServerEvents {
  'queue:join': (payload?: unknown) => void;
  'queue:leave': () => void;
  'room:create': (payload: unknown) => void;
  'room:join': (payload: unknown) => void;
  'room:cancel': () => void;
  'game:move': (payload: unknown) => void;
  'game:forfeit': () => void;
  'game:rejoin': (payload: unknown) => void;
  'game:rematch': () => void;
}

export interface SocketData {
  roomCode?: string;
}
