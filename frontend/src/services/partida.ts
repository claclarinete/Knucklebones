import type { GameStart } from '../types/jogo';

export const CHAVE_PARTIDA = 'knucklebones:partida';

/** Guarda o necessário para retomar a partida depois de uma queda ou recarga. */
export function salvarPartida({ code, playerToken }: GameStart) {
  sessionStorage.setItem(CHAVE_PARTIDA, JSON.stringify({ code, playerToken }));
}
