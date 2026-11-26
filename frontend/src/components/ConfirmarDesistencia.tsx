import { Modal } from './Modal';

interface Props {
  aoConfirmar: () => void;
  aoFechar: () => void;
}

export function ConfirmarDesistencia({ aoConfirmar, aoFechar }: Props) {
  return (
    <Modal titulo="Desistir?" aoFechar={aoFechar}>
      <p>A vitória fica com o adversário e não dá para voltar atrás.</p>
      <div className="modal__acoes">
        {/* A opção segura vem primeiro e recebe o foco ao abrir. */}
        <button type="button" className="botao botao--neutro" onClick={aoFechar}>
          Continuar jogando
        </button>
        <button type="button" className="botao botao--perigo" onClick={aoConfirmar}>
          Sim, desistir
        </button>
      </div>
    </Modal>
  );
}
