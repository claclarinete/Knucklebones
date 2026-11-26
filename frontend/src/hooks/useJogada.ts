import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../services/SocketContext';
import type { Column, GameStart, GameState, MotivoDeJogadaRecusada } from '../types/jogo';

const RECUSAS: Record<MotivoDeJogadaRecusada, string> = {
  not_your_turn: 'Ainda não é a sua vez.',
  column_full: 'Essa coluna está cheia.',
  game_not_active: 'A partida não está ativa.',
  invalid_payload: 'O servidor recusou a jogada.',
};

/** Estado da partida recebido do servidor e o envio das jogadas. */
export function useJogada(partida: GameStart) {
  const socket = useContext(SocketContext);
  const [estado, setEstado] = useState<GameState>(partida.state);
  // Bloqueia novos cliques até o servidor responder à jogada enviada.
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const aoMudar = ({ state }: { state: GameState }) => {
      setEstado(state);
      setEnviando(false);
      setErro('');
    };
    const aoRecusar = ({ reason }: { reason: MotivoDeJogadaRecusada }) => {
      setEnviando(false);
      setErro(RECUSAS[reason]);
    };
    // A jogada pendente pode ter se perdido com a conexão.
    const aoDesconectar = () => setEnviando(false);

    // Retomada e revanche chegam como game:start e substituem o estado atual.
    socket.on('game:start', aoMudar);
    socket.on('game:state', aoMudar);
    socket.on('game:error', aoRecusar);
    socket.on('disconnect', aoDesconectar);
    return () => {
      socket.off('game:start', aoMudar);
      socket.off('game:state', aoMudar);
      socket.off('game:error', aoRecusar);
      socket.off('disconnect', aoDesconectar);
    };
  }, [socket]);

  const minhaVez = estado.status === 'playing' && estado.currentPlayer === partida.you;
  const podeJogar = minhaVez && !enviando;

  return {
    estado,
    erro,
    minhaVez,
    podeJogar,
    jogar(column: Column) {
      if (!podeJogar || !socket.connected) return;
      setEnviando(true);
      setErro('');
      socket.emit('game:move', { column });
    },
  };
}
