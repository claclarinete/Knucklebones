import { expect, test } from './support/fixtures';
import { criarSala, separarPelaVez } from './support/partida';

test('quem abre o link de convite entra na sala e a partida começa', async ({ novoJogador }) => {
  const ana = await novoJogador('Ana');
  const bia = await novoJogador('Bia');

  const link = await criarSala(ana);
  await bia.goto(link);
  await separarPelaVez(ana, bia);

  await expect(bia).toHaveURL(link);
  await expect(bia.getByRole('rowheader', { name: 'Ana' })).toBeVisible();
});

test('sala inexistente mostra o aviso e volta para o lobby', async ({ page }) => {
  await page.goto('/partida/ZZZZZZ');
  await expect(page.getByRole('heading', { name: 'Sala não encontrada' })).toBeVisible();

  await page.getByRole('link', { name: 'Voltar para o lobby' }).click();

  await expect(page.getByRole('heading', { name: 'Olá, visitante!' })).toBeVisible();
});
