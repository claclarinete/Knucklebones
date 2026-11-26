import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Regras } from './Regras';

function abrir() {
  render(
    <MemoryRouter initialEntries={['/regras']}>
      <Routes>
        <Route path="/" element={<h1>Lobby</h1>} />
        <Route path="/regras" element={<Regras />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Regras', () => {
  it.each([
    ['1. O tabuleiro', /3 colunas com 3 espaços/],
    ['2. Sua vez', /dado de 6 faces/],
    ['3. Destruição', /mesmo valor na coluna correspondente/],
    ['4. Pontuação', /soma das 3 colunas/],
    ['5. Fim de jogo', /Pontuações iguais dão empate/],
  ])('explica a regra "%s"', (titulo, trecho) => {
    abrir();

    const regra = screen.getByRole('region', { name: titulo });

    expect(within(regra).getAllByText(trecho).length).toBeGreaterThan(0);
  });

  it.each([
    ['Trio', '4 × 9 = 36'],
    ['Dupla', '4 × 4 + 2 = 18'],
    ['Nenhum igual', '1 + 2 + 3 = 6'],
  ])('mostra o exemplo de pontuação "%s"', (nome, conta) => {
    abrir();

    const exemplo = screen.getByRole('heading', { name: nome }).closest('li')!;

    expect(exemplo).toHaveTextContent(conta);
    expect(within(exemplo).getAllByRole('img')).toHaveLength(3);
  });

  it('leva de volta ao lobby', async () => {
    abrir();

    await userEvent.click(screen.getByRole('link', { name: 'Bora jogar' }));

    expect(screen.getByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
  });
});
