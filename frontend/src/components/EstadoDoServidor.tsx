import { useServidor } from '../hooks/useServidor';
import './EstadoDoServidor.css';

const AVISOS = {
  consultando: '',
  online: '',
  demorando: 'O servidor está acordando. Isso pode levar cerca de um minuto.',
  indisponivel: 'Não foi possível falar com o servidor.',
};

export function EstadoDoServidor() {
  const { estado, tentarDeNovo } = useServidor();
  const aviso = AVISOS[estado];

  // A região de status existe desde o início para o leitor de tela anunciar o aviso.
  return (
    <div className={aviso ? 'servidor servidor--visivel' : 'servidor'}>
      <p role="status">{aviso}</p>
      {estado === 'indisponivel' && (
        <button type="button" className="botao" onClick={tentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}
