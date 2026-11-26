import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from './manager.js';
import { FakeClient, forDie, P1_STARTS, sequence } from './testing.js';

const ONE_MINUTE = 60_000;
const BOT_DELAY = 500;

let manager: GameManager;
let ana: FakeClient;
let bia: FakeClient;

beforeEach(() => {
  vi.useFakeTimers();
  manager = new GameManager({ botDelayMs: BOT_DELAY, rng: sequence(P1_STARTS, forDie(3)) });
  [ana, bia] = [new FakeClient('ana'), new FakeClient('bia')];
});

afterEach(() => {
  manager.close();
  vi.useRealTimers();
});

/** Ana (p1) contra Bia (p2) pela fila; devolve o código e os tokens. */
function startOnlineGame() {
  manager.joinQueue(ana);
  manager.joinQueue(bia);
  const anaStart = ana.last('game:start')!;
  const biaStart = bia.last('game:start')!;
  ana.clear();
  bia.clear();
  return { code: anaStart.code, anaToken: anaStart.playerToken, biaToken: biaStart.playerToken };
}

describe('desistência', () => {
  it('dá a vitória ao adversário e avisa os dois', () => {
    startOnlineGame();

    manager.forfeit(ana);

    expect([ana.last('game:over'), bia.last('game:over')]).toEqual([
      expect.objectContaining({ winner: 'p2', reason: 'forfeit' }),
      expect.objectContaining({ winner: 'p2', reason: 'forfeit' }),
    ]);
  });

  it('envia o estado encerrado antes do resultado', () => {
    startOnlineGame();

    manager.forfeit(ana);

    expect(bia.names()).toEqual(['game:state', 'game:over']);
    expect(bia.last('game:state')?.state).toMatchObject({ status: 'finished', die: null });
  });

  it('contra o bot, a vitória é do bot', () => {
    manager.createBotRoom(ana, 'easy');

    manager.forfeit(ana);

    expect(ana.last('game:over')).toMatchObject({ winner: 'p2', reason: 'forfeit' });
  });

  it('recusa desistir sem partida', () => {
    manager.forfeit(ana);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('recusa desistir de uma partida terminada', () => {
    startOnlineGame();
    manager.forfeit(ana);

    manager.forfeit(bia);

    expect(bia.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('começar outra partida no meio de uma online conta como desistência', () => {
    startOnlineGame();

    manager.createBotRoom(ana, 'easy');

    expect(bia.last('game:over')).toMatchObject({ winner: 'p2', reason: 'forfeit' });
    expect(bia.names()).toContain('opponent:left');
  });
});

describe('queda durante a partida', () => {
  it('pausa a partida e avisa o adversário com o prazo', () => {
    startOnlineGame();

    manager.disconnect(ana);

    expect(bia.last('game:state')?.state.status).toBe('paused');
    expect(bia.last('opponent:disconnected')).toEqual({ timeoutSeconds: 60 });
  });

  it('recusa jogadas enquanto a partida está pausada', () => {
    startOnlineGame();
    manager.disconnect(bia);

    manager.move(ana, 0);

    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('não encerra a partida antes do prazo', () => {
    startOnlineGame();
    manager.disconnect(ana);

    vi.advanceTimersByTime(ONE_MINUTE - 1);

    expect(bia.last('game:over')).toBeUndefined();
  });

  it('sem retorno em 60 segundos, quem ficou vence por abandono', () => {
    startOnlineGame();
    manager.disconnect(ana);

    vi.advanceTimersByTime(ONE_MINUTE);

    expect(bia.last('game:over')).toMatchObject({ winner: 'p2', reason: 'disconnect' });
  });

  it('se os dois saem e ninguém volta, a partida é descartada', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(ana);
    manager.disconnect(bia);
    vi.advanceTimersByTime(ONE_MINUTE);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, anaToken);

    expect(back.last('room:error')).toEqual({ reason: 'invalid_token' });
  });
});

describe('retomada com game:rejoin', () => {
  it('devolve o estado a quem volta, com a partida em andamento', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(ana);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, anaToken);

    expect(back.last('game:start')).toMatchObject({
      code,
      you: 'p1',
      playerToken: anaToken,
      state: { status: 'playing' },
    });
  });

  it('avisa o adversário da volta e envia o estado retomado', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(ana);
    bia.clear();

    manager.rejoin(new FakeClient('ana-2'), code, anaToken);

    expect(bia.names()).toEqual(['opponent:reconnected', 'game:state']);
    expect(bia.last('game:state')?.state.status).toBe('playing');
  });

  it('cancela o prazo de abandono', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(ana);
    manager.rejoin(new FakeClient('ana-2'), code, anaToken);

    vi.advanceTimersByTime(ONE_MINUTE);

    expect(bia.last('game:over')).toBeUndefined();
  });

  it('quem volta pode continuar jogando', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(ana);
    const back = new FakeClient('ana-2');
    manager.rejoin(back, code, anaToken);

    manager.move(back, 2);

    expect(bia.last('game:state')?.state.boards.p1).toEqual([[], [], [3]]);
  });

  it('com o adversário também fora, informa o tempo que resta para ele', () => {
    const { code, anaToken } = startOnlineGame();
    manager.disconnect(bia);
    vi.advanceTimersByTime(20_000);
    manager.disconnect(ana);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, anaToken);

    expect(back.last('game:start')?.state.status).toBe('paused');
    expect(back.last('opponent:disconnected')).toEqual({ timeoutSeconds: 40 });
  });

  it.each([
    ['token desconhecido', 'token-errado'],
    ['token vazio de outra sala', ''],
  ])('recusa %s com invalid_token', (_case, token) => {
    const { code } = startOnlineGame();
    const stranger = new FakeClient('stranger');

    manager.rejoin(stranger, code, token);

    expect(stranger.last('room:error')).toEqual({ reason: 'invalid_token' });
  });

  it('recusa código inexistente com invalid_token', () => {
    const stranger = new FakeClient('stranger');

    manager.rejoin(stranger, 'ZZZZZZ', 'qualquer');

    expect(stranger.last('room:error')).toEqual({ reason: 'invalid_token' });
  });

  it('outra aba pode assumir o assento sem avisar o adversário', () => {
    const { code, anaToken } = startOnlineGame();
    const otherTab = new FakeClient('ana-aba-2');

    manager.rejoin(otherTab, code, anaToken);
    manager.move(ana, 0);

    expect(otherTab.last('game:start')?.you).toBe('p1');
    expect(ana.last('game:error')).toEqual({ reason: 'game_not_active' });
    expect(bia.names()).toEqual([]);
  });

  it('retomar uma partida terminada reenvia o resultado', () => {
    const { code, anaToken } = startOnlineGame();
    manager.forfeit(bia);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, anaToken);

    expect(back.names()).toEqual(['game:start', 'game:over']);
    expect(back.last('game:over')).toMatchObject({ winner: 'p1', reason: 'forfeit' });
  });
});

describe('saída depois do fim', () => {
  it('avisa o adversário de que o jogador saiu', () => {
    startOnlineGame();
    manager.forfeit(ana);

    manager.disconnect(ana);

    expect(bia.names().at(-1)).toBe('opponent:left');
  });

  it('com os dois fora, a partida é descartada', () => {
    const { code, anaToken } = startOnlineGame();
    manager.forfeit(ana);
    manager.disconnect(ana);
    manager.disconnect(bia);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, anaToken);

    expect(back.last('room:error')).toEqual({ reason: 'invalid_token' });
  });
});

describe('queda contra o bot', () => {
  it('o bot não joga enquanto a partida está pausada', () => {
    manager.createBotRoom(ana, 'easy');
    manager.move(ana, 0);
    manager.disconnect(ana);
    const states = ana.all('game:state').length;

    vi.advanceTimersByTime(BOT_DELAY * 10);

    expect(ana.all('game:state')).toHaveLength(states);
  });

  it('ao retomar, o bot volta a jogar', () => {
    manager.createBotRoom(ana, 'easy');
    const { code, playerToken } = ana.last('game:start')!;
    manager.move(ana, 0);
    manager.disconnect(ana);
    const back = new FakeClient('ana-2');
    manager.rejoin(back, code, playerToken);

    vi.advanceTimersByTime(BOT_DELAY);

    expect(back.last('game:state')?.state.currentPlayer).toBe('p1');
  });

  it('sem retorno, a partida contra o bot é descartada', () => {
    manager.createBotRoom(ana, 'easy');
    const { code, playerToken } = ana.last('game:start')!;
    manager.disconnect(ana);
    vi.advanceTimersByTime(ONE_MINUTE);
    const back = new FakeClient('ana-2');

    manager.rejoin(back, code, playerToken);

    expect(back.last('room:error')).toEqual({ reason: 'invalid_token' });
  });
});

describe('queda do criador da sala privada', () => {
  function createRoom() {
    manager.createPrivateRoom(ana);
    return ana.last('room:created')!;
  }

  it('a sala continua esperando e o criador pode retomá-la', () => {
    const { code, playerToken } = createRoom();
    manager.disconnect(ana);
    const back = new FakeClient('ana-2');
    manager.rejoin(back, code, playerToken);

    manager.joinRoom(bia, code);

    expect(back.last('game:start')?.you).toBe('p1');
  });

  it('se o convidado entra com o criador fora, a partida começa pausada', () => {
    const { code } = createRoom();
    manager.disconnect(ana);

    manager.joinRoom(bia, code);

    expect(bia.last('game:state')?.state.status).toBe('paused');
    expect(bia.last('opponent:disconnected')).toEqual({ timeoutSeconds: 60 });
  });
});
