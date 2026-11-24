import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const valid = {
  JWT_SECRET: 'x'.repeat(32),
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

  it('rejeita JWT_SECRET curto', () => {
    expect(() => parseEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow(/JWT_SECRET/);
  });

  it('rejeita quando FRONTEND_URL está ausente', () => {
    expect(() => parseEnv({ JWT_SECRET: valid.JWT_SECRET })).toThrow(/FRONTEND_URL/);
  });
});
