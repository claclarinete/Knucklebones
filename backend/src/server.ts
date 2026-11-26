import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { diceSeedOf, parseEnv } from './config/env.js';
import { createSeededRng } from './game/index.js';
import { attachGameServer, type GameIo } from './rooms/game-server.js';

const env = parseEnv(process.env);
const diceSeed = diceSeedOf(env);

const app = createApp({ frontendUrl: env.FRONTEND_URL });
const httpServer = createServer(app);

const io: GameIo = new Server(httpServer, {
  cors: { origin: env.FRONTEND_URL },
});

attachGameServer(io, {
  rng: diceSeed === undefined ? Math.random : createSeededRng(diceSeed),
  botDelayMs: env.BOT_DELAY_MS,
});

httpServer.listen(env.PORT, () => {
  console.log(`Backend rodando em http://localhost:${env.PORT}`);
  if (diceSeed !== undefined) console.log(`Dado com semente fixa: ${diceSeed}`);
});
