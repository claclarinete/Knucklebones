import cors from 'cors';
import express from 'express';

export interface AppOptions {
  frontendUrl: string;
}

export function createApp({ frontendUrl }: AppOptions) {
  const app = express();

  app.use(cors({ origin: frontendUrl }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
