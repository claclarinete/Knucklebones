import { useEffect, useId, useRef, type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  titulo: string;
  /** Chamado quando a pessoa fecha a janela, por exemplo com Esc. */
  aoFechar: () => void;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const janela = ref.current!;
    // showModal prende o foco na janela; o atributo cobre ambientes sem esse recurso.
    if (janela.showModal) janela.showModal();
    else janela.setAttribute('open', '');
    return () => janela.close?.();
  }, []);

  return (
    <dialog
      ref={ref}
      className="painel modal"
      aria-labelledby={idTitulo}
      onClose={() => {
        // Ignora o fechamento antigo quando o efeito reabre a janela.
        if (!ref.current?.open) aoFechar();
      }}
    >
      <h2 id={idTitulo} className="painel__titulo painel__titulo--destaque">
        {titulo}
      </h2>
      {children}
    </dialog>
  );
}
