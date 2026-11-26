import { render, screen } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { SocketContext } from './services/SocketContext';
import { criarSocketFalso } from './test/socketFalso';

function renderAt(path: string) {
  render(
    <SocketContext value={criarSocketFalso() as unknown as Socket}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </SocketContext>,
  );
}

describe('rotas', () => {
  it.each([
    ['/', 'Olá, visitante!'],
    ['/regras', 'Como jogar'],
  ])('%s mostra a página %s', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  });

  it('a partida mostra o código da sala vindo do link', () => {
    renderAt('/partida/K7P2QX');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Partida');
    expect(screen.getByText('Sala K7P2QX')).toBeInTheDocument();
  });

  it('rota desconhecida mostra página não encontrada com link para o lobby', () => {
    renderAt('/nao-existe');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada');
    expect(screen.getByRole('link', { name: 'Voltar para o lobby' })).toHaveAttribute('href', '/');
  });
});
