import { expect, test } from './support/fixtures';
import { comecarPartidaOnline, fimDeJogo, vez } from './support/partida';

test('quem desiste perde e o adversário vence', async ({ novoJogador }) => {
  const [ana, bia] = await comecarPartidaOnline(await novoJogador('Ana'), await novoJogador('Bia'));

  await ana.getByRole('button', { name: 'Desistir', exact: true }).click();
  await ana.getByRole('dialog', { name: 'Desistir?' }).getByRole('button', { name: 'Sim, desistir' }).click();

  await expect(fimDeJogo(ana)).toContainText('Você desistiu.');
  await expect(fimDeJogo(bia)).toContainText('O adversário desistiu.');
});

test('quem sai da partida deixa o adversário esperando com a contagem', async ({ novoJogador }) => {
  const [ana, bia] = await comecarPartidaOnline(await novoJogador('Ana'), await novoJogador('Bia'));

  await bia.getByRole('link', { name: 'Jogar', exact: true }).click();

  const aviso = ana.getByRole('dialog', { name: 'Adversário desconectado' });
  await expect(aviso).toContainText('perdeu a conexão. A partida está pausada.');
  await expect(aviso.getByRole('timer')).toHaveText(/^[01]:\d\d$/);
});

test('quem volta pelo histórico retoma a partida de onde parou', async ({ novoJogador }) => {
  const [ana, bia] = await comecarPartidaOnline(await novoJogador('Ana'), await novoJogador('Bia'));
  await ana.getByRole('button', { name: 'Jogar na coluna 1' }).click();
  await expect(vez(ana, 'Vez do adversário')).toBeVisible();
  await bia.getByRole('link', { name: 'Jogar', exact: true }).click();
  await expect(vez(ana, 'Partida pausada')).toBeVisible();

  await bia.goBack();

  await expect(vez(bia, 'Sua vez')).toBeVisible();
  await expect(vez(ana, 'Vez do adversário')).toBeVisible();
});
