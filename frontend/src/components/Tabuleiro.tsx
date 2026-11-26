import { useEffect, useRef } from 'react';
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
  const raiz = useRef<HTMLDivElement>(null);
  const ultima = useRef<number | null>(null);

  // O botão desabilitado perde o foco: ao voltar a vez, devolve quem joga por teclado ao lugar.
  useEffect(() => {
    if (!podeJogar || ultima.current === null) return;
    if (document.activeElement !== document.body) return;
    const botoes = [...raiz.current!.querySelectorAll('button')];
    const anterior = botoes[ultima.current];
    const destino = anterior?.disabled ? botoes.find((botao) => !botao.disabled) : anterior;
    destino?.focus({ preventScroll: true });
  }, [podeJogar]);

  return (
    <div ref={raiz} className="tabuleiro" role="group" aria-label={nome}>
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
                onClick={() => {
                  ultima.current = coluna;
                  aoJogar(coluna as Column);
                }}
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
