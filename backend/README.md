# Backend

Servidor HTTP e Socket.IO, regras do jogo, bot, salas e fila do Knucklebones Online. A especificação completa está em [../docs/README.md](../docs/README.md).

## Pré-requisitos

- Node.js 22 ou superior

## Configuração

```bash
npm install
cp .env.example .env   # depois edite os valores
```

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão `3000`) |
| `FRONTEND_URL` | Endereço do frontend, liberado no CORS |

As variáveis são validadas com Zod na inicialização ([src/config/env.ts](src/config/env.ts)). Se alguma estiver faltando ou for inválida, o servidor não sobe e mostra qual é o problema.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor em modo de desenvolvimento, reiniciando a cada alteração |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run typecheck` | Verifica os tipos sem gerar arquivos |
| `npm test` | Roda os testes de unidade e integração |
| `npm run test:coverage` | Roda os testes com cobertura (mínimo de 80%) |

## Estrutura

```
src/
├── game/       # regras do jogo e bot (código puro, sem I/O)
├── rooms/      # salas, fila e eventos do socket
├── config/     # leitura e validação das variáveis de ambiente
├── app.ts      # configura o Express (CORS e /health)
└── server.ts   # inicia o servidor HTTP e o Socket.IO
tests/          # testes de integração
```

Testes de unidade ficam ao lado do código (`arquivo.test.ts`). Testes de integração ficam em `tests/`.

## Estado

Não há banco de dados: fila, salas e partidas ficam em memória. Os eventos estão em [../docs/contrato-socket.md](../docs/contrato-socket.md).
