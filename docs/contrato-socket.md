# Contrato do Socket.IO

Acordo entre frontend e backend. Altere este arquivo no mesmo pull request que mudar um evento.

## Tipos

```ts
type PlayerId = 'p1' | 'p2';
type Difficulty = 'easy' | 'medium' | 'hard';
type Column = 0 | 1 | 2;
type Die = 1 | 2 | 3 | 4 | 5 | 6;
type Board = [Die[], Die[], Die[]]; // cada coluna tem de 0 a 3 dados, na ordem de colocação
type Score = { columns: [number, number, number]; total: number };

interface GameState {
  status: 'playing' | 'paused' | 'finished';
  boards: Record<PlayerId, Board>;
  scores: Record<PlayerId, Score>;
  currentPlayer: PlayerId;
  die: Die | null; // null quando a partida terminou
}

interface PlayerInfo {
  nickname: string;
  bot?: Difficulty; // presente apenas no assento do bot
}
```

## Cliente → Servidor

| Evento | Dados | Efeito |
|---|---|---|
| `queue:join` | `{ nickname?: string }` | Entra na fila |
| `queue:leave` | — | Sai da fila |
| `room:create` | `{ mode: 'online', nickname? }` ou `{ mode: 'bot', difficulty, nickname? }` | Cria sala privada ou partida contra o bot |
| `room:join` | `{ code: string, nickname? }` | Entra numa sala |
| `room:cancel` | — | O criador cancela a sala em espera |
| `game:move` | `{ column: Column }` | Joga o dado da vez |
| `game:forfeit` | — | Desiste |
| `game:rejoin` | `{ code: string, playerToken: string }` | Retoma uma partida |
| `game:rematch` | — | Pede ou aceita revanche |

## Servidor → Cliente

| Evento | Dados | Quando |
|---|---|---|
| `queue:waiting` | — | Entrou na fila |
| `room:created` | `{ code, playerToken }` | Sala privada criada |
| `room:error` | `{ reason }` | Falha ao entrar ou retomar |
| `game:start` | `{ code, playerToken, you: PlayerId, players: Record<PlayerId, PlayerInfo>, state }` | Partida começou ou foi retomada |
| `game:state` | `{ state }` | O estado mudou |
| `game:error` | `{ reason }` | Pedido recusado, só para quem enviou |
| `game:over` | `{ winner: PlayerId \| 'draw', scores, reason }` | Fim da partida |
| `game:rematch-requested` | — | O adversário pediu revanche |
| `opponent:disconnected` | `{ timeoutSeconds: 60 }` | O adversário caiu |
| `opponent:reconnected` | — | O adversário voltou |
| `opponent:left` | — | O adversário saiu depois do fim |

## Motivos

| Campo | Valores |
|---|---|
| `room:error.reason` | `not_found`, `full`, `invalid_token`, `invalid_payload` |
| `game:error.reason` | `not_your_turn`, `column_full`, `game_not_active`, `invalid_payload` |
| `game:over.reason` | `finished`, `forfeit`, `disconnect` |

## Regras

- `code` tem 6 caracteres, sem `0`, `O`, `1` e `I`. A entrada ignora maiúsculas e minúsculas.
- Partidas da fila e contra o bot também têm `code`, para a rota `/partida/:codigo` e a retomada.
- Todo dado recebido é validado com Zod. Erros em eventos `queue:*` e `room:*` respondem `room:error`; em eventos `game:*`, `game:error` (ou `room:error` no `game:rejoin`).
- O `playerToken` é enviado apenas ao próprio jogador.
