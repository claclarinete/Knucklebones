import { randomUUID } from 'node:crypto';
import {
  applyMove,
  chooseColumn,
  createGame,
  type Difficulty,
  type GameState,
  getResult,
  type MoveError,
  opponentOf,
  type PlayerId,
  type Rng,
} from '../game/index.js';
import { generateRoomCode } from './codes.js';
import type {
  GameErrorReason,
  GameOverPayload,
  GameOverReason,
  GameStartPayload,
  PlayerInfo,
  ServerToClientEvents,
} from './events.js';
import { resolveNickname } from './nickname.js';

/** Quem recebe os eventos do servidor. No Socket.IO, é um adaptador do socket. */
export interface Client {
  readonly id: string;
  emit<E extends keyof ServerToClientEvents>(
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void;
}

export interface GameManagerOptions {
  /** Gerador do dado, de quem começa e dos sorteios do bot. */
  rng?: Rng;
  /** Espera do bot antes de jogar. */
  botDelayMs: number;
  /** Tempo que uma partida terminada fica guardada. */
  finishedRoomTtlMs?: number;
  /** Tempo que uma sala privada espera o convidado. */
  waitingRoomTtlMs?: number;
  /** Tempo que a partida fica pausada esperando quem caiu voltar. */
  reconnectTimeoutMs?: number;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const PLAYER_IDS: readonly PlayerId[] = ['p1', 'p2'];

interface Seat {
  info: PlayerInfo;
  /** `null` no assento do bot. */
  token: string | null;
  /** Conexão atual; `null` no bot ou enquanto o jogador está desconectado. */
  client: Client | null;
  /** Prazo para voltar, enquanto o jogador está desconectado durante a partida. */
  reconnect?: { deadline: number; timer: NodeJS.Timeout };
}

interface Room {
  code: string;
  difficulty?: Difficulty;
  /** O p2 fica vazio enquanto a sala privada espera o convidado. */
  seats: { p1: Seat; p2?: Seat };
  /** `null` enquanto a partida não começou. */
  state: GameState | null;
  /** Expiração da sala em espera, jogada do bot ou remoção da partida terminada. */
  timer?: NodeJS.Timeout;
  /** Resultado da partida terminada, reenviado a quem retoma. */
  result?: GameOverPayload;
}

type StartedRoom = Room & { seats: Record<PlayerId, Seat>; state: GameState };

function hasStarted(room: Room): room is StartedRoom {
  return room.state !== null;
}

function toGameError(reason: MoveError): GameErrorReason {
  return reason === 'invalid_column' ? 'invalid_payload' : reason;
}

/**
 * Partidas em memória: cria, recebe as jogadas, aciona o bot e avisa os jogadores.
 * Não conhece o Socket.IO; recebe os pedidos já validados.
 */
export class GameManager {
  private readonly rng: Rng;
  private readonly botDelayMs: number;
  private readonly finishedRoomTtlMs: number;
  private readonly waitingRoomTtlMs: number;
  private readonly reconnectTimeoutMs: number;
  private readonly rooms = new Map<string, Room>();
  /** Sala de cada cliente conectado que ocupa um assento. */
  private readonly roomOfClient = new Map<string, string>();
  /** Fila online, em ordem de chegada. */
  private readonly queue: { client: Client; nickname?: string }[] = [];

  constructor(options: GameManagerOptions) {
    this.rng = options.rng ?? Math.random;
    this.botDelayMs = options.botDelayMs;
    this.finishedRoomTtlMs = options.finishedRoomTtlMs ?? FIVE_MINUTES;
    this.waitingRoomTtlMs = options.waitingRoomTtlMs ?? TEN_MINUTES;
    this.reconnectTimeoutMs = options.reconnectTimeoutMs ?? ONE_MINUTE;
  }

  createBotRoom(client: Client, difficulty: Difficulty, nickname?: string) {
    this.leave(client);
    const room = this.addRoom({
      difficulty,
      seats: {
        p1: this.humanSeat(client, nickname),
        p2: { info: { nickname: 'Bot', bot: difficulty }, token: null, client: null },
      },
    });
    this.startGame(room);
  }

  /** Entra na fila: pareia com quem chegou primeiro ou espera o próximo. */
  joinQueue(client: Client, nickname?: string) {
    this.leave(client);
    const opponent = this.queue.shift();
    if (!opponent) {
      this.queue.push({ client, nickname });
      return client.emit('queue:waiting');
    }

    const room = this.addRoom({
      seats: {
        p1: this.humanSeat(opponent.client, opponent.nickname),
        p2: this.humanSeat(client, nickname),
      },
    });
    this.startGame(room);
  }

  leaveQueue(client: Client) {
    const index = this.queue.findIndex((entry) => entry.client.id === client.id);
    if (index >= 0) this.queue.splice(index, 1);
  }

  /** Cria uma sala privada e espera o convidado entrar pelo código. */
  createPrivateRoom(client: Client, nickname?: string) {
    this.leave(client);
    const host = this.humanSeat(client, nickname);
    const room = this.addRoom({ seats: { p1: host } });
    this.schedule(room, this.waitingRoomTtlMs, () => {
      room.seats.p1.client?.emit('room:error', { reason: 'not_found' });
      this.removeRoom(room);
    });
    client.emit('room:created', { code: room.code, playerToken: host.token! });
  }

  /** Entra numa sala privada pelo código e começa a partida. */
  joinRoom(client: Client, code: string, nickname?: string) {
    const room = this.rooms.get(code);
    if (!room) return client.emit('room:error', { reason: 'not_found' });
    if (room.seats.p2 || room.seats.p1.client?.id === client.id) {
      return client.emit('room:error', { reason: 'full' });
    }

    this.leave(client);
    room.seats.p2 = this.humanSeat(client, nickname);
    this.roomOfClient.set(client.id, room.code);
    this.startGame(room);
  }

  /** O criador desiste da sala que ainda espera o convidado. */
  cancelRoom(client: Client) {
    const found = this.seatOf(client);
    if (found?.player === 'p1' && !hasStarted(found.room)) this.removeRoom(found.room);
  }

  move(client: Client, column: number) {
    const found = this.seatOf(client);
    if (!found || !hasStarted(found.room)) {
      return client.emit('game:error', { reason: 'game_not_active' });
    }

    const result = applyMove(found.room.state, found.player, column, this.rng);
    if (!result.ok) return client.emit('game:error', { reason: toGameError(result.reason) });
    this.updateState(found.room, result.state);
  }

  /** Desiste da partida em andamento: o adversário vence. */
  forfeit(client: Client) {
    const found = this.seatOf(client);
    if (!found || !hasStarted(found.room) || found.room.state.status === 'finished') {
      return client.emit('game:error', { reason: 'game_not_active' });
    }
    this.finish(found.room, opponentOf(found.player), 'forfeit');
  }

  /**
   * A conexão caiu. Durante a partida, ela fica pausada esperando a volta; depois
   * do fim, o adversário é avisado de que o jogador saiu.
   */
  disconnect(client: Client) {
    this.leaveQueue(client);
    const found = this.seatOf(client);
    if (!found) return;

    const { room, player } = found;
    if (!hasStarted(room)) return this.detachSeat(room, player);
    if (room.state.status === 'finished') return this.leaveFinished(room, player);
    this.pause(room, player);
  }

  /**
   * Retoma o assento pelo token recebido em game:start ou room:created, depois de
   * uma queda ou recarga da página. Também serve para outra aba assumir o assento.
   */
  rejoin(client: Client, code: string, token: string) {
    const room = this.rooms.get(code);
    const player = PLAYER_IDS.find((id) => room?.seats[id]?.token === token);
    if (!room || !player) return client.emit('room:error', { reason: 'invalid_token' });

    if (this.roomOfClient.get(client.id) !== code) this.leave(client);
    const seat = room.seats[player]!;
    const wasDisconnected = seat.client === null;
    if (seat.client) this.roomOfClient.delete(seat.client.id);
    seat.client = client;
    this.roomOfClient.set(client.id, code);
    this.clearReconnect(seat);

    // Na sala em espera, o criador só volta a aguardar o convidado.
    if (!hasStarted(room)) return;
    if (room.state.status === 'finished') {
      client.emit('game:start', this.startPayload(room, player, token));
      return client.emit('game:over', room.result!);
    }

    const opponent = room.seats[opponentOf(player)];
    const opponentAway = opponent.token !== null && opponent.client === null;
    if (wasDisconnected && !opponentAway) room.state = { ...room.state, status: 'playing' };

    client.emit('game:start', this.startPayload(room, player, token));
    if (opponentAway) {
      client.emit('opponent:disconnected', { timeoutSeconds: this.secondsLeft(opponent) });
    } else if (wasDisconnected) {
      opponent.client?.emit('opponent:reconnected');
      opponent.client?.emit('game:state', { state: room.state });
      this.scheduleBotIfNeeded(room);
    }
  }

  /** Cancela todos os temporizadores, para encerrar o servidor. */
  close() {
    for (const room of this.rooms.values()) this.removeRoom(room);
  }

  private humanSeat(client: Client, nickname?: string): Seat {
    return { info: { nickname: resolveNickname(nickname) }, token: randomUUID(), client };
  }

  private addRoom(room: Omit<Room, 'code' | 'state'>): Room {
    const code = generateRoomCode((candidate) => this.rooms.has(candidate));
    const created: Room = { ...room, code, state: null };
    this.rooms.set(code, created);
    for (const seat of this.seatsOf(created)) {
      if (seat.client) this.roomOfClient.set(seat.client.id, code);
    }
    return created;
  }

  private removeRoom(room: Room) {
    clearTimeout(room.timer);
    for (const seat of this.seatsOf(room)) {
      this.clearReconnect(seat);
      if (seat.client) this.roomOfClient.delete(seat.client.id);
    }
    this.rooms.delete(room.code);
  }

  private clearReconnect(seat: Seat) {
    clearTimeout(seat.reconnect?.timer);
    seat.reconnect = undefined;
  }

  private secondsLeft(seat: Seat): number {
    return Math.max(0, Math.ceil(((seat.reconnect?.deadline ?? 0) - Date.now()) / 1000));
  }

  /** Solta o assento do cliente, sem avisar ninguém. */
  private detachSeat(room: Room, player: PlayerId) {
    const seat = room.seats[player]!;
    if (seat.client) this.roomOfClient.delete(seat.client.id);
    seat.client = null;
  }

  /** Saída depois do fim: avisa o adversário e descarta a sala vazia. */
  private leaveFinished(room: StartedRoom, player: PlayerId) {
    this.detachSeat(room, player);
    const opponent = room.seats[opponentOf(player)];
    if (!opponent.client) return this.removeRoom(room);
    opponent.client.emit('opponent:left');
  }

  /** Pausa a partida por causa da queda de `player` e começa a contar o prazo de volta. */
  private pause(room: StartedRoom, player: PlayerId) {
    this.detachSeat(room, player);
    const seat = room.seats[player];
    const timer = setTimeout(() => this.reconnectExpired(room, player), this.reconnectTimeoutMs);
    timer.unref?.();
    seat.reconnect = { deadline: Date.now() + this.reconnectTimeoutMs, timer };

    if (room.state.status === 'playing') {
      clearTimeout(room.timer);
      room.state = { ...room.state, status: 'paused' };
      this.broadcast(room, 'game:state', { state: room.state });
    }
    room.seats[opponentOf(player)].client?.emit('opponent:disconnected', {
      timeoutSeconds: this.secondsLeft(seat),
    });
  }

  /** Quem caiu não voltou a tempo: quem ficou vence; sem ninguém, ou contra o bot, a partida é descartada. */
  private reconnectExpired(room: StartedRoom, player: PlayerId) {
    room.seats[player].reconnect = undefined;
    const opponent = room.seats[opponentOf(player)];
    if (room.difficulty || !opponent.client) return this.removeRoom(room);
    this.finish(room, opponentOf(player), 'disconnect');
  }

  /** Encerra a partida antes do fim natural (desistência ou abandono). */
  private finish(room: StartedRoom, winner: PlayerId, reason: GameOverReason) {
    for (const seat of this.seatsOf(room)) this.clearReconnect(seat);
    room.state = { ...room.state, status: 'finished', die: null };
    this.broadcast(room, 'game:state', { state: room.state });
    this.endGame(room, { winner, scores: room.state.scores, reason });
  }

  private endGame(room: StartedRoom, result: GameOverPayload) {
    room.result = result;
    this.broadcast(room, 'game:over', result);
    this.schedule(room, this.finishedRoomTtlMs, () => this.removeRoom(room));
  }

  private seatsOf(room: Room): Seat[] {
    return room.seats.p2 ? [room.seats.p1, room.seats.p2] : [room.seats.p1];
  }

  /**
   * Sai da fila e da partida atual antes de começar outra. Sair de uma partida
   * online em andamento conta como desistência.
   */
  private leave(client: Client) {
    this.leaveQueue(client);
    const found = this.seatOf(client);
    if (!found) return;

    const { room, player } = found;
    if (room.difficulty || !hasStarted(room)) return this.removeRoom(room);
    if (room.state.status !== 'finished') this.finish(room, opponentOf(player), 'forfeit');
    this.leaveFinished(room, player);
  }

  private seatOf(client: Client): { room: Room; player: PlayerId } | undefined {
    const code = this.roomOfClient.get(client.id);
    const room = code === undefined ? undefined : this.rooms.get(code);
    const player = PLAYER_IDS.find((id) => room?.seats[id]?.client?.id === client.id);
    return room && player ? { room, player } : undefined;
  }

  private startPayload(room: StartedRoom, player: PlayerId, token: string): GameStartPayload {
    return {
      code: room.code,
      playerToken: token,
      you: player,
      players: { p1: room.seats.p1.info, p2: room.seats.p2.info },
      state: room.state,
    };
  }

  /** Começa (ou recomeça) a partida. Só é chamada com os dois assentos ocupados. */
  private startGame(room: Room) {
    clearTimeout(room.timer);
    room.state = createGame(this.rng);
    const started = room as StartedRoom;

    for (const player of PLAYER_IDS) {
      const { client, token } = started.seats[player];
      if (client && token) client.emit('game:start', this.startPayload(started, player, token));
    }
    // O criador da sala pode ter caído enquanto esperava: a partida já começa pausada.
    for (const player of PLAYER_IDS) {
      const seat = started.seats[player];
      if (seat.token && !seat.client) this.pause(started, player);
    }
    this.scheduleBotIfNeeded(started);
  }

  private broadcast<E extends keyof ServerToClientEvents>(
    room: Room,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ) {
    for (const seat of this.seatsOf(room)) seat.client?.emit(event, ...args);
  }

  private schedule(room: Room, delayMs: number, task: () => void) {
    clearTimeout(room.timer);
    room.timer = setTimeout(task, delayMs);
    room.timer.unref?.();
  }

  private updateState(room: StartedRoom, state: GameState) {
    room.state = state;
    this.broadcast(room, 'game:state', { state });

    const winner = getResult(state);
    if (winner === null) return this.scheduleBotIfNeeded(room);
    this.endGame(room, { winner, scores: state.scores, reason: 'finished' });
  }

  private scheduleBotIfNeeded(room: StartedRoom) {
    const { difficulty, state } = room;
    if (!difficulty || state.status !== 'playing' || room.seats[state.currentPlayer].token) return;

    this.schedule(room, this.botDelayMs, () => {
      const bot = room.state.currentPlayer;
      const column = chooseColumn(room.state, difficulty, this.rng);
      const result = applyMove(room.state, bot, column, this.rng);
      if (result.ok) this.updateState(room, result.state);
    });
  }
}
