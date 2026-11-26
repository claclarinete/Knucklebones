import { afterEach, describe, expect, it } from 'vitest';
import { forDie, HUMAN_STARTS, nextEvent, sequence, startGameServer } from './support/game-server.js';

let server: Awaited<ReturnType<typeof startGameServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe('revanche pelo Socket.IO', () => {
  it('começa uma nova partida quando os dois pedem', async () => {
    server = await startGameServer({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(5)) });
    const [ana, bia] = [await server.connect(), await server.connect()];
    const waiting = nextEvent(ana, 'queue:waiting');
    ana.emit('queue:join');
    await waiting;
    const started = nextEvent(bia, 'game:start');
    bia.emit('queue:join');
    const { code } = await started;
    const over = nextEvent(ana, 'game:over');
    bia.emit('game:forfeit');
    await over;

    const requested = nextEvent(bia, 'game:rematch-requested');
    ana.emit('game:rematch');
    await requested;
    const anaRestart = nextEvent(ana, 'game:start');
    const biaRestart = nextEvent(bia, 'game:start');
    bia.emit('game:rematch');

    const [first, second] = await Promise.all([anaRestart, biaRestart]);
    expect([first.code, second.code, first.state.status]).toEqual([code, code, 'playing']);
  });
});
