import { expect, type Page } from '@playwright/test';

/** Dados destruídos alongam a partida; o limite só evita um laço infinito se algo travar. */
const LIMITE_DE_JOGADAS = 50;

export const vez = (pagina: Page, texto: 'Sua vez' | 'Vez do adversário' | 'Partida pausada') =>
  pagina.getByRole('status').filter({ hasText: texto });

export const fimDeJogo = (pagina: Page) => pagina.getByRole('dialog', { name: 'Fim de jogo' });

/** Espera a mesa da partida aparecer, na vez de qualquer um dos jogadores. */
export async function esperarMesa(pagina: Page) {
  await expect(vez(pagina, 'Sua vez').or(vez(pagina, 'Vez do adversário'))).toBeVisible();
}

/** Devolve primeiro quem está na vez e depois quem espera. */
export async function separarPelaVez(a: Page, b: Page): Promise<[Page, Page]> {
  await Promise.all([esperarMesa(a), esperarMesa(b)]);
  return (await vez(a, 'Sua vez').isVisible()) ? [a, b] : [b, a];
}

/** Joga na primeira coluna livre a cada vez, até a janela de fim de jogo abrir. */
export async function jogarAteOFim(pagina: Page) {
  const fim = fimDeJogo(pagina);
  // A mesa bloqueia as colunas fora da vez e enquanto espera a resposta do servidor.
  const colunaLivre = pagina.getByRole('button', { name: /^Jogar na coluna/, disabled: false }).first();

  for (let jogada = 0; jogada < LIMITE_DE_JOGADAS; jogada++) {
    await expect(fim.or(colunaLivre)).toBeVisible();
    if (await fim.isVisible()) return;
    await colunaLivre.click();
  }
  throw new Error(`A partida não acabou depois de ${LIMITE_DE_JOGADAS} jogadas.`);
}

/** Cria uma sala privada com o primeiro jogador e devolve o link de convite. */
export async function criarSala(dono: Page) {
  await dono.getByRole('button', { name: 'Criar sala' }).click();
  await expect(dono.getByRole('heading', { name: 'Sala criada' })).toBeVisible();
  return dono.getByLabel('Link de convite').inputValue();
}

/** Coloca os dois jogadores numa partida online pela sala privada. */
export async function comecarPartidaOnline(dono: Page, convidado: Page) {
  const link = await criarSala(dono);
  await convidado.goto(link);
  return separarPelaVez(dono, convidado);
}
