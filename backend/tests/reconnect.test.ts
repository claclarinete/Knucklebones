import { afterEach, describe, expect, it } from 'vitest';
import type { GameServerOptions } from '../src/rooms/game-server.js';
import { forDie, HUMAN_STARTS, nextEvent, sequence, startGameServer } from './support/game-server.js';

let server: Awaited<ReturnType<typeof startGameServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

/** Pareia dois clientes pela fila e devolve os dois e os dados de game:start. */
async function onlineGame(options: Partial<GameServerOptions> = {}) {
  server = await startGameServer({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(5)), ...options });
  const [ana, bia] = [await server.connect(), await server.connect()];
  const waiting = nextEvent(ana, 'queue:waiting');
  ana.emit('queue:join');
  await waiting;
  const started = nextEvent(ana, 'game:start');
  const biaStarted = nextEvent(bia, 'game:start');
  bia.emit('queue:join');
  return { ana, bia, start: await started, biaStart: await biaStarted };
}

describe('desistência e retomada pelo Socket.IO', () => {
  it('game:forfeit dá a vitória ao adversário', async () => {
    const { ana, bia } = await onlineGame();

    const over = nextEvent(bia, 'game:over');
    ana.emit('game:forfeit');

    expect(await over).toMatchObject({ winner: 'p2', reason: 'forfeit' });
  });

  it('a queda de um jogador avisa o adversário', async () => {
    const { ana, bia } = await onlineGame();

    const warned = nextEvent(bia, 'opponent:disconnected');
    ana.disconnect();

    expect(await warned).toEqual({ timeoutSeconds: 60 });
  });

  it('quem cai volta com game:rejoin e o adversário é avisado', async () => {
    const { ana, bia, start } = await onlineGame();
    const warned = nextEvent(bia, 'opponent:disconnected');
    ana.disconnect();
    await warned;
    const back = await server!.connect();

    const resumed = nextEvent(back, 'game:start');
    const reconnected = nextEvent(bia, 'opponent:reconnected');
    back.emit('game:rejoin', { code: start.code, playerToken: start.playerToken });

    expect((await resumed).state.status).toBe('playing');
    await reconnected;
  });

  it('sem retorno no prazo, quem ficou vence por abandono', async () => {
    const { ana, bia } = await onlineGame({ reconnectTimeoutMs: 100 });

    const over = nextEvent(bia, 'game:over');
    ana.disconnect();

    expect(await over).toMatchObject({ winner: 'p2', reason: 'disconnect' });
  });

  it('token inválido responde invalid_token', async () => {
    const { start } = await onlineGame();
    const stranger = await server!.connect();

    const error = nextEvent(stranger, 'room:error');
    stranger.emit('game:rejoin', { code: start.code, playerToken: 'nao-e-meu' });

    expect(await error).toEqual({ reason: 'invalid_token' });
  });

  it('game:rejoin sem token responde invalid_payload', async () => {
    const { start } = await onlineGame();
    const stranger = await server!.connect();

    const error = nextEvent(stranger, 'room:error');
    stranger.emit('game:rejoin', { code: start.code });

    expect(await error).toEqual({ reason: 'invalid_payload' });
  });
});
