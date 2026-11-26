import { useContext, useEffect, useState } from 'react';
import { consultarServidor } from '../services/servidor';
import { SocketContext } from '../services/SocketContext';

export type EstadoDaApi = 'consultando' | 'demorando' | 'indisponivel' | 'online';

/** Depois deste tempo, a pessoa é avisada de que o servidor está demorando. */
export const ESPERA_PARA_AVISAR = 3_000;
/** Com o servidor indisponível, uma nova consulta é feita depois deste tempo. */
export const INTERVALO_DE_REPETICAO = 5_000;
/** O plano gratuito da hospedagem leva cerca de um minuto para acordar. */
export const PRAZO_DA_CONSULTA = 75_000;

/** Verifica se o servidor responde e permite tentar de novo. */
export function useServidor() {
  const socket = useContext(SocketContext);
  const [estado, setEstado] = useState<EstadoDaApi>('consultando');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controle = new AbortController();
    let atual = true;
    const aviso = setTimeout(() => setEstado('demorando'), ESPERA_PARA_AVISAR);
    const prazo = setTimeout(() => controle.abort(), PRAZO_DA_CONSULTA);
    const concluir = (novo: EstadoDaApi) => {
      if (!atual) return;
      clearTimeout(aviso);
      clearTimeout(prazo);
      setEstado(novo);
    };
    consultarServidor(socket, controle.signal).then(
      () => concluir('online'),
      () => concluir('indisponivel'),
    );
    return () => {
      atual = false;
      clearTimeout(aviso);
      clearTimeout(prazo);
      controle.abort();
    };
  }, [tentativa, socket]);

  // Continua consultando em segundo plano, para o aviso sair quando o servidor voltar.
  useEffect(() => {
    if (estado !== 'indisponivel') return;
    let controle: AbortController;
    let prazo: ReturnType<typeof setTimeout>;
    let espera: ReturnType<typeof setTimeout>;
    let atual = true;

    function agendar() {
      espera = setTimeout(() => {
        controle = new AbortController();
        prazo = setTimeout(() => controle.abort(), PRAZO_DA_CONSULTA);
        consultarServidor(socket, controle.signal).then(
          () => atual && setEstado('online'),
          () => {
            clearTimeout(prazo);
            if (atual) agendar();
          },
        );
      }, INTERVALO_DE_REPETICAO);
    }

    agendar();
    return () => {
      atual = false;
      clearTimeout(espera);
      clearTimeout(prazo);
      controle?.abort();
    };
  }, [estado, socket]);

  return {
    estado,
    tentarDeNovo() {
      setEstado('consultando');
      setTentativa((n) => n + 1);
    },
  };
}
