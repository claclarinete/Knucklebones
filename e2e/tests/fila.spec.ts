import { expect, test } from './support/fixtures';
import { separarPelaVez } from './support/partida';

test('dois navegadores na fila online são colocados na mesma partida', async ({ novoJogador }) => {
  const ana = await novoJogador('Ana');
  const bia = await novoJogador('Bia');

  await ana.getByRole('button', { name: 'Entrar na fila' }).click();
  await expect(ana.getByRole('status').filter({ hasText: 'Aguardando adversário...' })).toBeVisible();
  await bia.getByRole('button', { name: 'Entrar na fila' }).click();
  await separarPelaVez(ana, bia);

  await expect(bia).toHaveURL(ana.url());
  await expect(ana.getByRole('rowheader', { name: 'Bia' })).toBeVisible();
  await expect(bia.getByRole('rowheader', { name: 'Ana' })).toBeVisible();
});
