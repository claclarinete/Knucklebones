import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GameManager } from './manager.js';
import { FakeClient, forDie, P1_STARTS, sequence } from './testing.js';

let manager: GameManager;
let ana: FakeClient;
let bia: FakeClient;
let caio: FakeClient;

beforeEach(() => {
  manager = new GameManager({ botDelayMs: 0, rng: sequence(P1_STARTS, forDie(3)) });
  [ana, bia, caio] = [new FakeClient('ana'), new FakeClient('bia'), new FakeClient('caio')];
});

afterEach(() => {
  manager.close();
});

describe('fila online', () => {
  it('quem entra sozinho espera', () => {
    manager.joinQueue(ana);

    expect(ana.names()).toEqual(['queue:waiting']);
  });

  it('o segundo jogador forma par com o primeiro e os dois recebem game:start', () => {
    manager.joinQueue(ana, 'Ana');
    manager.joinQueue(bia, 'Bia');

    expect(ana.last('game:start')?.code).toBe(bia.last('game:start')?.code);
  });

  it('quem chegou primeiro ocupa o p1', () => {
    manager.joinQueue(ana, 'Ana');
    manager.joinQueue(bia, 'Bia');

    expect(bia.last('game:start')).toMatchObject({
      you: 'p2',
      players: { p1: { nickname: 'Ana' }, p2: { nickname: 'Bia' } },
    });
  });

  it('pareia por ordem de chegada', () => {
    manager.joinQueue(ana);
    manager.joinQueue(bia);
    manager.joinQueue(caio);

    expect(caio.names()).toEqual(['queue:waiting']);
  });

  it('quem sai da fila não é pareado', () => {
    manager.joinQueue(ana);
    manager.leaveQueue(ana);

    manager.joinQueue(bia);

    expect(bia.names()).toEqual(['queue:waiting']);
  });

  it('quem desconecta é removido da fila', () => {
    manager.joinQueue(ana);
    manager.disconnect(ana);

    manager.joinQueue(bia);

    expect(bia.names()).toEqual(['queue:waiting']);
  });

  it('entrar duas vezes não pareia o jogador com ele mesmo', () => {
    manager.joinQueue(ana);
    manager.joinQueue(ana);

    expect(ana.names()).toEqual(['queue:waiting', 'queue:waiting']);
  });

  it('sair da fila sem estar nela não faz nada', () => {
    manager.leaveQueue(ana);

    expect(ana.received).toEqual([]);
  });

  it('entrar na fila cancela a sala privada em espera', () => {
    manager.createPrivateRoom(ana);
    const code = ana.last('room:created')!.code;
    manager.joinQueue(ana);

    manager.joinRoom(bia, code);

    expect(bia.last('room:error')).toEqual({ reason: 'not_found' });
  });

  it('criar uma partida contra o bot tira o jogador da fila', () => {
    manager.joinQueue(ana);
    manager.createBotRoom(ana, 'easy');

    manager.joinQueue(bia);

    expect(bia.names()).toEqual(['queue:waiting']);
  });
});
