import type { Server, Socket } from 'socket.io';
import type { ZodType } from 'zod';
import type {
  ClientToServerEvents,
  GameErrorReason,
  ServerToClientEvents,
  SocketData,
} from './events.js';
import { type Client, GameManager, type GameManagerOptions } from './manager.js';
import {
  gameMoveSchema,
  gameRejoinSchema,
  queueJoinSchema,
  roomCreateSchema,
  roomJoinSchema,
} from './schemas.js';

export type GameIo = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
export type GameServerOptions = GameManagerOptions;

/** Adapta o socket para o gerenciador, que não depende do Socket.IO. */
function toClient(socket: GameSocket): Client {
  const emit = socket.emit.bind(socket) as (event: string, ...args: unknown[]) => boolean;
  return { id: socket.id, emit: (event, ...args) => void emit(event, ...args) };
}

/** Valida os dados antes de chamar o tratador; dado inválido não derruba o servidor. */
function validated<T>(schema: ZodType<T>, onInvalid: () => void, handler: (data: T) => void) {
  return (payload: unknown) => {
    const parsed = schema.safeParse(payload);
    if (parsed.success) handler(parsed.data);
    else onInvalid();
  };
}

/** Liga os eventos do Socket.IO ao gerenciador de partidas. */
export function attachGameServer(io: GameIo, options: GameServerOptions): GameManager {
  const manager = new GameManager(options);

  io.on('connection', (socket) => {
    const client = toClient(socket);
    const roomError = () => socket.emit('room:error', { reason: 'invalid_payload' });
    const gameError = (reason: GameErrorReason) => () => socket.emit('game:error', { reason });

    socket.on(
      'queue:join',
      validated(queueJoinSchema, roomError, ({ nickname }) => manager.joinQueue(client, nickname)),
    );

    socket.on('queue:leave', () => manager.leaveQueue(client));

    socket.on(
      'room:create',
      validated(roomCreateSchema, roomError, (payload) => {
        if (payload.mode === 'bot') {
          manager.createBotRoom(client, payload.difficulty, payload.nickname);
        } else {
          manager.createPrivateRoom(client, payload.nickname);
        }
      }),
    );

    socket.on(
      'room:join',
      validated(roomJoinSchema, roomError, ({ code, nickname }) =>
        manager.joinRoom(client, code, nickname),
      ),
    );

    socket.on('room:cancel', () => manager.cancelRoom(client));

    socket.on(
      'game:move',
      validated(gameMoveSchema, gameError('invalid_payload'), ({ column }) =>
        manager.move(client, column),
      ),
    );

    socket.on('game:forfeit', () => manager.forfeit(client));

    socket.on(
      'game:rejoin',
      validated(gameRejoinSchema, roomError, ({ code, playerToken }) =>
        manager.rejoin(client, code, playerToken),
      ),
    );

    socket.on('disconnect', () => manager.disconnect(client));
  });

  return manager;
}
