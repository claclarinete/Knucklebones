import { afterEach, describe, expect, it } from 'vitest';
import { forDie, HUMAN_STARTS, nextEvent, sequence, startGameServer } from './support/game-server.js';

let server: Awaited<ReturnType<typeof startGameServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe('fila online pelo Socket.IO', () => {
  it('pareia dois jogadores e envia game:start para os dois', async () => {
    server = await startGameServer({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(5)) });
    const [ana, bia] = [await server.connect(), await server.connect()];

    const waiting = nextEvent(ana, 'queue:waiting');
    ana.emit('queue:join', { nickname: 'Ana' });
    await waiting;
    const anaStart = nextEvent(ana, 'game:start');
    const biaStart = nextEvent(bia, 'game:start');
    bia.emit('queue:join');

    const [first, second] = await Promise.all([anaStart, biaStart]);
    expect([first.you, second.you, second.code]).toEqual(['p1', 'p2', first.code]);
  });

  it('responde invalid_payload para apelido inválido', async () => {
    server = await startGameServer({ botDelayMs: 0 });
    const ana = await server.connect();

    const error = nextEvent(ana, 'room:error');
    ana.emit('queue:join', { nickname: 'x'.repeat(30) });

    expect(await error).toEqual({ reason: 'invalid_payload' });
  });
});
