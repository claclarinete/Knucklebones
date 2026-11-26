import { test as base, type BrowserContext, type Page } from '@playwright/test';

interface Fixtures {
  /** Abre o lobby num navegador novo, com o apelido preenchido. */
  novoJogador: (apelido: string) => Promise<Page>;
}

export const test = base.extend<Fixtures>({
  novoJogador: async ({ browser, baseURL }, use) => {
    // Cada jogador tem o próprio contexto, como dois navegadores separados.
    const contextos: BrowserContext[] = [];

    await use(async (apelido) => {
      const contexto = await browser.newContext({ baseURL });
      contextos.push(contexto);
      const pagina = await contexto.newPage();
      await pagina.goto('/');
      await pagina.getByLabel('Apelido (opcional)').fill(apelido);
      return pagina;
    });

    await Promise.all(contextos.map((contexto) => contexto.close()));
  },
});

export { expect } from '@playwright/test';
