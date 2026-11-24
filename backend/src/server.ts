import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { parseEnv } from './config/env.js';

const env = parseEnv(process.env);

const app = createApp({ frontendUrl: env.FRONTEND_URL });
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.FRONTEND_URL },
});

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`);
  });
});

httpServer.listen(env.PORT, () => {
  console.log(`Backend rodando em http://localhost:${env.PORT}`);
});
