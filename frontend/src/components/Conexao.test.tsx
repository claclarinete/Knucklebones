import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocketContext } from '../services/SocketContext';
import { criarPartida } from '../test/partida';
import { criarSocketFalso } from '../test/socketFalso';
import { MesaDeJogo } from './MesaDeJogo';

function abrir() {
  const socket = criarSocketFalso();
  render(
    <SocketContext value={socket as unknown as Socket}>
      <MemoryRouter>
        <MesaDeJogo partida={criarPartida()} />
      </MemoryRouter>
    </SocketContext>,
  );
  return socket;
}

const clicar = (nome: string) => fireEvent.click(screen.getByRole('button', { name: nome }));
const coluna = () => screen.getByRole('button', { name: 'Jogar na coluna 1' });
const cair = (socket: ReturnType<typeof abrir>) =>
  act(() => socket.receber('opponent:disconnected', { timeoutSeconds: 60 }));
const passar = (segundos: number) => act(() => vi.advanceTimersByTime(segundos * 1000));

describe('desistência', () => {
  it('pede confirmação antes de enviar', () => {
    const socket = abrir();

    clicar('Desistir');

    expect(screen.getByRole('dialog', { name: 'Desistir?' })).toBeInTheDocument();
    expect(socket.enviados).toEqual([]);
  });

  it('continuar jogando fecha a confirmação sem desistir', () => {
    const socket = abrir();
    clicar('Desistir');

    clicar('Continuar jogando');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(socket.enviados).toEqual([]);
  });

  it('envia a desistência depois de confirmada', () => {
    const socket = abrir();
    clicar('Desistir');

    clicar('Sim, desistir');

    expect(socket.enviados).toEqual([['game:forfeit']]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não oferece desistir depois do fim', () => {
    const socket = abrir();

    act(() =>
      socket.receber('game:over', {
        winner: 'p2',
        scores: criarPartida().state.scores,
        reason: 'forfeit',
      }),
    );

    expect(screen.queryByRole('button', { name: 'Desistir' })).not.toBeInTheDocument();
    expect(screen.getByText('Você desistiu.')).toBeInTheDocument();
  });
});

describe('quedas de conexão', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conta o tempo que resta quando o adversário cai', () => {
    const socket = abrir();

    cair(socket);
    expect(screen.getByRole('timer')).toHaveTextContent('1:00');
    passar(18);

    expect(screen.getByRole('timer')).toHaveTextContent('0:42');
    expect(screen.getByText(/Rival perdeu a conexão/)).toBeInTheDocument();
  });

  it('a contagem para em zero', () => {
    const socket = abrir();

    cair(socket);
    passar(75);

    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
  });

  it('bloqueia as jogadas enquanto o adversário está fora', () => {
    const socket = abrir();

    cair(socket);

    expect(coluna()).toBeDisabled();
    expect(screen.getByText('Partida pausada')).toBeInTheDocument();
  });

  it('retoma a partida quando o adversário volta', () => {
    const socket = abrir();
    cair(socket);

    act(() => socket.receber('opponent:reconnected'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(coluna()).toBeEnabled();
  });

  it('com a janela fechada, mantém a contagem ao lado do tabuleiro', () => {
    const socket = abrir();
    cair(socket);

    clicar('Ver tabuleiro');
    passar(5);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Esperando o adversário voltar: 0:55')).toBeInTheDocument();
  });

  it('abre a janela de novo numa segunda queda', () => {
    const socket = abrir();
    cair(socket);
    clicar('Ver tabuleiro');
    act(() => socket.receber('opponent:reconnected'));
    passar(30);

    cair(socket);

    const janela = screen.getByRole('dialog', { name: 'Adversário desconectado' });
    expect(within(janela).getByRole('timer')).toHaveTextContent('1:00');
  });

  it('avisa quando a minha conexão cai e impede jogar ou desistir', () => {
    const socket = abrir();

    act(() => socket.receber('disconnect'));

    expect(screen.getByText('Reconectando...')).toBeInTheDocument();
    expect(coluna()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Desistir' })).toBeDisabled();
  });
});
