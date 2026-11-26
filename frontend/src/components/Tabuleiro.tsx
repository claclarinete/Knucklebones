import type { Board, Column } from '../types/jogo';
import { Dado } from './Dado';
import './Tabuleiro.css';

const ESPACOS = [0, 1, 2];

interface TabuleiroProps {
  /** Nome lido por leitores de tela, como "Seu tabuleiro". */
  nome: string;
  colunas: Board;
  /** No tabuleiro de cima, os dados se acumulam a partir de baixo, junto ao centro da mesa. */
  invertido?: boolean;
  /** Quando informado, cada coluna ganha um botão de jogada. */
  aoJogar?: (coluna: Column) => void;
  podeJogar?: boolean;
}

export function Tabuleiro({
  nome,
  colunas,
  invertido = false,
  aoJogar,
  podeJogar = false,
}: TabuleiroProps) {
  return (
    <div className="tabuleiro" role="group" aria-label={nome}>
      {colunas.map((dados, coluna) => (
        <div key={coluna} className="coluna-area">
          <ol
            className={invertido ? 'coluna coluna--invertida' : 'coluna'}
            aria-label={`Coluna ${coluna + 1}`}
          >
            {ESPACOS.map((espaco) => {
              const valor = dados[espaco];
              return (
                <li key={espaco} className="espaco">
                  {valor ? <Dado valor={valor} /> : <span className="so-leitor">Espaço vazio</span>}
                </li>
              );
            })}
          </ol>
          {aoJogar && (
            // O botão cobre a coluna inteira, sem esconder a lista dos leitores de tela.
            <button
              type="button"
              className="coluna__jogar"
              aria-label={`Jogar na coluna ${coluna + 1}`}
              disabled={!podeJogar || dados.length >= ESPACOS.length}
              onClick={() => aoJogar(coluna as Column)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
