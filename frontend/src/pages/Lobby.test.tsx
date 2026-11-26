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
const jogarContraBot = () =>
  userEvent.click(screen.getByRole('button', { name: 'Jogar contra o bot' }));
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

  it('oferece três dificuldades com descrição', () => {
    abrirLobby();

    const opcoes = screen.getAllByRole('radio');
    expect(opcoes).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Fácil' })).toHaveAccessibleDescription(/qualquer/);
    expect(screen.getByRole('radio', { name: 'Médio' })).toHaveAccessibleDescription(/destruir/);
    expect(screen.getByRole('radio', { name: 'Difícil' })).toHaveAccessibleDescription(/à frente/);
  });

  it('começa com a dificuldade média selecionada', () => {
    abrirLobby();

    expect(screen.getByRole('radio', { name: 'Médio' })).toBeChecked();
  });

  it.each([
    ['Fácil', 'easy'],
    ['Médio', 'medium'],
    ['Difícil', 'hard'],
  ])('pede uma partida contra o bot no nível %s', async (nome, difficulty) => {
    localStorage.setItem(CHAVE_APELIDO, 'Ana');
    const { socket } = abrirLobby();

    await userEvent.click(screen.getByRole('radio', { name: nome }));
    await jogarContraBot();

    expect(socket.enviados).toEqual([
      ['room:create', { mode: 'bot', difficulty, nickname: 'Ana' }],
    ]);
  });

  it('abre a partida contra o bot quando ela começa', async () => {
    const { socket } = abrirLobby();
    await jogarContraBot();

    act(() => socket.receber('game:start', { code: 'B0TB0T', playerToken: 'segredo' }));

    expect(screen.getByRole('heading', { name: 'Tela da partida' })).toBeInTheDocument();
  });

  it('trocar a fila pelo bot sai da fila antes de criar a partida', async () => {
    const { socket } = abrirLobby();
    await entrarNaFila();

    await jogarContraBot();

    expect(socket.enviados.map(([evento]) => evento)).toEqual([
      'queue:join',
      'queue:leave',
      'room:create',
    ]);
  });

  it('avisa quando a partida contra o bot não pode ser criada', async () => {
    const { socket } = abrirLobby();
    await jogarContraBot();

    act(() => socket.receber('room:error', { reason: 'invalid_payload' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível começar a partida');
  });

  it('cria uma sala privada e abre a espera', async () => {
    const { socket } = abrirLobby();
    await userEvent.click(screen.getByRole('button', { name: 'Criar sala' }));
    expect(socket.enviados).toEqual([['room:create', { mode: 'online' }]]);

    act(() => socket.receber('room:created', { code: 'K7P2QX', playerToken: 'segredo' }));

    expect(screen.getByRole('heading', { name: 'Tela da partida' })).toBeInTheDocument();
    expect(sessionStorage.getItem(CHAVE_PARTIDA)).toContain('segredo');
  });

  it('só permite entrar com o código completo, em maiúsculas', async () => {
    abrirLobby();
    const campo = screen.getByLabelText('Código da sala');
    const entrar = screen.getByRole('button', { name: 'Entrar' });

    await userEvent.type(campo, 'k7p2q');
    expect(entrar).toBeDisabled();
    await userEvent.type(campo, 'x');

    expect(campo).toHaveValue('K7P2QX');
    expect(entrar).toBeEnabled();
  });

  it('descarta caracteres que não existem nos códigos', async () => {
    abrirLobby();
    const campo = screen.getByLabelText('Código da sala');

    await userEvent.type(campo, 'a0o1i-b');

    expect(campo).toHaveValue('AB');
  });

  it('entrar pelo código abre o endereço da sala', async () => {
    abrirLobby();

    await userEvent.type(screen.getByLabelText('Código da sala'), 'K7P2QX');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('heading', { name: 'Tela da partida' })).toBeInTheDocument();
  });
});
