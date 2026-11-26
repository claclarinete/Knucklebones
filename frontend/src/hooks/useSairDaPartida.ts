import { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../services/SocketContext';

/**
 * Desconecta quando a pessoa sai da tela da partida, porque é assim que o servidor
 * percebe a saída: pausa o jogo, avisa o adversário e espera a volta.
 */
export function useSairDaPartida() {
  const socket = useContext(SocketContext);
  const naTela = useRef(false);

  useEffect(() => {
    naTela.current = true;
    return () => {
      naTela.current = false;
      // Espera um instante: o modo estrito do React desmonta e monta de novo.
      queueMicrotask(() => {
        if (!naTela.current) socket.disconnect();
      });
    };
  }, [socket]);
}
