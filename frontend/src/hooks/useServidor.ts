import { useEffect, useState } from 'react';
import { getHealth } from '../services/api';

export type EstadoDaApi = 'consultando' | 'demorando' | 'indisponivel' | 'online';

/** Depois deste tempo, a pessoa é avisada de que o servidor está demorando. */
export const ESPERA_PARA_AVISAR = 3_000;
/** O plano gratuito da hospedagem leva cerca de um minuto para acordar. */
export const PRAZO_DA_CONSULTA = 75_000;

/** Consulta o /health e permite tentar de novo. */
export function useServidor() {
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
    getHealth(controle.signal).then(
      () => concluir('online'),
      () => concluir('indisponivel'),
    );
    return () => {
      atual = false;
      clearTimeout(aviso);
      clearTimeout(prazo);
      controle.abort();
    };
  }, [tentativa]);

  return {
    estado,
    tentarDeNovo() {
      setEstado('consultando');
      setTentativa((n) => n + 1);
    },
  };
}
