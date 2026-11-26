import type { Die } from '../types/jogo';
import './Dado.css';

/** Casas ocupadas por cada face numa grade 3 x 3, numeradas de 1 a 9 da esquerda para a direita. */
const PONTOS: Record<Die, number[]> = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export function Dado({ valor }: { valor: Die }) {
  return (
    <span className="dado" role="img" aria-label={`Dado ${valor}`}>
      {PONTOS[valor].map((casa) => (
        <span key={casa} className={`dado__ponto dado__ponto--${casa}`} />
      ))}
    </span>
  );
}
