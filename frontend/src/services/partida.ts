export const CHAVE_PARTIDA = 'knucklebones:partida';

export interface PartidaSalva {
  code: string;
  playerToken: string;
  /** Sala criada nesta aba que ainda espera o convidado. */
  aguardando?: boolean;
}

/** Guarda o necessário para retomar a partida depois de uma queda ou recarga. */
export function salvarPartida({ code, playerToken, aguardando }: PartidaSalva) {
  sessionStorage.setItem(CHAVE_PARTIDA, JSON.stringify({ code, playerToken, aguardando }));
}

/** Dados salvos da sala informada, se esta aba já ocupava um assento nela. */
export function lerPartida(code: string): PartidaSalva | null {
  const salva = sessionStorage.getItem(CHAVE_PARTIDA);
  const partida = salva ? (JSON.parse(salva) as PartidaSalva) : null;
  return partida?.code === code ? partida : null;
}

export function esquecerPartida() {
  sessionStorage.removeItem(CHAVE_PARTIDA);
}
