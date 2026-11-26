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

## Do cliente para o servidor

| Evento | Dados | Efeito |
|---|---|---|
| `queue:join` | `{ nickname?: string }` | Entra na fila |
| `queue:leave` | nenhum | Sai da fila |
| `room:create` | `{ mode: 'online', nickname? }` ou `{ mode: 'bot', difficulty, nickname? }` | Cria sala privada ou partida contra o bot |
| `room:join` | `{ code: string, nickname? }` | Entra numa sala |
| `room:cancel` | nenhum | O criador cancela a sala em espera |
| `game:move` | `{ column: Column }` | Joga o dado da vez |
| `game:forfeit` | nenhum | Desiste |
| `game:rejoin` | `{ code: string, playerToken: string }` | Retoma uma partida |
| `game:rematch` | nenhum | Pede ou aceita revanche |

## Do servidor para o cliente

| Evento | Dados | Quando |
|---|---|---|
| `queue:waiting` | nenhum | Entrou na fila |
| `room:created` | `{ code, playerToken }` | Sala privada criada |
| `room:error` | `{ reason }` | Falha ao entrar ou retomar |
| `game:start` | `{ code, playerToken, you: PlayerId, players: Record<PlayerId, PlayerInfo>, state }` | Partida começou ou foi retomada |
| `game:state` | `{ state }` | O estado mudou |
| `game:error` | `{ reason }` | Pedido recusado, só para quem enviou |
| `game:over` | `{ winner: PlayerId \| 'draw', scores, reason }` | Fim da partida |
| `game:rematch-requested` | nenhum | O adversário pediu revanche |
| `opponent:disconnected` | `{ timeoutSeconds: 60 }` | O adversário caiu |
| `opponent:reconnected` | nenhum | O adversário voltou |
| `opponent:left` | nenhum | O adversário saiu depois do fim |

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
- Na partida contra o bot, o jogador ocupa o `p1` e o bot o `p2`, com `nickname: 'Bot'`.
- Na fila, quem chegou primeiro ocupa o `p1`. Na sala privada, o criador é o `p1` e mantém o `playerToken` de `room:created`.
- A sala privada sem convidado expira em 10 minutos e o criador recebe `room:error` com `not_found`.
- Começar outra partida (`queue:join` ou `room:create`) no meio de uma partida online conta como desistência; o adversário recebe `game:over` com `forfeit` e depois `opponent:left`.

## Pausa, retomada e revanche

- Quando um jogador cai, a partida passa a `paused`: o adversário recebe `game:state` e `opponent:disconnected`. Jogadas recebem `game:error` com `game_not_active`.
- `game:rejoin` responde `game:start` com o estado atual. Se o adversário também estiver fora, vem em seguida `opponent:disconnected` com os segundos que restam a ele. O adversário presente recebe `opponent:reconnected` e o `game:state` retomado.
- `game:rejoin` de uma partida terminada responde `game:start` e repete o `game:over`. Na sala privada que ainda espera o convidado, não há resposta: o criador volta a aguardar.
- `game:rejoin` com sala inexistente ou token errado responde `room:error` com `invalid_token`. Outra aba com o mesmo token assume o assento.
- Sem volta em 60 segundos, quem ficou vence com `game:over` e `disconnect`. Se os dois saírem, ou contra o bot, a partida é descartada.
- A revanche chega como um novo `game:start`, na mesma sala, com os mesmos assentos e tokens. Contra o bot, começa no primeiro `game:rematch`. Se o adversário já saiu, quem pede recebe `opponent:left`.
