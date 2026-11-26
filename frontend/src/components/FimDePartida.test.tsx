import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CHAVE_PARTIDA, salvarPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import { criarEstado, criarPartida } from '../test/partida';
import { criarSocketFalso } from '../test/socketFalso';
import type { GameOver } from '../types/jogo';
import { MesaDeJogo } from './MesaDeJogo';

const placar = {
  p1: { columns: [20, 5, 6] as [number, number, number], total: 31 },
  p2: { columns: [1, 2, 3] as [number, number, number], total: 6 },
};

function terminar(mudancas: Partial<GameOver> = {}) {
  const socket = criarSocketFalso();
  salvarPartida(criarPartida());
  render(
    <SocketContext value={socket as unknown as Socket}>
      <MemoryRouter initialEntries={['/partida/K7P2QX']}>
        <Routes>
          <Route path="/" element={<h1>Lobby</h1>} />
          <Route path="/partida/:codigo" element={<MesaDeJogo partida={criarPartida()} />} />
        </Routes>
      </MemoryRouter>
    </SocketContext>,
  );
  act(() => {
    socket.receber('game:state', { state: criarEstado({ status: 'finished', die: null }) });
    socket.receber('game:over', { winner: 'p1', scores: placar, reason: 'finished', ...mudancas });
  });
  return socket;
}

const janela = () => screen.getByRole('dialog', { name: 'Fim de jogo' });

describe('fim de partida', () => {
  it.each([
    ['p1', 'Vitória!'],
    ['p2', 'Derrota'],
    ['draw', 'Empate!'],
  ] as const)('com vencedor %s mostra "%s" e o placar', (winner, titulo) => {
    terminar({ winner });

    expect(within(janela()).getByText(titulo)).toBeInTheDocument();
    expect(within(janela()).getByText('Ana').nextSibling).toHaveTextContent('31');
    expect(within(janela()).getByText('Rival').nextSibling).toHaveTextContent('6');
  });

  it.each([
    ['forfeit', 'p1', 'O adversário desistiu.'],
    ['forfeit', 'p2', 'Você desistiu.'],
    ['disconnect', 'p1', 'O adversário não voltou a tempo.'],
    ['disconnect', 'p2', 'Sua conexão não voltou a tempo.'],
    ['finished', 'p1', 'Um dos tabuleiros ficou cheio.'],
  ] as const)('explica o fim por %s quando vence %s', (reason, winner, texto) => {
    terminar({ reason, winner });

    expect(within(janela()).getByText(texto)).toBeInTheDocument();
  });

  it('volta ao lobby, esquece a partida e avisa o servidor da saída', async () => {
    const socket = terminar();

    await userEvent.click(within(janela()).getByRole('button', { name: 'Voltar ao lobby' }));

    expect(screen.getByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
    expect(sessionStorage.getItem(CHAVE_PARTIDA)).toBeNull();
    expect(socket.desconexoes).toBe(1);
  });

  it('pede revanche uma única vez e aguarda', async () => {
    const socket = terminar();
    const pedir = screen.getByRole('button', { name: 'Pedir revanche' });

    await userEvent.click(pedir);
    await userEvent.click(pedir);

    expect(socket.enviados).toEqual([['game:rematch']]);
    expect(within(janela()).getByRole('status')).toHaveTextContent('Aguardando o adversário');
  });

  it('permite aceitar a revanche pedida pelo adversário', async () => {
    const socket = terminar();
    act(() => socket.receber('game:rematch-requested'));

    await userEvent.click(screen.getByRole('button', { name: 'Aceitar revanche' }));

    expect(socket.enviados).toEqual([['game:rematch']]);
  });

  it('retira a revanche quando o adversário sai', () => {
    const socket = terminar();

    act(() => socket.receber('opponent:left'));

    expect(screen.queryByRole('button', { name: /revanche/ })).not.toBeInTheDocument();
    expect(within(janela()).getByRole('status')).toHaveTextContent('O adversário saiu');
  });

  it.each(['game:start', 'game:state'])('a revanche aceita (%s) reinicia a mesa', (evento) => {
    const socket = terminar();

    act(() => socket.receber(evento, criarPartida()));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jogar na coluna 1' })).toBeEnabled();
  });

  it('permite rever o tabuleiro e reabrir o resultado', async () => {
    terminar();

    await userEvent.click(screen.getByRole('button', { name: 'Ver tabuleiro' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jogar na coluna 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Ver resultado' }));

    expect(janela()).toBeInTheDocument();
  });
});
