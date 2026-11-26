import { randomUUID } from 'node:crypto';
import {
  applyMove,
  chooseColumn,
  createGame,
  type Difficulty,
  type GameState,
  getResult,
  type MoveError,
  type PlayerId,
  type Rng,
} from '../game/index.js';
import { generateRoomCode } from './codes.js';
import type {
  GameErrorReason,
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
}

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const PLAYER_IDS: readonly PlayerId[] = ['p1', 'p2'];

interface Seat {
  info: PlayerInfo;
  /** `null` no assento do bot. */
  token: string | null;
  /** Conexão atual; `null` no bot. */
  client: Client | null;
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
  private readonly rooms = new Map<string, Room>();
  /** Sala de cada cliente conectado que ocupa um assento. */
  private readonly roomOfClient = new Map<string, string>();

  constructor(options: GameManagerOptions) {
    this.rng = options.rng ?? Math.random;
    this.botDelayMs = options.botDelayMs;
    this.finishedRoomTtlMs = options.finishedRoomTtlMs ?? FIVE_MINUTES;
    this.waitingRoomTtlMs = options.waitingRoomTtlMs ?? TEN_MINUTES;
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

  disconnect(client: Client) {
    this.leave(client);
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
      if (seat.client) this.roomOfClient.delete(seat.client.id);
    }
    this.rooms.delete(room.code);
  }

  private seatsOf(room: Room): Seat[] {
    return room.seats.p2 ? [room.seats.p1, room.seats.p2] : [room.seats.p1];
  }

  /** Sai da partida atual, se houver, antes de começar outra. */
  private leave(client: Client) {
    const found = this.seatOf(client);
    if (found) this.removeRoom(found.room);
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

    this.broadcast(room, 'game:over', { winner, scores: state.scores, reason: 'finished' });
    this.schedule(room, this.finishedRoomTtlMs, () => this.removeRoom(room));
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
