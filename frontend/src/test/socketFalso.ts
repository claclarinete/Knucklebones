type Ouvinte = (dados?: unknown) => void;

/** Substituto do socket: registra o que foi enviado e simula o que o servidor envia. */
export function criarSocketFalso(conectado = true) {
  const ouvintes = new Map<string, Set<Ouvinte>>();

  return {
    connected: conectado,
    enviados: [] as unknown[][],
    connect() {},
    emit(...mensagem: unknown[]) {
      this.enviados.push(mensagem);
    },
    on(evento: string, ouvinte: Ouvinte) {
      ouvintes.set(evento, (ouvintes.get(evento) ?? new Set()).add(ouvinte));
    },
    off(evento: string, ouvinte: Ouvinte) {
      ouvintes.get(evento)?.delete(ouvinte);
    },
    receber(evento: string, dados?: unknown) {
      if (evento === 'connect') this.connected = true;
      if (evento === 'disconnect') this.connected = false;
      ouvintes.get(evento)?.forEach((ouvinte) => ouvinte(dados));
    },
  };
}
