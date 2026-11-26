import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type { ZodType } from 'zod';
import {
  applyMove,
  chooseColumn,
  createGame,
  type Difficulty,
  type GameState,
  getResult,
  type MoveError,
  type PlayerId,
  type Rng,
} from '../game/index.js';
import { generateRoomCode } from './codes.js';
import type {
  ClientToServerEvents,
  GameErrorReason,
  PlayerInfo,
  ServerToClientEvents,
  SocketData,
} from './events.js';
import { resolveNickname } from './nickname.js';
import { gameMoveSchema, roomCreateSchema } from './schemas.js';

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

export interface GameServerOptions {
  /** Gerador do dado, de quem começa e dos sorteios do bot. */
  rng?: Rng;
  /** Espera do bot antes de jogar. */
  botDelayMs: number;
  /** Tempo que uma partida terminada fica guardada. */
  finishedRoomTtlMs?: number;
}

const HUMAN: PlayerId = 'p1';
const BOT: PlayerId = 'p2';
const FIVE_MINUTES = 5 * 60 * 1000;

interface BotRoom {
  code: string;
  difficulty: Difficulty;
  state: GameState;
  players: Record<PlayerId, PlayerInfo>;
  playerToken: string;
  timer?: NodeJS.Timeout;
}

function toGameError(reason: MoveError): GameErrorReason {
  return reason === 'invalid_column' ? 'invalid_payload' : reason;
}

/** Registra os eventos da partida no servidor Socket.IO. */
export function attachGameServer(io: GameIo, options: GameServerOptions) {
  const rng = options.rng ?? Math.random;
  const finishedRoomTtlMs = options.finishedRoomTtlMs ?? FIVE_MINUTES;
  const rooms = new Map<string, BotRoom>();

  function removeRoom(room: BotRoom) {
    clearTimeout(room.timer);
    rooms.delete(room.code);
    io.socketsLeave(room.code);
  }

  function schedule(room: BotRoom, delayMs: number, task: () => void) {
    clearTimeout(room.timer);
    room.timer = setTimeout(task, delayMs);
    room.timer.unref();
  }

  function updateState(room: BotRoom, state: GameState) {
    room.state = state;
    io.to(room.code).emit('game:state', { state });

    const winner = getResult(state);
    if (winner !== null) {
      io.to(room.code).emit('game:over', { winner, scores: state.scores, reason: 'finished' });
      schedule(room, finishedRoomTtlMs, () => removeRoom(room));
    } else if (state.currentPlayer === BOT) {
      schedule(room, options.botDelayMs, () => playBot(room));
    }
  }

  function playBot(room: BotRoom) {
    const column = chooseColumn(room.state, room.difficulty, rng);
    const result = applyMove(room.state, BOT, column, rng);
    if (result.ok) updateState(room, result.state);
  }

  function leaveCurrentRoom(socket: GameSocket) {
    const room = socket.data.roomCode ? rooms.get(socket.data.roomCode) : undefined;
    if (room) removeRoom(room);
    socket.data.roomCode = undefined;
  }

  /** Valida os dados antes de chamar o tratador; dado inválido não derruba o servidor. */
  function validated<T>(schema: ZodType<T>, onInvalid: () => void, handler: (data: T) => void) {
    return (payload: unknown) => {
      const parsed = schema.safeParse(payload);
      if (parsed.success) handler(parsed.data);
      else onInvalid();
    };
  }

  io.on('connection', (socket) => {
    const roomError = () => socket.emit('room:error', { reason: 'invalid_payload' });
    const gameError = (reason: GameErrorReason) => socket.emit('game:error', { reason });

    socket.on(
      'room:create',
      validated(roomCreateSchema, roomError, (payload) => {
        // Salas privadas online chegam na US08 (#12).
        if (payload.mode !== 'bot') return roomError();

        leaveCurrentRoom(socket);
        const room: BotRoom = {
          code: generateRoomCode((code) => rooms.has(code)),
          difficulty: payload.difficulty,
          state: createGame(rng),
          players: {
            [HUMAN]: { nickname: resolveNickname(payload.nickname) },
            [BOT]: { nickname: 'Bot', bot: payload.difficulty },
          } as Record<PlayerId, PlayerInfo>,
          playerToken: randomUUID(),
        };
        rooms.set(room.code, room);
        socket.data.roomCode = room.code;
        void socket.join(room.code);

        socket.emit('game:start', {
          code: room.code,
          playerToken: room.playerToken,
          you: HUMAN,
          players: room.players,
          state: room.state,
        });
        if (room.state.currentPlayer === BOT) {
          schedule(room, options.botDelayMs, () => playBot(room));
        }
      }),
    );

    socket.on(
      'game:move',
      validated(
        gameMoveSchema,
        () => gameError('invalid_payload'),
        ({ column }) => {
          const room = socket.data.roomCode ? rooms.get(socket.data.roomCode) : undefined;
          if (!room) return gameError('game_not_active');

          const result = applyMove(room.state, HUMAN, column, rng);
          if (!result.ok) return gameError(toGameError(result.reason));
          updateState(room, result.state);
        },
      ),
    );

    // Pausa e retomada após queda chegam na US12 (#16); por enquanto a partida é descartada.
    socket.on('disconnect', () => leaveCurrentRoom(socket));
  });
}
