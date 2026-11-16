// Messages between the host and client stations (over WebRTC data channels).
import type { Action } from './actions';
import type { GameState } from './state';
import { record, text, validAction, validGameState } from './validation';

export type ClientToHost =
  /** A station action; `id` lets the client match the host's echo to its pending copy. */
  | { t: 'action'; id: string; action: Action }
  /** Ask for a full snapshot (after a sequence gap or on join). */
  | { t: 'resync' }
  | { t: 'hello'; name: string; compatibility?: string };

export type HostToClient =
  | { t: 'welcome'; peerId: string; compatibility: string }
  | { t: 'rejected'; id?: string; reason: string; fatal?: boolean }
  | { t: 'snapshot'; seq: number; state: GameState }
  /** An action the host applied; `origin`/`id` identify the sender's pending copy. */
  | { t: 'applied'; seq: number; action: Action; origin: string; id?: string };

/** Transport the host uses (implemented by the network layer). */
export interface HostTransport {
  broadcast(msg: HostToClient): void;
  sendTo(peerId: string, msg: HostToClient): void;
  onMessage(cb: (peerId: string, msg: ClientToHost) => void): void;
  onPeerJoin(cb: (peerId: string) => void): void;
  onPeerLeave(cb: (peerId: string) => void): void;
}

/** Transport a client uses (implemented by the network layer). */
export interface ClientTransport {
  send(msg: ClientToHost): void;
  onMessage(cb: (msg: HostToClient) => void): void;
  onClose(cb: () => void): void;
}

const token = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 160;
const sequence = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
export function validClientMessage(value: unknown): value is ClientToHost {
  if (!record(value)) return false;
  if (value.t === 'resync') return true;
  if (value.t === 'hello') return typeof value.name === 'string' && value.name.length <= 24
    && (value.compatibility === undefined || token(value.compatibility));
  return value.t === 'action' && token(value.id) && validAction(value.action);
}
export function validHostMessage(value: unknown): value is HostToClient {
  if (!record(value)) return false;
  if (value.t === 'welcome') return token(value.peerId) && token(value.compatibility);
  if (value.t === 'rejected') return text(value.reason) && (value.id === undefined || token(value.id))
    && (value.fatal === undefined || typeof value.fatal === 'boolean');
  if (value.t === 'snapshot') return sequence(value.seq) && validGameState(value.state);
  return value.t === 'applied' && sequence(value.seq) && validAction(value.action) && token(value.origin)
    && (value.id === undefined || token(value.id));
}
