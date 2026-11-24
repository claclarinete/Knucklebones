# Backend

API REST, servidor Socket.IO, regras do jogo e bot do Knucklebones Online. A especificação completa está em [../docs/README.md](../docs/README.md).

## Pré-requisitos

- Node.js 22 ou superior
- PostgreSQL (local ou Neon), necessário para rodar o servidor. Os testes usam PGlite e não precisam de banco.

## Configuração

```bash
npm install
cp .env.example .env   # depois edite os valores
npm run db:migrate     # cria as tabelas no banco da DATABASE_URL
```

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão `3000`) |
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `JWT_SECRET` | Segredo dos tokens JWT, com pelo menos 32 caracteres |
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
| `npm run db:generate` | Gera uma migração a partir de [src/db/schema.ts](src/db/schema.ts) |
| `npm run db:migrate` | Aplica as migrações pendentes no banco |

## Estrutura

```
src/
├── game/       # regras do jogo e bot (código puro, sem I/O)
├── auth/       # cadastro, login, middleware de token
├── matches/    # histórico e estatísticas
├── rooms/      # salas e eventos do socket
├── db/         # schema (Drizzle) e conexão com o banco
├── config/     # leitura e validação das variáveis de ambiente
├── app.ts      # configura o Express (rotas, CORS, JSON)
└── server.ts   # inicia o servidor HTTP e o Socket.IO
tests/          # testes de integração (API e banco)
drizzle/        # migrações SQL geradas pelo drizzle-kit
```

Testes de unidade ficam ao lado do código (`arquivo.test.ts`). Testes de integração ficam em `tests/`.

## Banco de dados

O schema segue o modelo de dados da especificação: tabelas `users` e `matches`. Ao alterar [src/db/schema.ts](src/db/schema.ts), rode `npm run db:generate` e faça commit da migração criada em `drizzle/`. Os testes aplicam as mesmas migrações num PGlite em memória.
