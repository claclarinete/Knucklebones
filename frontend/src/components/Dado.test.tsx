import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Die } from '../types/jogo';
import { Dado } from './Dado';

const VALORES: Die[] = [1, 2, 3, 4, 5, 6];

describe('Dado', () => {
  it.each(VALORES)('o dado %i é anunciado com o seu valor', (valor) => {
    render(<Dado valor={valor} />);

    expect(screen.getByRole('img', { name: `Dado ${valor}` })).toBeInTheDocument();
  });

  it.each(VALORES)('o dado %i desenha essa quantidade de pontos', (valor) => {
    render(<Dado valor={valor} />);

    expect(screen.getByRole('img').children).toHaveLength(valor);
  });
});
