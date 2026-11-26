import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const valid = {
  FRONTEND_URL: 'http://localhost:5173',
};

describe('parseEnv', () => {
  it('aplica os valores padrão', () => {
    const env = parseEnv(valid);

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
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
