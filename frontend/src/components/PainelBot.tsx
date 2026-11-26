import { useState, type FormEvent } from 'react';
import type { Difficulty } from '../types/jogo';
import './PainelBot.css';

const DIFICULDADES: { valor: Difficulty; nome: string; descricao: string }[] = [
  { valor: 'easy', nome: 'Fácil', descricao: 'Joga numa coluna qualquer.' },
  { valor: 'medium', nome: 'Médio', descricao: 'Busca pontos e tenta destruir seus dados.' },
  { valor: 'hard', nome: 'Difícil', descricao: 'Pensa algumas jogadas à frente.' },
];

interface PainelBotProps {
  aoJogar: (dificuldade: Difficulty) => void;
  /** Mensagem exibida enquanto o servidor prepara a partida. */
  andamento?: string;
  aoCancelar: () => void;
  erro?: string;
  desabilitado?: boolean;
}

export function PainelBot({ aoJogar, andamento, aoCancelar, erro, desabilitado }: PainelBotProps) {
  const [dificuldade, setDificuldade] = useState<Difficulty>('medium');

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    aoJogar(dificuldade);
  }

  return (
    <section className="painel bot" aria-labelledby="titulo-bot">
      <h2 id="titulo-bot" className="painel__titulo painel__titulo--destaque">
        Contra o bot
      </h2>
      <form onSubmit={aoEnviar}>
        <p>Treine sozinho.</p>
        <fieldset className="bot__opcoes" disabled={Boolean(andamento)}>
          <legend>Dificuldade</legend>
          {DIFICULDADES.map(({ valor, nome, descricao }, nivel) => (
            <label key={valor} className="opcao">
              <input
                type="radio"
                name="dificuldade"
                className="so-leitor"
                checked={dificuldade === valor}
                onChange={() => setDificuldade(valor)}
                aria-labelledby={`nome-${valor}`}
                aria-describedby={`descricao-${valor}`}
              />
              <span className="opcao__nivel" aria-hidden="true">
                {DIFICULDADES.map((_, barra) => (
                  <span key={barra} className={barra <= nivel ? 'cheia' : undefined} />
                ))}
              </span>
              <span>
                <strong id={`nome-${valor}`} className="opcao__nome">
                  {nome}
                </strong>
                <span id={`descricao-${valor}`}>{descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>
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
          <button type="submit" className="botao" disabled={desabilitado}>
            Jogar contra o bot
          </button>
        )}
      </form>
    </section>
  );
}
