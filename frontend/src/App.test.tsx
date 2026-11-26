import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' }))));
  afterEach(() => vi.unstubAllGlobals());

  it('consulta a saúde do servidor ao abrir o site', () => {
    renderAt('/regras');

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/health$/), expect.anything());
  });

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

  it('cada nova tela começa no topo', async () => {
    renderAt('/pagina-que-nao-existe');
    document.documentElement.scrollTop = 500;

    await userEvent.click(screen.getByRole('link', { name: 'Voltar para o lobby' }));

    expect(document.documentElement.scrollTop).toBe(0);
  });
});
