// Messages between the host and client stations (over WebRTC data channels).
import type { Action } from './actions';
import type { GameState } from './state';

export type ClientToHost =
  /** A station action; `id` lets the client match the host's echo to its pending copy. */
  | { t: 'action'; id: string; action: Action }
  /** Ask for a full snapshot (after a sequence gap or on join). */
  | { t: 'resync' }
  | { t: 'hello'; name: string };

export type HostToClient =
  | { t: 'welcome'; peerId: string }
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
