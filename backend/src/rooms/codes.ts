import { randomInt } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './schemas.js';

/** Devolve um inteiro aleatório em [0, max). */
export type RandomIndex = (max: number) => number;

/**
 * Gera um código de sala que ainda não está em uso. Usa `crypto` por padrão,
 * para que os códigos de salas privadas não sejam previsíveis.
 */
export function generateRoomCode(
  isTaken: (code: string) => boolean,
  randomIndex: RandomIndex = randomInt,
): string {
  let code: string;
  do {
    code = Array.from(
      { length: ROOM_CODE_LENGTH },
      () => ROOM_CODE_ALPHABET[randomIndex(ROOM_CODE_ALPHABET.length)],
    ).join('');
  } while (isTaken(code));
  return code;
}
