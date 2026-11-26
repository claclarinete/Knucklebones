import type { Board, Column, Die, Score } from '../types/jogo';
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
  /** Pontos de cada coluna, calculados pelo servidor. */
  pontos?: Score['columns'];
  /** Indica os dados que a jogada da vez destruiria. */
  ameacado?: (coluna: number, valor: Die) => boolean;
}

export function Tabuleiro({
  nome,
  colunas,
  invertido = false,
  aoJogar,
  podeJogar = false,
  pontos,
  ameacado,
}: TabuleiroProps) {
  return (
    <div className="tabuleiro" role="group" aria-label={nome}>
      {colunas.map((dados, coluna) => (
        <div
          key={coluna}
          className={invertido ? 'coluna-area coluna-area--invertida' : 'coluna-area'}
        >
          <div className="coluna-alvo">
            <ol
              className={invertido ? 'coluna coluna--invertida' : 'coluna'}
              aria-label={`Coluna ${coluna + 1}`}
            >
              {ESPACOS.map((espaco) => {
                const valor = dados[espaco];
                return (
                  <li key={espaco} className="espaco">
                    {valor ? (
                      <Dado
                        valor={valor}
                        repetidos={dados.filter((outro) => outro === valor).length}
                        ameacado={ameacado?.(coluna, valor)}
                      />
                    ) : (
                      <span className="so-leitor">Espaço vazio</span>
                    )}
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
          {pontos && (
            <p className="coluna__pontos">
              <span className="so-leitor">Pontos da coluna {coluna + 1}: </span>
              {pontos[coluna]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
