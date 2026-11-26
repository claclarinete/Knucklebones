import { afterEach, describe, expect, it } from 'vitest';
import { COLUMN_SIZE, createSeededRng, type GameState, type PlayerId } from '../src/game/index.js';
import {
  forDie,
  HUMAN_STARTS,
  nextEvent,
  sequence,
  startGameServer,
  type TestClient,
  wait,
} from './support/game-server.js';

let server: Awaited<ReturnType<typeof startGameServer>> | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

/** Pareia dois clientes pela fila e devolve quem ocupa cada assento. */
async function pairByQueue(rng: () => number) {
  server ??= await startGameServer({ botDelayMs: 0, rng });
  const [first, second] = [await server.connect(), await server.connect()];
  const waiting = nextEvent(first, 'queue:waiting');
  first.emit('queue:join');
  await waiting;
  const started = nextEvent(first, 'game:start');
  second.emit('queue:join');
  const { state } = await started;
  return { players: { p1: first, p2: second } as Record<PlayerId, TestClient>, state };
}

/** Cada jogador joga na primeira coluna livre quando é a sua vez, até o fim. */
function playUntilOver(players: Record<PlayerId, TestClient>, initial: GameState) {
  const playIfMyTurn = (state: GameState) => {
    if (state.status !== 'playing') return;
    const column = state.boards[state.currentPlayer].findIndex((dice) => dice.length < COLUMN_SIZE);
    players[state.currentPlayer].emit('game:move', { column });
  };
  players.p1.on('game:state', ({ state }) => playIfMyTurn(state));
  const overs = Promise.all([
    nextEvent(players.p1, 'game:over'),
    nextEvent(players.p2, 'game:over'),
  ]);
  playIfMyTurn(initial);
  return overs;
}

describe('partida online pelo Socket.IO', () => {
  it('os dois jogam até o fim e recebem o mesmo game:over', async () => {
    const { players, state } = await pairByQueue(createSeededRng(3));

    const [p1Over, p2Over] = await playUntilOver(players, state);

    expect(p2Over).toEqual(p1Over);
    expect(p1Over.reason).toBe('finished');
  });

  it('a jogada de um jogador chega ao adversário', async () => {
    const { players } = await pairByQueue(sequence(HUMAN_STARTS, forDie(6)));

    const received = nextEvent(players.p2, 'game:state');
    players.p1.emit('game:move', { column: 2 });

    expect((await received).state.boards.p1).toEqual([[], [], [6]]);
  });

  it('a jogada fora da vez é recusada com not_your_turn', async () => {
    const { players } = await pairByQueue(sequence(HUMAN_STARTS, forDie(6)));

    const error = nextEvent(players.p2, 'game:error');
    players.p2.emit('game:move', { column: 0 });

    expect(await error).toEqual({ reason: 'not_your_turn' });
  });

  it('eventos de uma partida não chegam a outra', async () => {
    const rng = sequence(HUMAN_STARTS, forDie(6));
    const first = await pairByQueue(rng);
    const second = await pairByQueue(rng);
    const leaked: unknown[] = [];
    second.players.p1.on('game:state', (payload) => leaked.push(payload));
    second.players.p2.on('game:state', (payload) => leaked.push(payload));

    const received = nextEvent(first.players.p2, 'game:state');
    first.players.p1.emit('game:move', { column: 0 });
    await received;
    await wait(30);

    expect(leaked).toEqual([]);
  });
});
