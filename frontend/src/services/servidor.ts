import type { Socket } from 'socket.io-client';
import { getHealth } from './api';

/** Resolve quando a conexão do jogo abre, e falha se ela não abrir. */
function conectarAoJogo(socket: Socket, signal: AbortSignal) {
  return new Promise<void>((resolver, rejeitar) => {
    if (socket.connected) return resolver();
    if (signal.aborted) return rejeitar(new Error('Consulta cancelada'));

    const encerrar = (concluir: () => void) => {
      socket.off('connect', aoConectar);
      socket.off('connect_error', aoFalhar);
      signal.removeEventListener('abort', aoFalhar);
      concluir();
    };
    const aoConectar = () => encerrar(resolver);
    const aoFalhar = () => encerrar(() => rejeitar(new Error('Servidor indisponível')));

    socket.on('connect', aoConectar);
    socket.on('connect_error', aoFalhar);
    signal.addEventListener('abort', aoFalhar);
    socket.connect();
  });
}

/**
 * Consulta o /health. Se a consulta falhar, confirma pela conexão do jogo, porque
 * extensões do navegador podem bloquear só o /health com o servidor no ar.
 */
export function consultarServidor(socket: Socket, signal: AbortSignal) {
  return getHealth(signal).then(
    () => undefined,
    () => conectarAoJogo(socket, signal),
  );
}
