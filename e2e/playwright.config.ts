import { defineConfig, devices } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run build && npm start',
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      env: { NODE_ENV: 'test', PORT: '3000', FRONTEND_URL },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run build && npm run preview -- --port 5173 --strictPort',
      cwd: '../frontend',
      url: FRONTEND_URL,
      env: { VITE_API_URL: BACKEND_URL, VITE_SOCKET_URL: BACKEND_URL },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
