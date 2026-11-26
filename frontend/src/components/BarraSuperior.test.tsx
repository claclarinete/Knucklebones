import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { CHAVE_APELIDO } from '../hooks/useApelido';
import { BarraSuperior } from './BarraSuperior';

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <BarraSuperior />
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
});

describe('BarraSuperior', () => {
  it.each([
    ['Jogar', '/'],
    ['Regras', '/regras'],
  ])('o link %s leva para %s', (nome, destino) => {
    renderAt('/');

    expect(screen.getByRole('link', { name: nome })).toHaveAttribute('href', destino);
  });

  it('destaca a página atual', () => {
    renderAt('/regras');

    expect(screen.getByRole('link', { name: 'Regras' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Jogar' })).not.toHaveAttribute('aria-current');
  });

  it('muda o destaque ao navegar', async () => {
    renderAt('/regras');

    await userEvent.click(screen.getByRole('link', { name: 'Jogar' }));

    expect(screen.getByRole('link', { name: 'Jogar' })).toHaveAttribute('aria-current', 'page');
  });

  it('mostra o apelido salvo no navegador', () => {
    localStorage.setItem(CHAVE_APELIDO, 'Zé');
    renderAt('/');

    expect(screen.getByText('Zé')).toBeInTheDocument();
  });

  it('não mostra jogador quando não há apelido', () => {
    renderAt('/');

    expect(screen.getByRole('banner')).toHaveTextContent(/^KnucklebonesJogarRegras$/);
  });
});
