import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { describe, expect, it } from 'vitest';
import { SocketContext } from '../services/SocketContext';
import { criarEstado, criarPartida } from '../test/partida';
import { criarSocketFalso } from '../test/socketFalso';
import type { GameStart } from '../types/jogo';
import { MesaDeJogo } from './MesaDeJogo';

function abrirMesa(partida: GameStart = criarPartida()) {
  const socket = criarSocketFalso();
  render(
    <SocketContext value={socket as unknown as Socket}>
      <MesaDeJogo partida={partida} />
    </SocketContext>,
  );
  return socket;
}

const botao = (coluna: number) =>
  screen.getByRole('button', { name: `Jogar na coluna ${coluna}` });
const dadosDe = (tabuleiro: string) =>
  within(screen.getByRole('group', { name: tabuleiro }))
    .queryAllByRole('img')
    .map((dado) => dado.getAttribute('aria-label'));

describe('MesaDeJogo', () => {
  it('mostra os dois tabuleiros com os dados de cada jogador', () => {
    abrirMesa(
      criarPartida({
        you: 'p2',
        state: criarEstado({ boards: { p1: [[1], [], []], p2: [[], [6], []] } }),
      }),
    );

    expect(dadosDe('Seu tabuleiro')).toEqual(['Dado 6']);
    expect(dadosDe('Tabuleiro do adversário')).toEqual(['Dado 1']);
  });

  it('identifica os jogadores', () => {
    abrirMesa();

    expect(screen.getByText('Ana (você)')).toBeInTheDocument();
    expect(screen.getByText('Rival')).toBeInTheDocument();
  });

  it('identifica o bot pelo nível', () => {
    abrirMesa(
      criarPartida({
        players: { p1: { nickname: 'Ana' }, p2: { nickname: 'Bot', bot: 'hard' } },
      }),
    );

    expect(screen.getByText('Bot difícil')).toBeInTheDocument();
    expect(screen.getByText(/Contra o bot/)).toBeInTheDocument();
  });

  it.each([
    ['p1', 'Sua vez', 'Seu dado'],
    ['p2', 'Vez do adversário', 'Dado do adversário'],
  ] as const)('quando a vez é de %s mostra "%s" e "%s"', (currentPlayer, vez, dado) => {
    abrirMesa(criarPartida({ state: criarEstado({ currentPlayer }) }));

    expect(screen.getByRole('status')).toHaveTextContent(vez);
    expect(screen.getByRole('region', { name: dado })).toBeInTheDocument();
  });

  it('envia a coluna escolhida', async () => {
    const socket = abrirMesa();

    await userEvent.click(botao(2));

    expect(socket.enviados).toEqual([['game:move', { column: 1 }]]);
  });

  it('desabilita a coluna cheia e mantém as outras', () => {
    abrirMesa(
      criarPartida({
        state: criarEstado({ boards: { p1: [[1, 2, 3], [4], []], p2: [[], [], []] } }),
      }),
    );

    expect(botao(1)).toBeDisabled();
    expect(botao(2)).toBeEnabled();
    expect(botao(3)).toBeEnabled();
  });

  it.each([
    ['é a vez do adversário', { currentPlayer: 'p2' as const }],
    ['a partida está pausada', { status: 'paused' as const }],
    ['a partida acabou', { status: 'finished' as const, die: null }],
  ])('não envia nada quando %s', async (_caso, mudancas) => {
    const socket = abrirMesa(criarPartida({ state: criarEstado(mudancas) }));

    await userEvent.click(botao(1));

    expect(botao(1)).toBeDisabled();
    expect(socket.enviados).toEqual([]);
  });

  it('não envia uma segunda jogada antes da resposta do servidor', async () => {
    const socket = abrirMesa();

    await userEvent.click(botao(1));
    await userEvent.click(botao(2));

    expect(socket.enviados).toHaveLength(1);
  });

  it('atualiza a mesa com o estado enviado pelo servidor', () => {
    const socket = abrirMesa();

    act(() =>
      socket.receber('game:state', {
        state: criarEstado({
          boards: { p1: [[4], [], []], p2: [[], [], []] },
          currentPlayer: 'p2',
          die: 2,
        }),
      }),
    );

    expect(dadosDe('Seu tabuleiro')).toEqual(['Dado 4']);
    expect(screen.getByRole('status')).toHaveTextContent('Vez do adversário');
  });

  it('explica a recusa de uma jogada e permite tentar de novo', async () => {
    const socket = abrirMesa();
    await userEvent.click(botao(1));

    act(() => socket.receber('game:error', { reason: 'column_full' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Essa coluna está cheia');
    expect(botao(2)).toBeEnabled();
  });
});
