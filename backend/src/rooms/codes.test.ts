import { describe, expect, it } from 'vitest';
import { generateRoomCode } from './codes.js';
import { roomCodeSchema } from './schemas.js';

describe('generateRoomCode', () => {
  it('gera códigos que passam na validação da sala', () => {
    const codes = Array.from({ length: 200 }, () => generateRoomCode(() => false));

    expect(codes.every((code) => roomCodeSchema.safeParse(code).success)).toBe(true);
  });

  it('nunca usa 0, O, 1 ou I', () => {
    const codes = Array.from({ length: 200 }, () => generateRoomCode(() => false)).join('');

    expect(codes).not.toMatch(/[0O1I]/);
  });

  it('usa o sorteio informado', () => {
    expect(generateRoomCode(() => false, () => 0)).toBe('AAAAAA');
  });

  it('sorteia de novo enquanto o código estiver em uso', () => {
    let calls = 0;
    const firstThenLast = () => (calls++ < 6 ? 0 : 31);

    expect(generateRoomCode((code) => code === 'AAAAAA', firstThenLast)).toBe('999999');
  });
});
