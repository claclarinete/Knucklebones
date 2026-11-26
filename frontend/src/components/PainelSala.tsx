import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { codigoCompleto, limparCodigo, TAMANHO_CODIGO } from '../services/codigo';

interface PainelSalaProps {
  aoCriar: () => void;
  /** Mensagem exibida enquanto o servidor cria a sala. */
  andamento?: string;
  aoCancelar: () => void;
  erro?: string;
  desabilitado?: boolean;
}

export function PainelSala({ aoCriar, andamento, aoCancelar, erro, desabilitado }: PainelSalaProps) {
  const [codigo, setCodigo] = useState('');
  const navigate = useNavigate();

  function aoEntrar(evento: FormEvent) {
    evento.preventDefault();
    if (codigoCompleto(codigo)) navigate(`/partida/${codigo}`);
  }

  return (
    <section className="painel" aria-labelledby="titulo-amigo">
      <h2 id="titulo-amigo" className="painel__titulo">
        Com um amigo
      </h2>
      <p>Crie uma sala e mande o código ou o link.</p>
      {erro && (
        <p role="alert" className="lobby__erro">
          {erro}
        </p>
      )}
      {andamento ? (
        <>
          <p role="status">{andamento}</p>
          <button type="button" className="botao botao--perigo" onClick={aoCancelar}>
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" className="botao botao--jogador" disabled={desabilitado} onClick={aoCriar}>
          Criar sala
        </button>
      )}
      <form className="lobby__codigo" onSubmit={aoEntrar}>
        <label htmlFor="codigo-sala">Código da sala</label>
        <input
          id="codigo-sala"
          value={codigo}
          placeholder="K7P2QX"
          autoComplete="off"
          size={TAMANHO_CODIGO}
          onChange={(e) => setCodigo(limparCodigo(e.target.value))}
        />
        <button type="submit" className="botao botao--neutro" disabled={desabilitado || !codigoCompleto(codigo)}>
          Entrar
        </button>
      </form>
    </section>
  );
}
