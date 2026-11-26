import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { esquecerPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import type { GameOver, GameState } from '../types/jogo';

export type Revanche = 'livre' | 'pedida' | 'recebida' | 'indisponivel';

/** Resultado enviado pelo servidor, pedido de revanche e saída para o lobby. */
export function useResultado() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<GameOver | null>(null);
  const [revanche, setRevanche] = useState<Revanche>('livre');

  useEffect(() => {
    const limpar = () => {
      setResultado(null);
      setRevanche('livre');
    };
    // A revanche chega como uma nova partida ou como um estado que voltou a estar em jogo.
    const aoMudar = ({ state }: { state: GameState }) => {
      if (state.status !== 'finished') limpar();
    };
    const aoReceberPedido = () => setRevanche('recebida');
    const aoSairAdversario = () => setRevanche('indisponivel');

    socket.on('game:over', setResultado);
    socket.on('game:start', limpar);
    socket.on('game:state', aoMudar);
    socket.on('game:rematch-requested', aoReceberPedido);
    socket.on('opponent:left', aoSairAdversario);
    return () => {
      socket.off('game:over', setResultado);
      socket.off('game:start', limpar);
      socket.off('game:state', aoMudar);
      socket.off('game:rematch-requested', aoReceberPedido);
      socket.off('opponent:left', aoSairAdversario);
    };
  }, [socket]);

  return {
    resultado,
    revanche,
    pedirRevanche() {
      socket.emit('game:rematch');
      setRevanche('pedida');
    },
    voltarAoLobby() {
      esquecerPartida();
      navigate('/');
    },
  };
}
