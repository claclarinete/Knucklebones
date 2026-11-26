import { expect, test } from './support/fixtures';
import { fimDeJogo, jogarAteOFim } from './support/partida';

test('partida contra o bot vai até um dos tabuleiros encher', async ({ novoJogador }) => {
  const ana = await novoJogador('Ana');
  // O rádio fica oculto atrás do cartão da dificuldade; a pessoa clica no nome.
  await ana.getByText('Fácil', { exact: true }).click();
  await expect(ana.getByRole('radio', { name: 'Fácil' })).toBeChecked();
  await ana.getByRole('button', { name: 'Jogar contra o bot' }).click();
  await expect(ana.getByText(/^Contra o bot - Sala [A-Z2-9]{6}$/)).toBeVisible();

  await jogarAteOFim(ana);

  await expect(fimDeJogo(ana)).toContainText('Um dos tabuleiros ficou cheio.');
});
