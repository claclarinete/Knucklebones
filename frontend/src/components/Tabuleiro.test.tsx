import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabuleiro } from './Tabuleiro';

describe('Tabuleiro', () => {
  it('mostra 3 colunas com 3 espaços cada', () => {
    render(<Tabuleiro nome="Seu tabuleiro" colunas={[[], [], []]} />);

    const colunas = screen.getAllByRole('list');
    expect(colunas).toHaveLength(3);
    expect(colunas.map((c) => within(c).getAllByRole('listitem').length)).toEqual([3, 3, 3]);
  });

  it('é identificado pelo nome', () => {
    render(<Tabuleiro nome="Tabuleiro do adversário" colunas={[[], [], []]} />);

    expect(screen.getByRole('group', { name: 'Tabuleiro do adversário' })).toBeInTheDocument();
  });

  it('coloca os dados na coluna certa, na ordem em que foram jogados', () => {
    render(<Tabuleiro nome="Seu tabuleiro" colunas={[[], [6, 2], []]} />);

    const coluna = screen.getByRole('list', { name: 'Coluna 2' });
    const dados = within(coluna).getAllByRole('img');
    expect(dados.map((d) => d.getAttribute('aria-label'))).toEqual(['Dado 6', 'Dado 2']);
  });

  it('indica os espaços ainda vazios', () => {
    render(<Tabuleiro nome="Seu tabuleiro" colunas={[[4], [], []]} />);

    expect(screen.getAllByText('Espaço vazio')).toHaveLength(8);
  });
});
