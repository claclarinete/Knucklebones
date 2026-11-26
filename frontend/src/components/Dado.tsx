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

interface DadoProps {
  valor: Die;
  /** Quantos dados deste valor há na coluna: marca duplas e trios. */
  repetidos?: number;
  /** A jogada da vez destruiria este dado. */
  ameacado?: boolean;
}

export function Dado({ valor, repetidos = 1, ameacado = false }: DadoProps) {
  const grupo = repetidos === 2 ? 'dupla' : repetidos === 3 ? 'trio' : null;
  const rotulo = [`Dado ${valor}`, grupo, ameacado && 'será destruído'].filter(Boolean);
  const classes = ['dado', grupo && `dado--${grupo}`, ameacado && 'dado--ameacado'];

  return (
    <span className={classes.filter(Boolean).join(' ')} role="img" aria-label={rotulo.join(', ')}>
      {PONTOS[valor].map((casa) => (
        <span key={casa} className={`dado__ponto dado__ponto--${casa}`} />
      ))}
    </span>
  );
}
