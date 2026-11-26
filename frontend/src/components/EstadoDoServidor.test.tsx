import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ESPERA_PARA_AVISAR,
  INTERVALO_DE_REPETICAO,
  PRAZO_DA_CONSULTA,
} from '../hooks/useServidor';
import { SocketContext } from '../services/SocketContext';
import { criarSocketFalso } from '../test/socketFalso';
import { EstadoDoServidor } from './EstadoDoServidor';

const consulta = vi.fn<typeof fetch>();
const saudavel = () => Promise.resolve(Response.json({ status: 'ok' }));
/** Um servidor que nunca responde, até a consulta ser cancelada. */
const adormecido = (_url: unknown, opcoes?: RequestInit) =>
  new Promise<Response>((_, rejeitar) => {
    opcoes?.signal?.addEventListener('abort', () => rejeitar(new Error('cancelada')));
  });

/** Simula a conexão do jogo, que falha ou abre quando alguém tenta conectar. */
function criarConexao(resultado: 'connect' | 'connect_error') {
  const socket = criarSocketFalso(false);
  socket.connect = vi.fn(() => queueMicrotask(() => socket.receber(resultado)));
  return socket;
}

async function abrir(socket = criarConexao('connect_error')) {
  render(
    <SocketContext value={socket as unknown as Socket}>
      <EstadoDoServidor />
    </SocketContext>,
  );
  await act(() => vi.advanceTimersByTimeAsync(0));
  return socket;
}
const passar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const aviso = () => screen.getByRole('status');
const repetir = () => screen.queryByRole('button', { name: 'Tentar de novo' });

describe('EstadoDoServidor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', consulta);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    consulta.mockReset();
  });

  it('não mostra nada quando o servidor responde', async () => {
    consulta.mockImplementation(saudavel);

    await abrir();
    await passar(ESPERA_PARA_AVISAR);

    expect(aviso()).toBeEmptyDOMElement();
    expect(repetir()).not.toBeInTheDocument();
  });

  it('avisa que o servidor está acordando quando a resposta demora', async () => {
    consulta.mockImplementation(adormecido);

    await abrir();
    expect(aviso()).toBeEmptyDOMElement();
    await passar(ESPERA_PARA_AVISAR);

    expect(aviso()).toHaveTextContent('O servidor está acordando');
  });

  it('desiste depois do prazo e oferece tentar de novo', async () => {
    consulta.mockImplementation(adormecido);

    await abrir();
    await passar(PRAZO_DA_CONSULTA);

    expect(aviso()).toHaveTextContent('Não foi possível falar com o servidor');
    expect(repetir()).toBeInTheDocument();
  });

  it.each([
    ['a conexão falha', () => Promise.reject(new TypeError('sem rede'))],
    ['o servidor responde com erro', () => Promise.resolve(new Response('', { status: 503 }))],
  ])('avisa quando %s', async (_caso, resposta) => {
    consulta.mockImplementation(resposta);

    await abrir();

    expect(aviso()).toHaveTextContent('Não foi possível falar com o servidor');
  });

  it('tentar de novo consulta outra vez e some com o aviso', async () => {
    consulta.mockRejectedValueOnce(new TypeError('sem rede')).mockImplementation(saudavel);
    await abrir();

    fireEvent.click(repetir()!);
    await passar(0);

    expect(consulta).toHaveBeenCalledTimes(2);
    expect(aviso()).toBeEmptyDOMElement();
    expect(repetir()).not.toBeInTheDocument();
  });

  it('tira o aviso sozinho quando o servidor volta', async () => {
    consulta.mockRejectedValue(new TypeError('sem rede'));
    await abrir();
    await passar(INTERVALO_DE_REPETICAO);
    expect(aviso()).toHaveTextContent('Não foi possível falar com o servidor');

    consulta.mockImplementation(saudavel);
    await passar(INTERVALO_DE_REPETICAO);

    expect(aviso()).toBeEmptyDOMElement();
    expect(repetir()).not.toBeInTheDocument();
  });

  it('para de consultar depois que o servidor responde', async () => {
    consulta.mockRejectedValueOnce(new TypeError('sem rede')).mockImplementation(saudavel);
    await abrir();
    await passar(INTERVALO_DE_REPETICAO);

    await passar(INTERVALO_DE_REPETICAO * 3);

    expect(consulta).toHaveBeenCalledTimes(2);
  });

  it('não avisa quando só o /health é bloqueado e a conexão do jogo abre', async () => {
    consulta.mockRejectedValue(new TypeError('bloqueado pelo navegador'));

    const socket = await abrir(criarConexao('connect'));

    expect(socket.connect).toHaveBeenCalledOnce();
    expect(aviso()).toBeEmptyDOMElement();
    expect(repetir()).not.toBeInTheDocument();
  });

  it('não abre a conexão do jogo quando o /health responde', async () => {
    consulta.mockImplementation(saudavel);

    const socket = await abrir();

    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('desiste quando nem o /health nem a conexão do jogo respondem', async () => {
    consulta.mockRejectedValue(new TypeError('sem rede'));
    const socket = criarSocketFalso(false);

    await abrir(socket);
    await passar(PRAZO_DA_CONSULTA);

    expect(aviso()).toHaveTextContent('Não foi possível falar com o servidor');
  });
});
