import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { CHAVE_APELIDO } from '../hooks/useApelido';
import { CHAVE_PARTIDA } from '../services/partida';
import { SocketContext } from '../services/SocketContext';
import { criarSocketFalso } from '../test/socketFalso';
import { Lobby } from './Lobby';

function abrirLobby({ conectado = true } = {}) {
  const socket = criarSocketFalso(conectado);
  const tela = render(
    <SocketContext value={socket as unknown as Socket}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/partida/:codigo" element={<h1>Tela da partida</h1>} />
        </Routes>
      </MemoryRouter>
    </SocketContext>,
  );
  return { socket, ...tela };
}

const entrarNaFila = () => userEvent.click(screen.getByRole('button', { name: 'Entrar na fila' }));
const campoApelido = () => screen.getByLabelText('Apelido (opcional)');

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('Lobby', () => {
  it('salva o apelido no navegador e cumprimenta por ele', async () => {
    abrirLobby();

    await userEvent.type(campoApelido(), 'Ana Lu');

    expect(localStorage.getItem(CHAVE_APELIDO)).toBe('Ana Lu');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Olá, Ana Lu!');
  });

  it('preenche o campo com o apelido já salvo', () => {
    localStorage.setItem(CHAVE_APELIDO, 'Bia');
    abrirLobby();

    expect(campoApelido()).toHaveValue('Bia');
  });

  it('impede entrar na fila com apelido inválido', async () => {
    abrirLobby();

    await userEvent.type(campoApelido(), '<ana>');

    expect(screen.getByRole('button', { name: 'Entrar na fila' })).toBeDisabled();
    expect(campoApelido()).toHaveAccessibleDescription(/Use apenas letras/);
  });

  it.each([
    ['com apelido', 'Ana', { nickname: 'Ana' }],
    ['sem apelido', '', {}],
  ])('pede para entrar na fila %s', async (_caso, apelido, dados) => {
    localStorage.setItem(CHAVE_APELIDO, apelido);
    const { socket } = abrirLobby();

    await entrarNaFila();

    expect(socket.enviados).toEqual([['queue:join', dados]]);
  });

  it('conecta antes de pedir a entrada na fila', async () => {
    const { socket } = abrirLobby({ conectado: false });

    await entrarNaFila();
    expect(screen.getByRole('status')).toHaveTextContent('Conectando ao servidor');
    expect(socket.enviados).toEqual([]);

    act(() => socket.receber('connect'));
    expect(socket.enviados).toEqual([['queue:join', {}]]);
  });

  it('mostra a espera quando o servidor confirma a fila', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    act(() => socket.receber('queue:waiting'));

    expect(screen.getByRole('status')).toHaveTextContent('Aguardando adversário');
  });

  it('cancelar sai da fila e volta ao formulário', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(socket.enviados.at(-1)).toEqual(['queue:leave']);
    expect(screen.getByRole('button', { name: 'Entrar na fila' })).toBeInTheDocument();
  });

  it('sai da fila ao deixar o lobby', async () => {
    const { socket, unmount } = abrirLobby();
    await entrarNaFila();

    unmount();

    expect(socket.enviados.at(-1)).toEqual(['queue:leave']);
  });

  it('abre a partida e guarda o necessário para retomá-la', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    act(() => socket.receber('game:start', { code: 'K7P2QX', playerToken: 'segredo' }));

    expect(screen.getByRole('heading', { name: 'Tela da partida' })).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(CHAVE_PARTIDA)!)).toEqual({
      code: 'K7P2QX',
      playerToken: 'segredo',
    });
    expect(socket.enviados).not.toContainEqual(['queue:leave']);
  });

  it('avisa quando o servidor recusa a entrada', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    act(() => socket.receber('room:error', { reason: 'invalid_payload' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível entrar na fila');
  });

  it('volta a pedir a fila depois de uma queda de conexão', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    act(() => socket.receber('disconnect'));
    expect(screen.getByRole('status')).toHaveTextContent('Conectando ao servidor');
    act(() => socket.receber('connect'));

    expect(socket.enviados.filter(([evento]) => evento === 'queue:join')).toHaveLength(2);
  });
});
