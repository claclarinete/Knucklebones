import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Socket } from 'socket.io-client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SocketContext } from '../services/SocketContext';
import { criarEstado, criarPartida } from '../test/partida';
import { criarSocketFalso } from '../test/socketFalso';
import type { GameStart, GameState } from '../types/jogo';
import { MesaDeJogo } from './MesaDeJogo';

function abrirMesa(partida: GameStart = criarPartida()) {
  const socket = criarSocketFalso();
  render(
    <SocketContext value={socket as unknown as Socket}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MesaDeJogo partida={partida} />} />
        </Routes>
      </MemoryRouter>
    </SocketContext>,
  );
  return socket;
}

/** O navegador tira o foco do botão desabilitado; o jsdom precisa de ajuda. */
function perderFoco() {
  const outro = document.body.appendChild(document.createElement('button'));
  outro.focus();
  outro.remove();
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
    expect(screen.getByRole('rowheader', { name: 'Rival' })).toBeInTheDocument();
  });

  it('identifica o bot pelo nível', () => {
    abrirMesa(
      criarPartida({
        players: { p1: { nickname: 'Ana' }, p2: { nickname: 'Bot', bot: 'hard' } },
      }),
    );

    expect(screen.getByRole('rowheader', { name: 'Bot difícil' })).toBeInTheDocument();
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

  it('mostra os pontos por coluna e o total enviados pelo servidor', () => {
    const scores = {
      p1: { columns: [24, 2, 9] as [number, number, number], total: 35 },
      p2: { columns: [3, 17, 7] as [number, number, number], total: 27 },
    };
    abrirMesa(criarPartida({ state: criarEstado({ scores }) }));

    const meu = screen.getByRole('group', { name: 'Seu tabuleiro' });
    expect(within(meu).getByText('Pontos da coluna 1:').parentElement).toHaveTextContent('24');
    const placar = screen.getByRole('table', { name: 'Placar' });
    expect(within(placar).getByRole('row', { name: 'Ana 24 2 9 35' })).toBeInTheDocument();
    expect(within(placar).getByRole('row', { name: 'Rival 3 17 7 27' })).toBeInTheDocument();
  });

  it('atualiza o placar quando o servidor envia um novo estado', () => {
    const socket = abrirMesa();
    const scores = {
      p1: { columns: [4, 0, 0] as [number, number, number], total: 4 },
      p2: { columns: [0, 0, 0] as [number, number, number], total: 0 },
    };

    act(() => socket.receber('game:state', { state: criarEstado({ scores }) }));

    expect(screen.getByRole('row', { name: 'Ana 4 0 0 4' })).toBeInTheDocument();
  });

  it('destaca duplas e trios por texto, além da cor', () => {
    abrirMesa(
      criarPartida({
        state: criarEstado({
          die: 1,
          boards: { p1: [[6, 6], [2, 2, 2], [5]], p2: [[], [], []] },
        }),
      }),
    );

    expect(dadosDe('Seu tabuleiro')).toEqual([
      'Dado 6, dupla',
      'Dado 6, dupla',
      'Dado 2, trio',
      'Dado 2, trio',
      'Dado 2, trio',
      'Dado 5',
    ]);
  });

  const tabuleiros = {
    p1: [[], [1, 2, 3], []],
    p2: [[4, 4, 1], [4], [2]],
  } satisfies GameState['boards'];

  it('antecipa os dados do adversário que a jogada destruiria', () => {
    abrirMesa(criarPartida({ state: criarEstado({ die: 4, boards: tabuleiros }) }));

    // A coluna 2 está cheia para mim, então o 4 do adversário nela não corre risco.
    expect(dadosDe('Tabuleiro do adversário')).toEqual([
      'Dado 4, dupla, será destruído',
      'Dado 4, dupla, será destruído',
      'Dado 1',
      'Dado 4',
      'Dado 2',
    ]);
    expect(dadosDe('Seu tabuleiro').join()).not.toContain('destruído');
  });

  it('não antecipa destruição na vez do adversário', () => {
    abrirMesa(
      criarPartida({
        state: criarEstado({ die: 4, currentPlayer: 'p2', boards: tabuleiros }),
      }),
    );

    expect(dadosDe('Tabuleiro do adversário').join()).not.toContain('destruído');
  });

  it('joga usando apenas o teclado', async () => {
    const socket = abrirMesa();
    const teclado = userEvent.setup();

    await teclado.tab(); // Desistir
    await teclado.tab();
    expect(botao(1)).toHaveFocus();
    await teclado.tab();
    await teclado.keyboard('{Enter}');

    expect(socket.enviados).toEqual([['game:move', { column: 1 }]]);
  });

  it('devolve o foco à coluna jogada quando a vez volta', async () => {
    const socket = abrirMesa();
    await userEvent.click(botao(2));
    act(() => socket.receber('game:state', { state: criarEstado({ currentPlayer: 'p2' }) }));
    perderFoco();

    expect(document.body).toHaveFocus();

    act(() => socket.receber('game:state', { state: criarEstado() }));

    expect(botao(2)).toHaveFocus();
  });

  it('se a coluna jogada encheu, o foco vai para outra disponível', async () => {
    const socket = abrirMesa();
    await userEvent.click(botao(1));
    act(() => socket.receber('game:state', { state: criarEstado({ currentPlayer: 'p2' }) }));
    perderFoco();

    const boards: GameState['boards'] = { p1: [[1, 2, 3], [], []], p2: [[], [], []] };
    act(() => socket.receber('game:state', { state: criarEstado({ boards }) }));

    expect(botao(2)).toHaveFocus();
  });

  it('anuncia a mudança de turno com o valor do dado', () => {
    const socket = abrirMesa(criarPartida({ state: criarEstado({ currentPlayer: 'p2' }) }));

    act(() => socket.receber('game:state', { state: criarEstado({ die: 6 }) }));

    expect(screen.getByRole('status')).toHaveTextContent('Sua vez, o dado é 6');
  });
});
