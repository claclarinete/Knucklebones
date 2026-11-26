import type { Revanche } from '../hooks/useResultado';
import type { GameOver, PlayerId } from '../types/jogo';
import { Modal } from './Modal';
import './FimDePartida.css';

function explicar(reason: GameOver['reason'], venci: boolean) {
  if (reason === 'forfeit') return venci ? 'O adversário desistiu.' : 'Você desistiu.';
  if (reason === 'disconnect') {
    return venci ? 'O adversário não voltou a tempo.' : 'Sua conexão não voltou a tempo.';
  }
  return 'Um dos tabuleiros ficou cheio.';
}

const AVISOS: Record<Revanche, string> = {
  livre: '',
  pedida: 'Aguardando o adversário aceitar a revanche...',
  recebida: 'O adversário quer revanche!',
  indisponivel: 'O adversário saiu da partida.',
};

interface FimDePartidaProps {
  resultado: GameOver;
  voce: PlayerId;
  nomes: Record<PlayerId, string>;
  revanche: Revanche;
  aoPedirRevanche: () => void;
  aoVoltar: () => void;
  aoFechar: () => void;
}

export function FimDePartida(props: FimDePartidaProps) {
  const { resultado, voce, nomes, revanche } = props;
  const { winner, scores, reason } = resultado;
  const rival = voce === 'p1' ? 'p2' : 'p1';
  const venci = winner === voce;

  let titulo = venci ? 'Vitória!' : 'Derrota';
  if (winner === 'draw') titulo = 'Empate!';

  return (
    <Modal titulo="Fim de jogo" aoFechar={props.aoFechar}>
      <p className={venci ? 'fim__titulo fim__titulo--vitoria' : 'fim__titulo'}>{titulo}</p>
      <dl className="fim__placar">
        <div className="fim__voce">
          <dt>{nomes[voce]}</dt>
          <dd>{scores[voce].total}</dd>
        </div>
        <div>
          <dt>{nomes[rival]}</dt>
          <dd>{scores[rival].total}</dd>
        </div>
      </dl>
      <p>{explicar(reason, venci)}</p>
      <p role="status">{AVISOS[revanche]}</p>
      <div className="modal__acoes">
        {revanche !== 'indisponivel' && (
          <button
            type="button"
            className="botao"
            disabled={revanche === 'pedida'}
            onClick={props.aoPedirRevanche}
          >
            {revanche === 'recebida' ? 'Aceitar revanche' : 'Pedir revanche'}
          </button>
        )}
        <button type="button" className="botao botao--neutro" onClick={props.aoVoltar}>
          Voltar ao lobby
        </button>
        <button type="button" className="botao botao--neutro" onClick={props.aoFechar}>
          Ver tabuleiro
        </button>
      </div>
    </Modal>
  );
}
