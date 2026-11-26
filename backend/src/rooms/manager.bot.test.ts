import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager, type GameManagerOptions } from './manager.js';
import { FakeClient, forDie, P1_STARTS, P2_STARTS, sequence } from './testing.js';

const BOT_DELAY = 500;

let manager: GameManager;

function createManager(options: Partial<GameManagerOptions> = {}) {
  manager = new GameManager({ botDelayMs: BOT_DELAY, ...options });
  return manager;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  manager?.close();
  vi.useRealTimers();
});

describe('partida contra o bot', () => {
  it('começa na hora, com o jogador no p1 e o bot no p2', () => {
    const ana = new FakeClient('ana');
    createManager({ rng: sequence(P1_STARTS, forDie(4)) });

    manager.createBotRoom(ana, 'hard', 'Ana');

    expect(ana.last('game:start')).toMatchObject({
      you: 'p1',
      players: { p1: { nickname: 'Ana' }, p2: { nickname: 'Bot', bot: 'hard' } },
      state: { status: 'playing', currentPlayer: 'p1', die: 4 },
    });
  });

  it('o bot espera o intervalo antes de jogar', () => {
    const ana = new FakeClient('ana');
    createManager({ rng: sequence(P2_STARTS, forDie(2)) });
    manager.createBotRoom(ana, 'easy');

    vi.advanceTimersByTime(BOT_DELAY - 1);
    const before = ana.all('game:state').length;
    vi.advanceTimersByTime(1);

    expect([before, ana.all('game:state').length]).toEqual([0, 1]);
  });

  it('envia o estado da jogada do jogador antes da jogada do bot', () => {
    const ana = new FakeClient('ana');
    createManager({ rng: sequence(P1_STARTS, forDie(3)) });
    manager.createBotRoom(ana, 'easy');

    manager.move(ana, 0);
    const afterMove = ana.all('game:state').map(({ state }) => state.currentPlayer);
    vi.advanceTimersByTime(BOT_DELAY);

    expect(afterMove).toEqual(['p2']);
    expect(ana.last('game:state')?.state.currentPlayer).toBe('p1');
  });

  it('recusa a jogada de quem não está em partida', () => {
    const ana = new FakeClient('ana');
    createManager();

    manager.move(ana, 0);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('converte coluna inexistente em invalid_payload', () => {
    const ana = new FakeClient('ana');
    createManager({ rng: sequence(P1_STARTS, forDie(3)) });
    manager.createBotRoom(ana, 'easy');

    manager.move(ana, 7);

    expect(ana.last('game:error')).toEqual({ reason: 'invalid_payload' });
  });

  it('descarta a partida quando o jogador desconecta', () => {
    const ana = new FakeClient('ana');
    createManager({ rng: sequence(P1_STARTS, forDie(3)) });
    manager.createBotRoom(ana, 'easy');

    manager.disconnect(ana);
    manager.move(ana, 0);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });
});
