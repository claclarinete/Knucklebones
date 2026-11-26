import { afterEach, describe, expect, it } from 'vitest';
import { COLUMN_SIZE, createSeededRng, type GameState } from '../src/game/index.js';
import type { GameOverPayload } from '../src/rooms/events.js';
import type { GameServerOptions } from '../src/rooms/game-server.js';
import { ROOM_CODE_ALPHABET } from '../src/rooms/schemas.js';
import {
  BOT_STARTS,
  collectEvents,
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

async function connectTo(options: GameServerOptions) {
  server = await startGameServer(options);
  return server.connect();
}

async function startBotGame(client: TestClient, payload: object = { mode: 'bot', difficulty: 'easy' }) {
  const started = nextEvent(client, 'game:start');
  client.emit('room:create', payload);
  return started;
}

/** Joga sempre na primeira coluna livre até receber game:over. */
function playUntilOver(client: TestClient): Promise<GameOverPayload> {
  const playIfMyTurn = ({ state }: { state: GameState }) => {
    if (state.status !== 'playing' || state.currentPlayer !== 'p1') return;
    const column = state.boards.p1.findIndex((dice) => dice.length < COLUMN_SIZE);
    client.emit('game:move', { column });
  };
  client.on('game:start', playIfMyTurn);
  client.on('game:state', playIfMyTurn);
  return nextEvent(client, 'game:over');
}

describe('room:create contra o bot', () => {
  it('inicia a partida com código, token, assentos e estado', async () => {
    const client = await connectTo({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(4)) });

    const start = await startBotGame(client, { mode: 'bot', difficulty: 'medium', nickname: 'Clarice' });

    expect(start).toMatchObject({
      code: expect.stringMatching(new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`)),
      playerToken: expect.any(String),
      you: 'p1',
      players: { p1: { nickname: 'Clarice' }, p2: { nickname: 'Bot', bot: 'medium' } },
      state: { status: 'playing', currentPlayer: 'p1', die: 4 },
    });
  });

  it('sem apelido, chama o jogador de Visitante com 4 dígitos', async () => {
    const client = await connectTo({ botDelayMs: 0 });

    const start = await startBotGame(client);

    expect(start.players.p1.nickname).toMatch(/^Visitante-\d{4}$/);
  });

  it('responde invalid_payload a dados inválidos e continua funcionando', async () => {
    const client = await connectTo({ botDelayMs: 0 });

    const error = nextEvent(client, 'room:error');
    client.emit('room:create', { mode: 'bot', difficulty: 'impossible' });

    expect(await error).toEqual({ reason: 'invalid_payload' });
    expect((await startBotGame(client)).state.status).toBe('playing');
  });

  it('quando o bot começa, ele joga primeiro', async () => {
    const client = await connectTo({ botDelayMs: 0, rng: sequence(BOT_STARTS, forDie(2)) });
    const firstState = nextEvent(client, 'game:state');

    await startBotGame(client);

    expect((await firstState).state).toMatchObject({ currentPlayer: 'p1' });
  });
});

describe('game:move contra o bot', () => {
  it('envia o estado da minha jogada antes da jogada do bot', async () => {
    const client = await connectTo({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(4)) });
    await startBotGame(client);
    const states = collectEvents(client, 'game:state', 2);

    client.emit('game:move', { column: 1 });
    const [mine, bot] = await states;

    expect(mine!.state).toMatchObject({ currentPlayer: 'p2', boards: { p1: [[], [4], []] } });
    expect(bot!.state.currentPlayer).toBe('p1');
  });

  it('espera o intervalo configurado antes da jogada do bot', async () => {
    const client = await connectTo({ botDelayMs: 150, rng: sequence(HUMAN_STARTS, forDie(4)) });
    await startBotGame(client);
    const states = collectEvents(client, 'game:state', 2);

    client.emit('game:move', { column: 0 });
    const mine = await nextEvent(client, 'game:state');
    const startedAt = Date.now();
    await states;

    expect(mine.state.currentPlayer).toBe('p2');
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(140);
  });

  it('recusa a jogada fora da vez com not_your_turn', async () => {
    const client = await connectTo({ botDelayMs: 5_000, rng: sequence(BOT_STARTS, forDie(2)) });
    await startBotGame(client);

    const error = nextEvent(client, 'game:error');
    client.emit('game:move', { column: 0 });

    expect(await error).toEqual({ reason: 'not_your_turn' });
  });

  it.each([{ column: 3 }, { column: '1' }, {}, null])('recusa %j com invalid_payload', async (payload) => {
    const client = await connectTo({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(2)) });
    await startBotGame(client);

    const error = nextEvent(client, 'game:error');
    client.emit('game:move', payload);

    expect(await error).toEqual({ reason: 'invalid_payload' });
  });

  it('recusa a jogada sem partida com game_not_active', async () => {
    const client = await connectTo({ botDelayMs: 0 });

    const error = nextEvent(client, 'game:error');
    client.emit('game:move', { column: 0 });

    expect(await error).toEqual({ reason: 'game_not_active' });
  });

  it('não envia estado quando a jogada é recusada', async () => {
    const client = await connectTo({ botDelayMs: 5_000, rng: sequence(BOT_STARTS, forDie(2)) });
    await startBotGame(client);
    const states: unknown[] = [];
    client.on('game:state', (payload) => states.push(payload));

    client.emit('game:move', { column: 0 });
    await nextEvent(client, 'game:error');
    await wait(50);

    expect(states).toEqual([]);
  });
});

describe('fim da partida contra o bot', () => {
  it.each(['easy', 'medium'])('contra o bot %s, termina com game:over e o resultado', async (difficulty) => {
    const client = await connectTo({ botDelayMs: 0, rng: createSeededRng(7) });
    const over = playUntilOver(client);

    await startBotGame(client, { mode: 'bot', difficulty });

    expect(await over).toMatchObject({
      winner: expect.stringMatching(/^(p1|p2|draw)$/),
      reason: 'finished',
    });
  });

  it('recusa jogadas depois do fim com game_not_active', async () => {
    const client = await connectTo({ botDelayMs: 0, rng: createSeededRng(7) });
    const over = playUntilOver(client);
    await startBotGame(client);
    await over;
    client.removeAllListeners('game:state');

    const error = nextEvent(client, 'game:error');
    client.emit('game:move', { column: 0 });

    expect(await error).toEqual({ reason: 'game_not_active' });
  });

  it('descarta a partida terminada depois do prazo', async () => {
    const client = await connectTo({ botDelayMs: 0, finishedRoomTtlMs: 0, rng: createSeededRng(7) });
    const over = playUntilOver(client);
    await startBotGame(client);
    await over;
    client.removeAllListeners('game:state');
    await wait(20);

    const error = nextEvent(client, 'game:error');
    client.emit('game:move', { column: 0 });

    expect(await error).toEqual({ reason: 'game_not_active' });
  });
});

describe('nova partida e desconexão', () => {
  it('criar outra partida descarta a anterior', async () => {
    const client = await connectTo({ botDelayMs: 0 });
    const first = await startBotGame(client);

    const second = await startBotGame(client);

    expect(second.code).not.toBe(first.code);
  });

  it('a partida de um jogador não recebe eventos da partida de outro', async () => {
    server = await startGameServer({ botDelayMs: 0, rng: sequence(HUMAN_STARTS, forDie(3)) });
    const alice = await server.connect();
    const bob = await server.connect();
    await startBotGame(alice);
    await startBotGame(bob);
    const bobStates: unknown[] = [];
    bob.on('game:state', (payload) => bobStates.push(payload));

    alice.emit('game:move', { column: 0 });
    await collectEvents(alice, 'game:state', 2);

    expect(bobStates).toEqual([]);
  });

  it('desconectar no meio da partida não derruba o servidor', async () => {
    server = await startGameServer({ botDelayMs: 50, rng: sequence(BOT_STARTS, forDie(3)) });
    const leaving = await server.connect();
    await startBotGame(leaving);
    leaving.disconnect();
    await wait(80);

    const other = await server.connect();

    expect((await startBotGame(other)).state.status).toBe('playing');
  });
});
