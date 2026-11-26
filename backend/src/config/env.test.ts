import { describe, expect, it } from 'vitest';
import { diceSeedOf, parseEnv } from './env.js';

const valid = {
  FRONTEND_URL: 'http://localhost:5173',
};

describe('parseEnv', () => {
  it('aplica os valores padrão', () => {
    const env = parseEnv(valid);

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('usa 800 ms de espera do bot por padrão', () => {
    expect(parseEnv(valid).BOT_DELAY_MS).toBe(800);
  });

  it('converte BOT_DELAY_MS para número', () => {
    expect(parseEnv({ ...valid, BOT_DELAY_MS: '0' }).BOT_DELAY_MS).toBe(0);
  });

  it.each(['-1', 'rápido'])('rejeita BOT_DELAY_MS igual a %j', (value) => {
    expect(() => parseEnv({ ...valid, BOT_DELAY_MS: value })).toThrow(/BOT_DELAY_MS/);
  });

  it('rejeita DICE_SEED que não é inteiro', () => {
    expect(() => parseEnv({ ...valid, DICE_SEED: 'abc' })).toThrow(/DICE_SEED/);
  });

  it('converte PORT para número', () => {
    expect(parseEnv({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejeita PORT que não é um número positivo', () => {
    expect(() => parseEnv({ ...valid, PORT: '-1' })).toThrow(/PORT/);
  });

  it('rejeita FRONTEND_URL que não é um endereço', () => {
    expect(() => parseEnv({ FRONTEND_URL: 'localhost' })).toThrow(/FRONTEND_URL/);
  });

  it('rejeita quando FRONTEND_URL está ausente', () => {
    expect(() => parseEnv({})).toThrow(/FRONTEND_URL/);
  });
});

describe('diceSeedOf', () => {
  it.each(['development', 'test'])('usa DICE_SEED em %s', (NODE_ENV) => {
    expect(diceSeedOf(parseEnv({ ...valid, NODE_ENV, DICE_SEED: '42' }))).toBe(42);
  });

  it('ignora DICE_SEED em produção', () => {
    expect(diceSeedOf(parseEnv({ ...valid, NODE_ENV: 'production', DICE_SEED: '42' }))).toBeUndefined();
  });

  it('não define semente quando DICE_SEED está ausente', () => {
    expect(diceSeedOf(parseEnv(valid))).toBeUndefined();
  });
});
