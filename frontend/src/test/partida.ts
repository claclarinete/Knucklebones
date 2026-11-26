import type { GameStart, GameState } from '../types/jogo';

export function criarEstado(mudancas: Partial<GameState> = {}): GameState {
  const semPontos = { columns: [0, 0, 0] as [number, number, number], total: 0 };
  return {
    status: 'playing',
    boards: { p1: [[], [], []], p2: [[], [], []] },
    scores: { p1: semPontos, p2: semPontos },
    currentPlayer: 'p1',
    die: 4,
    ...mudancas,
  };
}

export function criarPartida(mudancas: Partial<GameStart> = {}): GameStart {
  return {
    code: 'K7P2QX',
    playerToken: 'segredo',
    you: 'p1',
    players: { p1: { nickname: 'Ana' }, p2: { nickname: 'Rival' } },
    state: criarEstado(),
    ...mudancas,
  };
}
