import { MesaDeJogo } from '../components/MesaDeJogo';
import { useConexao } from '../hooks/useConexao';
import { useResultado } from '../hooks/useResultado';
import type { GameStart } from '../types/jogo';

/** A mesa com os avisos do servidor que a tela da partida entrega a ela. */
export function MesaComAvisos({ partida }: { partida: GameStart }) {
  return <MesaDeJogo partida={partida} conexao={useConexao()} fim={useResultado()} />;
}
