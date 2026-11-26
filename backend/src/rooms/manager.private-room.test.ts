import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from './manager.js';
import { FakeClient, forDie, P1_STARTS, sequence } from './testing.js';

const TEN_MINUTES = 10 * 60 * 1000;

let manager: GameManager;
let host: FakeClient;
let guest: FakeClient;

beforeEach(() => {
  vi.useFakeTimers();
  manager = new GameManager({ botDelayMs: 0, rng: sequence(P1_STARTS, forDie(3)) });
  host = new FakeClient('host');
  guest = new FakeClient('guest');
});

afterEach(() => {
  manager.close();
  vi.useRealTimers();
});

/** Cria a sala e devolve o código recebido pelo criador. */
function createRoom(nickname?: string) {
  manager.createPrivateRoom(host, nickname);
  return host.last('room:created')!.code;
}

describe('criar sala privada', () => {
  it('devolve o código e o token só para o criador', () => {
    createRoom();

    expect(host.last('room:created')).toEqual({
      code: expect.stringMatching(/^[A-Z2-9]{6}$/),
      playerToken: expect.any(String),
    });
  });

  it('não começa a partida antes do convidado', () => {
    createRoom();

    expect(host.names()).toEqual(['room:created']);
  });

  it('recusa jogadas enquanto espera o convidado', () => {
    createRoom();

    manager.move(host, 0);

    expect(host.last('game:error')).toEqual({ reason: 'game_not_active' });
  });

  it('criar outra sala descarta a anterior', () => {
    const first = createRoom();
    createRoom();

    manager.joinRoom(guest, first);

    expect(guest.last('room:error')).toEqual({ reason: 'not_found' });
  });
});

describe('entrar na sala pelo código', () => {
  it('começa a partida para os dois', () => {
    const code = createRoom('Ana');

    manager.joinRoom(guest, code, 'Bia');

    expect([host.last('game:start')?.you, guest.last('game:start')?.you]).toEqual(['p1', 'p2']);
  });

  it('mostra os apelidos dos dois assentos', () => {
    const code = createRoom('Ana');

    manager.joinRoom(guest, code, 'Bia');

    expect(guest.last('game:start')?.players).toEqual({
      p1: { nickname: 'Ana' },
      p2: { nickname: 'Bia' },
    });
  });

  it('o criador mantém o token recebido ao criar a sala', () => {
    const code = createRoom();

    manager.joinRoom(guest, code);

    expect(host.last('game:start')?.playerToken).toBe(host.last('room:created')?.playerToken);
  });

  it('cada jogador recebe o próprio token', () => {
    const code = createRoom();

    manager.joinRoom(guest, code);

    expect(guest.last('game:start')?.playerToken).not.toBe(host.last('game:start')?.playerToken);
  });

  it('responde not_found para sala inexistente', () => {
    manager.joinRoom(guest, 'ZZZZZZ');

    expect(guest.last('room:error')).toEqual({ reason: 'not_found' });
  });

  it('responde full quando a partida já tem dois jogadores', () => {
    const code = createRoom();
    manager.joinRoom(guest, code);
    const third = new FakeClient('third');

    manager.joinRoom(third, code);

    expect(third.last('room:error')).toEqual({ reason: 'full' });
  });

  it('responde full quando o criador tenta entrar na própria sala', () => {
    const code = createRoom();

    manager.joinRoom(host, code);

    expect(host.last('room:error')).toEqual({ reason: 'full' });
  });

  it('responde full para o código de uma partida contra o bot', () => {
    manager.createBotRoom(host, 'easy');
    const code = host.last('game:start')!.code;

    manager.joinRoom(guest, code);

    expect(guest.last('room:error')).toEqual({ reason: 'full' });
  });
});

describe('cancelar a sala', () => {
  it('o criador cancela e o código deixa de existir', () => {
    const code = createRoom();

    manager.cancelRoom(host);
    manager.joinRoom(guest, code);

    expect(guest.last('room:error')).toEqual({ reason: 'not_found' });
  });

  it('não encerra uma partida já começada', () => {
    const code = createRoom();
    manager.joinRoom(guest, code);

    manager.cancelRoom(host);
    manager.move(host, 0);

    expect(host.last('game:state')?.state.boards.p1).toEqual([[3], [], []]);
  });

  it('cancelar sem sala não faz nada', () => {
    manager.cancelRoom(host);

    expect(host.received).toEqual([]);
  });
});

describe('expiração da sala em espera', () => {
  it('ainda aceita o convidado pouco antes de 10 minutos', () => {
    const code = createRoom();
    vi.advanceTimersByTime(TEN_MINUTES - 1);

    manager.joinRoom(guest, code);

    expect(guest.last('game:start')?.code).toBe(code);
  });

  it('expira após 10 minutos sem convidado', () => {
    const code = createRoom();
    vi.advanceTimersByTime(TEN_MINUTES);

    manager.joinRoom(guest, code);

    expect(guest.last('room:error')).toEqual({ reason: 'not_found' });
  });

  it('avisa o criador que a sala expirou', () => {
    createRoom();

    vi.advanceTimersByTime(TEN_MINUTES);

    expect(host.last('room:error')).toEqual({ reason: 'not_found' });
  });

  it('não expira depois que a partida começa', () => {
    const code = createRoom();
    manager.joinRoom(guest, code);
    vi.advanceTimersByTime(TEN_MINUTES);

    manager.move(host, 0);

    expect(host.last('game:state')?.state.status).toBe('playing');
  });
});
