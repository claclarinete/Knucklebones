import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../services/SocketContext';

/** Quedas de conexão durante a partida: a minha e a do adversário. */
export function useConexao() {
  const socket = useContext(SocketContext);
  const [semConexao, setSemConexao] = useState(false);
  /** Instante em que o prazo do adversário termina, ou null se ele está presente. */
  const [prazo, setPrazo] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const aoCair = () => {
      setSemConexao(true);
      // Ao retomar, o servidor informa de novo a situação do adversário.
      setPrazo(null);
    };
    const aoVoltar = () => setSemConexao(false);
    const aoCairAdversario = ({ timeoutSeconds }: { timeoutSeconds: number }) => {
      setAgora(Date.now());
      setPrazo(Date.now() + timeoutSeconds * 1000);
    };
    const encerrarEspera = () => setPrazo(null);

    socket.on('disconnect', aoCair);
    socket.on('connect', aoVoltar);
    socket.on('opponent:disconnected', aoCairAdversario);
    socket.on('opponent:reconnected', encerrarEspera);
    socket.on('game:over', encerrarEspera);
    return () => {
      socket.off('disconnect', aoCair);
      socket.off('connect', aoVoltar);
      socket.off('opponent:disconnected', aoCairAdversario);
      socket.off('opponent:reconnected', encerrarEspera);
      socket.off('game:over', encerrarEspera);
    };
  }, [socket]);

  // Calcula pelo relógio, para a contagem não atrasar com a aba em segundo plano.
  useEffect(() => {
    if (prazo === null) return;
    const relogio = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(relogio);
  }, [prazo]);

  return {
    semConexao,
    prazo,
    segundosRestantes: prazo === null ? null : Math.max(0, Math.ceil((prazo - agora) / 1000)),
  };
}
