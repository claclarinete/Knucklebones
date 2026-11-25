# Frontend

Interface do Knucklebones Online, em React + Vite. O frontend não contém regras do jogo: ele envia as ações do jogador e exibe o estado que recebe do backend. A especificação completa está em [../docs/README.md](../docs/README.md).

## Pré-requisitos

- Node.js 22 ou superior
- Backend rodando (veja [../backend/README.md](../backend/README.md))

## Configuração

```bash
npm install
cp .env.example .env   # ajuste se o backend não estiver em http://localhost:3000
```

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | Endereço do backend para o `/health` (padrão `http://localhost:3000`) |
| `VITE_SOCKET_URL` | Endereço do servidor Socket.IO (padrão `http://localhost:3000`) |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento em http://localhost:5173 |
| `npm run build` | Verifica os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve a versão de produção localmente |
| `npm run typecheck` | Verifica os tipos |
| `npm run lint` | Analisa o código com o oxlint |
| `npm test` | Roda os testes (Vitest + Testing Library) |
| `npm run test:coverage` | Roda os testes com cobertura (mínimo de 80%) |

## Rotas

| Rota | Página |
|---|---|
| `/` | Lobby |
| `/partida/:codigo` | Sala de espera e partida (também é o link de convite) |
| `/regras` | Regras |

## Estrutura

```
src/
├── pages/        # uma página por rota
├── components/   # Tabuleiro, Coluna, Dado, Placar
├── services/     # api.ts (/health) e socket.ts (Socket.IO)
├── hooks/        # useApelido, usePartida
├── config/       # leitura das variáveis de ambiente
├── test/         # configuração dos testes
├── App.tsx       # definição das rotas
└── main.tsx      # ponto de entrada
```

Os testes ficam ao lado do código (`arquivo.test.tsx`).

## Deploy

O `vercel.json` (Vercel) e o `public/_redirects` (Netlify) redirecionam todas as rotas para o `index.html`, para que links como `/partida/K7P2QX` funcionem ao abrir direto no navegador. Configure `VITE_API_URL` e `VITE_SOCKET_URL` no serviço de deploy apontando para o backend.
