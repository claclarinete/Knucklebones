// Apoio aos testes de unidade das salas. Não entra no build nem na cobertura.
import type { Die } from '../game/index.js';
import type { ServerToClientEvents } from './events.js';
import type { Client } from './manager.js';

type EventName = keyof ServerToClientEvents;
type Payload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0];

/** Cliente que guarda os eventos recebidos, para conferir nos testes. */
export class FakeClient implements Client {
  readonly received: { event: EventName; payload: unknown }[] = [];

  constructor(readonly id: string) {}

  emit<E extends EventName>(event: E, ...args: Parameters<ServerToClientEvents[E]>) {
    this.received.push({ event, payload: args[0] });
  }

  /** Dados de todos os eventos com esse nome, em ordem. */
  all<E extends EventName>(event: E): Payload<E>[] {
    return this.received.filter((entry) => entry.event === event).map((entry) => entry.payload as Payload<E>);
  }

  /** Dados do último evento com esse nome. */
  last<E extends EventName>(event: E): Payload<E> | undefined {
    return this.all(event).at(-1);
  }

  /** Nomes dos eventos recebidos, em ordem. */
  names(): EventName[] {
    return this.received.map((entry) => entry.event);
  }

  clear() {
    this.received.length = 0;
  }
}

/** Valor do gerador que faz o dado tirar `die`. */
export const forDie = (die: Die) => (die - 0.5) / 6;
/** Valor do gerador para o sorteio de quem começa. */
export const P1_STARTS = 0.1;
export const P2_STARTS = 0.9;

/** Gerador que devolve os valores informados, em ordem e em ciclo. */
export function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length]!;
}
