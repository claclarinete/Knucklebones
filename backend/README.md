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
| `BOT_DELAY_MS` | Espera do bot antes de jogar, em milissegundos (padrão `800`) |
| `DICE_SEED` | Semente fixa do dado, para testes E2E previsíveis. Ignorada em produção |

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

## Regras do jogo

As regras ficam em [src/game/](src/game/), como código puro e imutável, sem rede, socket ou temporizador. As outras partes do backend importam apenas de [src/game/index.ts](src/game/index.ts).

| Arquivo | Responsabilidade |
|---|---|
| [types.ts](src/game/types.ts) | Tipos do estado da partida, iguais aos de [../docs/contrato-socket.md](../docs/contrato-socket.md) |
| [dice.ts](src/game/dice.ts) | Dado de 6 faces e gerador com semente, para testes previsíveis |
| [board.ts](src/game/board.ts) | Tabuleiro de 3 colunas com 3 espaços, colocação e destruição de dados |
| [score.ts](src/game/score.ts) | Pontuação: `valor × quantidade²` por valor distinto, somada nas 3 colunas |
| [game.ts](src/game/game.ts) | `createGame` sorteia quem começa; `applyMove` valida e aplica uma jogada |
| [result.ts](src/game/result.ts) | Vencedor pelo maior total, ou empate |
| [bot.ts](src/game/bot.ts) | Escolha de coluna do bot nas três dificuldades |

`applyMove(state, player, column, rng)` nunca altera o estado recebido. Ela devolve `{ ok: true, state }` com o novo estado ou `{ ok: false, reason }` com o motivo da recusa: `game_not_active`, `not_your_turn`, `column_full` ou `invalid_column`. O último só acontece se uma coluna fora de 0 a 2 passar pela validação do socket, que a responde como `invalid_payload`.

Todas as funções que sorteiam recebem o gerador (`rng`) como parâmetro. Nos testes, use `createSeededRng(semente)` ou um gerador com valores fixos.

### Bot

| Dificuldade | Estratégia |
|---|---|
| Fácil | Coluna com espaço ao acaso |
| Médio | Coluna que mais soma pontos para ele mais os que tira do adversário; empates ao acaso |
| Difícil | Expectiminimax: considera as 3 jogadas seguintes e a média dos 6 valores do dado. Cada escolha leva poucos milissegundos |

## Salas e eventos

O código em [src/rooms/](src/rooms/) liga as regras ao Socket.IO.

| Arquivo | Responsabilidade |
|---|---|
| [events.ts](src/rooms/events.ts) | Tipos dos eventos, iguais aos de [../docs/contrato-socket.md](../docs/contrato-socket.md) |
| [schemas.ts](src/rooms/schemas.ts) | Validação Zod dos dados de cada evento do cliente |
| [nickname.ts](src/rooms/nickname.ts) | Apelido escolhido ou `Visitante-NNNN` |
| [codes.ts](src/rooms/codes.ts) | Código de sala com 6 caracteres, sem `0`, `O`, `1` e `I` |
| [game-server.ts](src/rooms/game-server.ts) | Tratamento dos eventos e estado das partidas em memória |

Hoje o servidor trata `room:create` com `mode: 'bot'` e `game:move`. Sala privada, fila, desistência, retomada e revanche chegam nas próximas histórias. Os testes de integração em [tests/](tests/) sobem o servidor numa porta livre e jogam com clientes Socket.IO reais.

## Estado

Não há banco de dados: fila, salas e partidas ficam em memória. Os eventos estão em [../docs/contrato-socket.md](../docs/contrato-socket.md).
