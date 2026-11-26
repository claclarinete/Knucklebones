import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import type { Socket } from 'socket.io-client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { CHAVE_APELIDO } from '../hooks/useApelido';
import { CHAVE_PARTIDA, salvarPartida } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import { criarPartida } from '../test/partida';
import { criarSocketFalso } from '../test/socketFalso';
import { Partida } from './Partida';

const SALA = { code: 'K7P2QX', playerToken: 'segredo' };

function abrir({ caminho = '/partida/K7P2QX', criada = false, conectado = true } = {}) {
  const socket = criarSocketFalso(conectado);
  render(
    <StrictMode>
      <SocketContext value={socket as unknown as Socket}>
        <MemoryRouter initialEntries={[{ pathname: caminho, state: { criada } }]}>
          <Routes>
            <Route path="/" element={<h1>Lobby</h1>} />
            <Route path="/partida/:codigo" element={<Partida />} />
          </Routes>
        </MemoryRouter>
      </SocketContext>
    </StrictMode>,
  );
  return socket;
}

function abrirComoCriador() {
  salvarPartida(SALA);
  return abrir({ criada: true });
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('sala de espera', () => {
  it('mostra o código e o link de convite', () => {
    abrirComoCriador();

    expect(screen.getByLabelText('Código da sala: K 7 P 2 Q X')).toBeInTheDocument();
    expect(screen.getByLabelText('Link de convite')).toHaveValue(
      `${window.location.origin}/partida/K7P2QX`,
    );
  });

  it.each([
    ['Copiar código', 'K7P2QX'],
    ['Copiar link', `${window.location.origin}/partida/K7P2QX`],
  ])('%s coloca o texto na área de transferência', async (botao, esperado) => {
    const usuario = userEvent.setup();
    abrirComoCriador();

    await usuario.click(screen.getByRole('button', { name: botao }));

    await expect(navigator.clipboard.readText()).resolves.toBe(esperado);
    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });

  it('não entra de novo na própria sala', () => {
    const socket = abrirComoCriador();

    expect(socket.enviados).toEqual([]);
  });

  it('começa a partida quando o convidado entra', () => {
    const socket = abrirComoCriador();

    act(() => socket.receber('game:start', criarPartida()));

    expect(screen.getByRole('group', { name: 'Seu tabuleiro' })).toBeInTheDocument();
  });

  it('cancelar fecha a sala e volta ao lobby', async () => {
    const socket = abrirComoCriador();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar sala' }));

    expect(socket.enviados).toEqual([['room:cancel']]);
    expect(screen.getByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
    expect(sessionStorage.getItem(CHAVE_PARTIDA)).toBeNull();
  });
});

describe('entrada pelo endereço', () => {
  it('pede uma única vez para entrar na sala, com o apelido', () => {
    localStorage.setItem(CHAVE_APELIDO, 'Bia');

    const socket = abrir({ caminho: '/partida/k7p2qx' });

    expect(socket.enviados).toEqual([['room:join', { code: 'K7P2QX', nickname: 'Bia' }]]);
  });

  it('conecta antes de pedir para entrar', () => {
    const socket = abrir({ conectado: false });
    expect(socket.enviados).toEqual([]);

    act(() => socket.receber('connect'));

    expect(socket.enviados).toEqual([['room:join', { code: 'K7P2QX' }]]);
  });

  it('retoma o assento quando a aba já fazia parte da sala', () => {
    salvarPartida(SALA);

    const socket = abrir();

    expect(socket.enviados).toEqual([['game:rejoin', SALA]]);
  });

  it.each([
    ['not_found', 'Sala não encontrada'],
    ['full', 'Sala cheia'],
    ['invalid_token', 'Não foi possível retomar esta partida'],
  ])('o erro %s mostra "%s" com caminho de volta', async (reason, titulo) => {
    const socket = abrir();

    act(() => socket.receber('room:error', { reason }));

    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Voltar para o lobby' }));
    expect(screen.getByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
  });

  it('um código malformado nem consulta o servidor', () => {
    const socket = abrir({ caminho: '/partida/abc' });

    expect(screen.getByRole('heading', { name: 'Sala não encontrada' })).toBeInTheDocument();
    expect(socket.enviados).toEqual([]);
  });
});

describe('retomada', () => {
  it('ao recarregar, pede a partida de volta e mostra o tabuleiro', () => {
    salvarPartida(SALA);
    const socket = abrir({ conectado: false });

    act(() => socket.receber('connect'));
    expect(socket.enviados).toEqual([['game:rejoin', SALA]]);
    act(() => socket.receber('game:start', criarPartida()));

    expect(screen.getByRole('group', { name: 'Seu tabuleiro' })).toBeInTheDocument();
  });

  it('retoma o assento quando a conexão cai e volta no meio da partida', () => {
    salvarPartida(SALA);
    const socket = abrir();
    act(() => socket.receber('game:start', criarPartida()));
    socket.enviados.length = 0;

    act(() => socket.receber('disconnect'));
    expect(screen.getByText('Reconectando...')).toBeInTheDocument();
    act(() => socket.receber('connect'));

    expect(socket.enviados).toEqual([['game:rejoin', SALA]]);
    expect(screen.getByText('Sua vez')).toBeInTheDocument();
  });
});

