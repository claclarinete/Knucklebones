import { formatarTempo } from '../services/tempo';
import { Modal } from './Modal';

interface Props {
  nome: string;
  segundos: number;
  aoFechar: () => void;
}

export function AdversarioDesconectado({ nome, segundos, aoFechar }: Props) {
  return (
    <Modal titulo="Adversário desconectado" aoFechar={aoFechar}>
      <p>{nome} perdeu a conexão. A partida está pausada.</p>
      {/* O papel timer evita que o leitor de tela anuncie cada segundo. */}
      <p role="timer" className="contagem">
        {formatarTempo(segundos)}
      </p>
      <p>Se a conexão não voltar a tempo, você vence por abandono.</p>
      <div className="modal__acoes">
        <button type="button" className="botao botao--neutro" onClick={aoFechar}>
          Ver tabuleiro
        </button>
      </div>
    </Modal>
  );
}
