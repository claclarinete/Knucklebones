import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

/**
 * Cria a conexão com o servidor Socket.IO.
 * A conexão só é aberta quando `socket.connect()` é chamado.
 */
export function createSocket(): Socket {
  return io(env.socketUrl, { autoConnect: false });
}
