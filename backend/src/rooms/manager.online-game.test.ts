import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COLUMN_SIZE, createSeededRng, type GameState } from '../game/index.js';
import { GameManager } from './manager.js';
import { FakeClient, forDie, P1_STARTS, sequence } from './testing.js';

let manager: GameManager;
let ana: FakeClient;
let bia: FakeClient;

/** Pareia Ana (p1) e Bia (p2) pela fila, limpa os eventos e devolve o estado inicial. */
function startOnlineGame(rng: () => number): GameState {
  manager = new GameManager({ botDelayMs: 0, rng });
  manager.joinQueue(ana);
  manager.joinQueue(bia);
  const { state } = ana.last('game:start')!;
  ana.clear();
  bia.clear();
  return state;
}

/** Os dois jogam sempre na primeira coluna livre até a partida acabar. */
function playUntilOver(initial: GameState) {
  let state = initial;
  for (let turn = 0; turn < 200 && state.status === 'playing'; turn++) {
    const column = state.boards[state.currentPlayer].findIndex((dice) => dice.length < COLUMN_SIZE);
    manager.move(state.currentPlayer === 'p1' ? ana : bia, column);
    state = ana.last('game:state')!.state;
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  [ana, bia] = [new FakeClient('ana'), new FakeClient('bia')];
});

afterEach(() => {
  manager.close();
  vi.useRealTimers();
});

describe('partida online em tempo real', () => {
  it('a jogada válida envia o mesmo game:state aos dois', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));

    manager.move(ana, 1);

    expect(bia.last('game:state')).toEqual(ana.last('game:state'));
  });

  it('o estado mostra o dado colocado e a vez do adversário', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));

    manager.move(ana, 1);

    expect(bia.last('game:state')?.state).toMatchObject({
      boards: { p1: [[], [4], []] },
      currentPlayer: 'p2',
    });
  });

  it('os turnos se alternam entre os dois jogadores', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));
    manager.move(ana, 1);

    manager.move(bia, 2);

    expect(ana.last('game:state')?.state.currentPlayer).toBe('p1');
  });

  it('recusa a jogada fora da vez só para quem enviou', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));

    manager.move(bia, 0);

    expect([bia.names(), ana.names()]).toEqual([['game:error'], []]);
  });

  it('responde not_your_turn para a jogada fora da vez', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));

    manager.move(bia, 0);

    expect(bia.last('game:error')).toEqual({ reason: 'not_your_turn' });
  });

  it('o bot nunca joga numa partida online', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));
    manager.move(ana, 1);

    vi.runAllTimers();

    expect(ana.all('game:state')).toHaveLength(1);
  });

  it('o fim envia game:over aos dois com o resultado', () => {
    const initial = startOnlineGame(createSeededRng(11));

    playUntilOver(initial);

    expect(bia.last('game:over')).toEqual(ana.last('game:over'));
    expect(ana.last('game:over')).toMatchObject({
      winner: expect.stringMatching(/^(p1|p2|draw)$/),
      reason: 'finished',
    });
  });

  it('eventos de uma sala não chegam a outra', () => {
    startOnlineGame(sequence(P1_STARTS, forDie(4)));
    const [caio, duda] = [new FakeClient('caio'), new FakeClient('duda')];
    manager.joinQueue(caio);
    manager.joinQueue(duda);
    caio.clear();

    manager.move(ana, 0);

    expect(caio.received).toEqual([]);
  });
});
