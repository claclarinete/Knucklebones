import { defineConfig, devices } from '@playwright/test';

// Portas próprias, para não colidir com o backend e o frontend abertos em `npm run dev`.
const BACKEND_URL = 'http://localhost:3100';
const FRONTEND_URL = 'http://localhost:5180';
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  // O backend guarda a fila e as salas em memória e usa um único gerador com semente:
  // os testes rodam um de cada vez para não disputarem a fila nem os sorteios.
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'backend',
      command: 'npx tsx src/server.ts',
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      env: {
        NODE_ENV: 'test',
        PORT: '3100',
        FRONTEND_URL,
        // Dado, quem começa e sorteios do bot previsíveis.
        DICE_SEED: '42',
        // Com espera zero, a primeira jogada do bot chega antes de a tela da partida
        // começar a escutar o servidor e se perde. 300 ms é rápido e cobre essa troca de tela.
        BOT_DELAY_MS: '300',
      },
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      name: 'frontend',
      command: 'npx vite --port 5180 --strictPort',
      cwd: '../frontend',
      url: FRONTEND_URL,
      env: {
        VITE_API_URL: BACKEND_URL,
        VITE_SOCKET_URL: BACKEND_URL,
      },
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
