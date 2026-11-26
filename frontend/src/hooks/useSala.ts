import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { codigoCompleto } from '../services/codigo';
import { esquecerPartida, lerPartida, salvarPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import type { GameStart } from '../types/jogo';
import { useApelido } from './useApelido';

export type MotivoDeErro = 'not_found' | 'full' | 'invalid_token' | 'invalid_payload';

export type Sala =
  | { fase: 'entrando' }
  | { fase: 'esperando' }
  | { fase: 'jogando'; partida: GameStart }
  | { fase: 'erro'; motivo: MotivoDeErro };

interface EstadoDaNavegacao {
  partida?: GameStart;
  criada?: boolean;
}

/** Acompanha a sala do endereço: entra, retoma ou espera o convidado. */
export function useSala(code: string) {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const apelido = useApelido();
  const estado = (useLocation().state ?? {}) as EstadoDaNavegacao;
  const [sala, setSala] = useState<Sala>(() => {
    if (!codigoCompleto(code)) return { fase: 'erro', motivo: 'not_found' };
    if (estado.partida?.code === code) return { fase: 'jogando', partida: estado.partida };
    return { fase: estado.criada && lerPartida(code) ? 'esperando' : 'entrando' };
  });
  const jaPediu = useRef(false);
  const precisaEntrar = sala.fase === 'entrando';
  const invalido = !codigoCompleto(code);

  useEffect(() => {
    if (invalido) return;

    // Com token salvo, esta aba já tem um assento: retoma em vez de entrar como outra pessoa.
    const pedir = () => {
      jaPediu.current = true;
      const salva = lerPartida(code);
      if (salva) socket.emit('game:rejoin', salva);
      else socket.emit('room:join', apelido ? { code, nickname: apelido } : { code });
    };
    const aoComecar = (partida: GameStart) => {
      if (partida.code !== code) return;
      salvarPartida(partida);
      setSala({ fase: 'jogando', partida });
    };
    const aoFalhar = ({ reason }: { reason: MotivoDeErro }) => {
      if (reason === 'invalid_token') esquecerPartida();
      setSala({ fase: 'erro', motivo: reason });
    };

    socket.on('connect', pedir);
    socket.on('game:start', aoComecar);
    socket.on('room:error', aoFalhar);
    if (!socket.connected) socket.connect();
    // A referência evita um segundo pedido quando o React executa o efeito de novo.
    else if (precisaEntrar && !jaPediu.current) pedir();

    return () => {
      socket.off('connect', pedir);
      socket.off('game:start', aoComecar);
      socket.off('room:error', aoFalhar);
    };
  }, [code, invalido, precisaEntrar, apelido, socket]);

  function cancelar() {
    socket.emit('room:cancel');
    esquecerPartida();
    navigate('/');
  }

  return { sala, cancelar };
}
