import { afterEach, describe, expect, it } from 'vitest';
import {
  forDie,
  HUMAN_STARTS,
  nextEvent,
  sequence,
  startGameServer,
} from './support/game-server.js';

let server: Awaited<ReturnType<typeof startGameServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

async function twoPlayers() {
  server = await startGameServer({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(5)) });
  return [await server.connect(), await server.connect()] as const;
}

describe('sala privada pelo Socket.IO', () => {
  it('o convidado entra pelo código e a partida começa para os dois', async () => {
    const [host, guest] = await twoPlayers();
    const created = nextEvent(host, 'room:created');
    host.emit('room:create', { mode: 'online', nickname: 'Ana' });
    const { code } = await created;

    const hostStart = nextEvent(host, 'game:start');
    const guestStart = nextEvent(guest, 'game:start');
    guest.emit('room:join', { code: code.toLowerCase(), nickname: 'Bia' });

    expect((await hostStart).you).toBe('p1');
    expect((await guestStart).you).toBe('p2');
  });

  it('responde not_found para código inexistente', async () => {
    const [, guest] = await twoPlayers();

    const error = nextEvent(guest, 'room:error');
    guest.emit('room:join', { code: 'ZZZZZZ' });

    expect(await error).toEqual({ reason: 'not_found' });
  });

  it('responde invalid_payload para código mal formado', async () => {
    const [, guest] = await twoPlayers();

    const error = nextEvent(guest, 'room:error');
    guest.emit('room:join', { code: 'K0' });

    expect(await error).toEqual({ reason: 'invalid_payload' });
  });

  it('o criador cancela a sala pelo evento room:cancel', async () => {
    const [host, guest] = await twoPlayers();
    const created = nextEvent(host, 'room:created');
    host.emit('room:create', { mode: 'online' });
    const { code } = await created;

    host.emit('room:cancel');
    // A resposta a um pedido inválido confirma que o servidor já tratou o cancelamento.
    const processed = nextEvent(host, 'room:error');
    host.emit('room:join', { code: 'K0' });
    await processed;
    const error = nextEvent(guest, 'room:error');
    guest.emit('room:join', { code });

    expect(await error).toEqual({ reason: 'not_found' });
  });
});
