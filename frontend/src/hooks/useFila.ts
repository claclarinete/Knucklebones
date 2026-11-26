import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { salvarPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import type { GameStart } from '../types/jogo';

export type FaseDaFila = 'parado' | 'conectando' | 'entrando' | 'esperando';

export function useFila() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<{ nickname?: string } | null>(null);
  const [fase, setFase] = useState<FaseDaFila>('parado');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!pedido) return;
    let pareado = false;

    // Também roda após uma reconexão, porque o servidor tira da fila quem desconecta.
    const aoConectar = () => {
      setFase('entrando');
      socket.emit('queue:join', pedido);
    };
    const aoDesconectar = () => setFase('conectando');
    const aoEsperar = () => setFase('esperando');
    const aoComecar = (partida: GameStart) => {
      pareado = true;
      salvarPartida(partida);
      navigate(`/partida/${partida.code}`, { state: partida });
    };
    const aoFalhar = () => {
      setErro('Não foi possível entrar na fila. Tente de novo.');
      setPedido(null);
      setFase('parado');
    };

    socket.on('connect', aoConectar);
    socket.on('disconnect', aoDesconectar);
    socket.on('queue:waiting', aoEsperar);
    socket.on('game:start', aoComecar);
    socket.on('room:error', aoFalhar);
    if (socket.connected) aoConectar();
    else socket.connect();

    return () => {
      socket.off('connect', aoConectar);
      socket.off('disconnect', aoDesconectar);
      socket.off('queue:waiting', aoEsperar);
      socket.off('game:start', aoComecar);
      socket.off('room:error', aoFalhar);
      // Cobre o botão Cancelar e a saída do lobby.
      if (!pareado && socket.connected) socket.emit('queue:leave');
    };
  }, [pedido, socket, navigate]);

  return {
    fase,
    erro,
    entrar(apelido: string) {
      setErro('');
      setFase('conectando');
      setPedido(apelido ? { nickname: apelido } : {});
    },
    cancelar() {
      setPedido(null);
      setFase('parado');
    },
  };
}
