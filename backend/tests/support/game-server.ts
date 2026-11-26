import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import type { Die } from '../../src/game/index.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../../src/rooms/events.js';
import { attachGameServer, type GameIo, type GameServerOptions } from '../../src/rooms/game-server.js';

export type TestClient = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Valor do gerador que faz o dado tirar `die`. */
export const forDie = (die: Die) => (die - 0.5) / 6;
export const HUMAN_STARTS = 0.1;
export const BOT_STARTS = 0.9;

/** Gerador que devolve os valores informados, em ordem e em ciclo. */
export function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length]!;
}

/** Sobe um servidor de partidas numa porta livre e devolve como conectar clientes. */
export async function startGameServer(options: GameServerOptions) {
  const httpServer = createServer();
  const io: GameIo = new Server(httpServer);
  attachGameServer(io, options);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  const clients: TestClient[] = [];

  return {
    async connect(): Promise<TestClient> {
      const client: TestClient = connect(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      clients.push(client);
      await new Promise<void>((resolve) => client.once('connect', resolve));
      return client;
    },
    async close() {
      for (const client of clients) client.disconnect();
      await io.close();
    },
  };
}

/** Espera o próximo evento com esse nome e devolve seus dados. */
export function nextEvent<E extends keyof ServerToClientEvents>(
  client: TestClient,
  event: E,
): Promise<Parameters<ServerToClientEvents[E]>[0]> {
  return new Promise((resolve) => {
    client.once(event as 'game:state', ((payload: unknown) => resolve(payload as never)) as never);
  });
}

/** Junta os próximos `count` eventos com esse nome. */
export function collectEvents<E extends keyof ServerToClientEvents>(
  client: TestClient,
  event: E,
  count: number,
): Promise<Parameters<ServerToClientEvents[E]>[0][]> {
  const received: unknown[] = [];
  return new Promise((resolve) => {
    const listener = (payload: unknown) => {
      received.push(payload);
      if (received.length === count) {
        client.off(event as 'game:state', listener as never);
        resolve(received as never);
      }
    };
    client.on(event as 'game:state', listener as never);
  });
}

/** Espera um tempo real curto, para conferir que nada chegou. */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
