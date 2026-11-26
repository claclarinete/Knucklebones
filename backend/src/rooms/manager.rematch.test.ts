import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from './manager.js';
import { FakeClient, forDie, P1_STARTS, sequence } from './testing.js';

const FIVE_MINUTES = 5 * 60_000;

let manager: GameManager;
let ana: FakeClient;
let bia: FakeClient;

beforeEach(() => {
  vi.useFakeTimers();
  manager = new GameManager({ botDelayMs: 0, rng: sequence(P1_STARTS, forDie(3)) });
  [ana, bia] = [new FakeClient('ana'), new FakeClient('bia')];
});

afterEach(() => {
  manager.close();
  vi.useRealTimers();
});

/** Ana (p1) e Bia (p2) jogam pela fila; Bia desiste e os eventos são limpos. */
function finishedGame() {
  manager.joinQueue(ana);
  manager.joinQueue(bia);
  const start = ana.last('game:start')!;
  manager.forfeit(bia);
  ana.clear();
  bia.clear();
  return start;
}

describe('revanche', () => {
  it('avisa o adversário do pedido', () => {
    finishedGame();

    manager.rematch(ana);

    expect(bia.names()).toEqual(['game:rematch-requested']);
  });

  it('não começa enquanto só um pediu', () => {
    finishedGame();

    manager.rematch(ana);

    expect(ana.names()).toEqual([]);
  });

  it.each([
    ['Ana pede e Bia aceita', () => [ana, bia]],
    ['Bia pede e Ana aceita', () => [bia, ana]],
  ])('quando os dois pedem, começa uma nova partida para os dois (%s)', (_case, order) => {
    finishedGame();
    const [first, second] = order();

    manager.rematch(first!);
    manager.rematch(second!);

    expect([ana.last('game:start')?.state.status, bia.last('game:start')?.state.status]).toEqual([
      'playing',
      'playing',
    ]);
  });

  it('a nova partida mantém a sala, os assentos e os tokens', () => {
    const before = finishedGame();

    manager.rematch(ana);
    manager.rematch(bia);

    expect(ana.last('game:start')).toMatchObject({
      code: before.code,
      you: 'p1',
      playerToken: before.playerToken,
      state: { boards: { p1: [[], [], []], p2: [[], [], []] } },
    });
  });

  it('pedir duas vezes não repete o aviso nem começa a partida', () => {
    finishedGame();

    manager.rematch(ana);
    manager.rematch(ana);

    expect([ana.names(), bia.names()]).toEqual([[], ['game:rematch-requested']]);
  });

  it('a nova partida pode ser jogada e não é descartada pelo prazo da anterior', () => {
    finishedGame();
    manager.rematch(ana);
    manager.rematch(bia);
    vi.advanceTimersByTime(FIVE_MINUTES);

    manager.move(ana, 1);

    expect(bia.last('game:state')?.state.boards.p1).toEqual([[], [3], []]);
  });

  it('uma segunda revanche também exige os dois pedidos', () => {
    finishedGame();
    manager.rematch(ana);
    manager.rematch(bia);
    manager.forfeit(ana);
    bia.clear();

    manager.rematch(bia);

    expect(bia.names()).toEqual([]);
    expect(ana.names().at(-1)).toBe('game:rematch-requested');
  });

  it('recusa a revanche antes do fim da partida', () => {
    manager.joinQueue(ana);
    manager.joinQueue(bia);

    manager.rematch(ana);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('recusa a revanche sem partida', () => {
    manager.rematch(ana);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });
});

describe('saída durante a revanche', () => {
  it('se o adversário já saiu, avisa quem pediu', () => {
    finishedGame();
    manager.disconnect(bia);
    ana.clear();

    manager.rematch(ana);

    expect(ana.names()).toEqual(['opponent:left']);
  });

  it('se quem pediu sai, o adversário é avisado', () => {
    finishedGame();
    manager.rematch(ana);

    manager.disconnect(ana);

    expect(bia.names()).toEqual(['game:rematch-requested', 'opponent:left']);
  });
});

describe('revanche contra o bot', () => {
  it('começa na hora', () => {
    manager.createBotRoom(ana, 'easy');
    const { code } = ana.last('game:start')!;
    manager.forfeit(ana);
    ana.clear();

    manager.rematch(ana);

    expect(ana.last('game:start')).toMatchObject({ code, state: { status: 'playing' } });
  });
});
