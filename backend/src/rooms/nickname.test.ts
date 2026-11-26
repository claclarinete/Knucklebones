import { describe, expect, it } from 'vitest';
import { resolveNickname } from './nickname.js';

describe('resolveNickname', () => {
  it('mantém o apelido escolhido', () => {
    expect(resolveNickname('Clarice')).toBe('Clarice');
  });

  it('remove espaços nas pontas', () => {
    expect(resolveNickname('  Zé  ')).toBe('Zé');
  });

  it.each([undefined, '', '   '])('com apelido %j, gera um Visitante com 4 dígitos', (nickname) => {
    expect(resolveNickname(nickname)).toMatch(/^Visitante-\d{4}$/);
  });

  it.each([
    [0, 'Visitante-0000'],
    [0.0421, 'Visitante-0421'],
    [0.99999, 'Visitante-9999'],
  ])('com o gerador em %d, gera %s', (value, expected) => {
    expect(resolveNickname(undefined, () => value)).toBe(expected);
  });
});
