import type { Board } from '../types/jogo';
import { Dado } from './Dado';
import './Tabuleiro.css';

const ESPACOS = [0, 1, 2];

interface TabuleiroProps {
  /** Nome lido por leitores de tela, como "Seu tabuleiro". */
  nome: string;
  colunas: Board;
  /** No tabuleiro de cima, os dados se acumulam a partir de baixo, junto ao centro da mesa. */
  invertido?: boolean;
}

export function Tabuleiro({ nome, colunas, invertido = false }: TabuleiroProps) {
  return (
    <div className="tabuleiro" role="group" aria-label={nome}>
      {colunas.map((dados, coluna) => (
        <ol
          key={coluna}
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
      ))}
    </div>
  );
}
