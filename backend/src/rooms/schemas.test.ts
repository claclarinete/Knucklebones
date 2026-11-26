import { describe, expect, it } from 'vitest';
import {
  gameMoveSchema,
  gameRejoinSchema,
  nicknameSchema,
  queueJoinSchema,
  roomCodeSchema,
  roomCreateSchema,
  roomJoinSchema,
} from './schemas.js';

describe('nicknameSchema', () => {
  it.each(['Clarice', 'José_2', 'Ana Maria', 'jogador-1', 'a', 'x'.repeat(20), ''])(
    'aceita %j',
    (nickname) => {
      expect(nicknameSchema.safeParse(nickname).success).toBe(true);
    },
  );

  it('aceita a ausência de apelido', () => {
    expect(nicknameSchema.safeParse(undefined).success).toBe(true);
  });

  it.each(['x'.repeat(21), '<script>', 'ola!', 'a.b', 42])('recusa %j', (nickname) => {
    expect(nicknameSchema.safeParse(nickname).success).toBe(false);
  });

  it('conta o tamanho sem os espaços das pontas', () => {
    expect(nicknameSchema.parse(`  ${'x'.repeat(20)}  `)).toBe('x'.repeat(20));
  });
});

describe('roomCodeSchema', () => {
  it('aceita um código válido', () => {
    expect(roomCodeSchema.parse('K7P2QX')).toBe('K7P2QX');
  });

  it('ignora maiúsculas, minúsculas e espaços nas pontas', () => {
    expect(roomCodeSchema.parse(' k7p2qx ')).toBe('K7P2QX');
  });

  it.each(['K7P2Q', 'K7P2QXA', 'K0P2QX', 'KOP2QX', 'K1P2QX', 'KIP2QX', 'K7P-QX', 123456])(
    'recusa %j',
    (code) => {
      expect(roomCodeSchema.safeParse(code).success).toBe(false);
    },
  );
});

describe('queueJoinSchema', () => {
  it('aceita o evento sem dados', () => {
    expect(queueJoinSchema.parse(undefined)).toEqual({});
  });

  it('aceita um apelido', () => {
    expect(queueJoinSchema.parse({ nickname: 'Zé' })).toEqual({ nickname: 'Zé' });
  });
});

describe('roomCreateSchema', () => {
  it.each([
    { mode: 'online' },
    { mode: 'online', nickname: 'Zé' },
    { mode: 'bot', difficulty: 'easy' },
    { mode: 'bot', difficulty: 'hard', nickname: 'Zé' },
  ])('aceita %j', (payload) => {
    expect(roomCreateSchema.safeParse(payload).success).toBe(true);
  });

  it.each([
    undefined,
    {},
    { mode: 'bot' },
    { mode: 'bot', difficulty: 'impossible' },
    { mode: 'local' },
    { mode: 'online', nickname: 'x'.repeat(21) },
  ])('recusa %j', (payload) => {
    expect(roomCreateSchema.safeParse(payload).success).toBe(false);
  });
});

describe('roomJoinSchema', () => {
  it('normaliza o código', () => {
    expect(roomJoinSchema.parse({ code: 'k7p2qx' })).toEqual({ code: 'K7P2QX' });
  });

  it('recusa sem código', () => {
    expect(roomJoinSchema.safeParse({ nickname: 'Zé' }).success).toBe(false);
  });
});

describe('gameMoveSchema', () => {
  it.each([0, 1, 2])('aceita a coluna %d', (column) => {
    expect(gameMoveSchema.safeParse({ column }).success).toBe(true);
  });

  it.each([-1, 3, 1.5, '1', null])('recusa a coluna %j', (column) => {
    expect(gameMoveSchema.safeParse({ column }).success).toBe(false);
  });

  it('recusa o evento sem dados', () => {
    expect(gameMoveSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('gameRejoinSchema', () => {
  it('aceita código e token', () => {
    expect(gameRejoinSchema.safeParse({ code: 'K7P2QX', playerToken: 'abc' }).success).toBe(true);
  });

  it.each([{ code: 'K7P2QX' }, { code: 'K7P2QX', playerToken: '' }, { playerToken: 'abc' }])(
    'recusa %j',
    (payload) => {
      expect(gameRejoinSchema.safeParse(payload).success).toBe(false);
    },
  );
});
