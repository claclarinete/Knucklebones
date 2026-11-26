import type { Rng } from '../game/index.js';

export const NICKNAME_MAX_LENGTH = 20;

/** Letras (com acentos), números, espaço, hífen e sublinhado. */
export const NICKNAME_PATTERN = /^[\p{L}\p{N} _-]*$/u;

/**
 * Devolve o apelido escolhido ou, se vier vazio, um `Visitante-NNNN`.
 * Espera um apelido já validado por `nicknameSchema`.
 */
export function resolveNickname(nickname: string | undefined, rng: Rng = Math.random): string {
  const trimmed = nickname?.trim();
  if (trimmed) return trimmed;

  const digits = Math.floor(rng() * 10_000)
    .toString()
    .padStart(4, '0');
  return `Visitante-${digits}`;
}
