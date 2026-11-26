import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { salvarPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import type { Difficulty, GameStart } from '../types/jogo';

export type Modo = 'fila' | 'bot';
export type Fase = 'conectando' | 'enviando' | 'esperando';

type Pedido =
  | { modo: 'fila'; evento: 'queue:join'; dados: { nickname?: string } }
  | { modo: 'bot'; evento: 'room:create'; dados: { mode: 'bot'; difficulty: Difficulty; nickname?: string } };

const FALHAS: Record<Modo, string> = {
  fila: 'Não foi possível entrar na fila. Tente de novo.',
  bot: 'Não foi possível começar a partida. Tente de novo.',
};

const comApelido = (apelido: string) => (apelido ? { nickname: apelido } : {});

/** Pede uma partida ao servidor (fila ou bot) e abre a tela dela quando começar. */
export function useBuscaDePartida() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  // Um pedido por vez: começar outro encerra o anterior.
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [fase, setFase] = useState<Fase>('conectando');
  const [erro, setErro] = useState<{ modo: Modo; mensagem: string } | null>(null);

  useEffect(() => {
    if (!pedido) return;
    let comecou = false;

    // Também roda após uma reconexão, porque o servidor tira da fila quem desconecta.
    const aoConectar = () => {
      setFase('enviando');
      socket.emit(pedido.evento, pedido.dados);
    };
    const aoDesconectar = () => setFase('conectando');
    const aoEsperar = () => setFase('esperando');
    const aoComecar = (partida: GameStart) => {
      comecou = true;
      salvarPartida(partida);
      navigate(`/partida/${partida.code}`, { state: partida });
    };
    const aoFalhar = () => {
      setErro({ modo: pedido.modo, mensagem: FALHAS[pedido.modo] });
      setPedido(null);
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
      // Cobre o botão Cancelar, a troca de modo e a saída do lobby.
      if (pedido.modo === 'fila' && !comecou && socket.connected) socket.emit('queue:leave');
    };
  }, [pedido, socket, navigate]);

  function pedir(novo: Pedido) {
    setErro(null);
    setFase('conectando');
    setPedido(novo);
  }

  return {
    /** Modo do pedido em andamento, ou null quando não há nenhum. */
    modo: pedido?.modo ?? null,
    fase,
    erro,
    entrarNaFila(apelido: string) {
      pedir({ modo: 'fila', evento: 'queue:join', dados: comApelido(apelido) });
    },
    jogarContraBot(difficulty: Difficulty, apelido: string) {
      pedir({
        modo: 'bot',
        evento: 'room:create',
        dados: { mode: 'bot', difficulty, ...comApelido(apelido) },
      });
    },
    cancelar() {
      setPedido(null);
    },
  };
}
