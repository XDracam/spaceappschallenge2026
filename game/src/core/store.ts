// Replicated game store.
//  - solo / host: the authoritative state; actions apply immediately, then the host
//    broadcasts them with a sequence number.
//  - client: keeps the host-confirmed state plus its own pending actions. The view
//    shows confirmed + pending (optimistic); when the host's ordered echo arrives,
//    the pending copy is dropped and the view is rebuilt — so every station ends up
//    with exactly the host's state.
import type { Action } from './actions';
import { applyAction, setDispatchHook } from './actions';
import type { ClientTransport, HostToClient, HostTransport } from './protocol';
import type { StationId } from './model';
import { createGame, type GameState } from './state';
import { createStore, useStore } from './createStore';
import { MISSION, setActiveMission } from './mission';

export type Role = 'solo' | 'host' | 'client';

interface SyncState {
  role: Role;
  /** This browser's peer id ('host' for solo/host). */
  peerId: string;
  /** Station this browser is currently viewing/acting as (null = lobby / not seated). */
  station: StationId | null;
  connected: boolean;
}

/** What the UI renders: confirmed state (+ pending actions on clients). */
export const gameStore = createStore<GameState>(createGame(1));
/** Host-confirmed state, without optimistic client actions. */
export const confirmedGameStore = createStore<GameState>(gameStore.get());
export const syncStore = createStore<SyncState>({ role: 'solo', peerId: 'host', station: null, connected: true });

export function useGame<S>(selector: (s: GameState) => S): S {
  return useStore(gameStore, selector);
}
export function useConfirmedGame<S>(selector: (s: GameState) => S): S {
  return useStore(confirmedGameStore, selector);
}
export function useSync<S>(selector: (s: SyncState) => S): S {
  return useStore(syncStore, selector);
}

// ------------------------------------------------------- new attempts (local)

const resetListeners = new Set<(s: GameState) => void>();
/**
 * Local (never shared) notification that this browser now shows a different game
 * or a new attempt of it: core/restart, core/returnToLobby, core/setMission, or a
 * new/adopted game. Stations reset their UI-only stores here (selection, open
 * panels, dismissed cards). Called after the store holds the new state.
 */
export function onGameReset(cb: (s: GameState) => void): () => void {
  resetListeners.add(cb);
  return () => resetListeners.delete(cb);
}

const gameKey = (s: GameState) => `${s.meta.missionId}|${s.meta.seed}|${s.meta.attempt}`;
let lastKey = gameKey(gameStore.get());
let lastPhase = gameStore.get().meta.phase;
gameStore.subscribe(() => {
  const s = gameStore.get();
  // The live MISSION binding follows the shown game (core/setMission changes it by action).
  if (MISSION.id !== s.meta.missionId) setActiveMission(s.meta.missionId);
  const key = gameKey(s);
  const backToLobby = lastPhase !== 'lobby' && s.meta.phase === 'lobby';
  lastPhase = s.meta.phase;
  if (key === lastKey) return;
  lastKey = key;
  // core/returnToLobby: every browser at a station goes back to the lobby screen.
  if (backToLobby && syncStore.get().station) setLocalStation(null);
  for (const cb of resetListeners) cb(s);
});

let confirmed: GameState = gameStore.get();
let seq = 0;
let pending: { id: string; action: Action }[] = [];
let pendingCounter = 0;
let host: HostTransport | null = null;
let client: ClientTransport | null = null;

export interface ConfirmedActionEvent {
  previous: GameState;
  state: GameState;
  action: Action;
  local: boolean;
}
const confirmedActionListeners = new Set<(event: ConfirmedActionEvent) => void>();
/** Local feedback for actual host-accepted actions; never optimistic updates or snapshots. */
export function onConfirmedAction(cb: (event: ConfirmedActionEvent) => void): () => void {
  confirmedActionListeners.add(cb);
  return () => confirmedActionListeners.delete(cb);
}
function notifyConfirmed(previous: GameState, action: Action, local: boolean): void {
  for (const cb of confirmedActionListeners) cb({ previous, state: confirmed, action, local });
}

function by(): Action['by'] {
  return syncStore.get().station ?? 'host';
}

function rebuildView(): void {
  let view = confirmed;
  for (const p of pending) view = applyAction(view, p.action);
  gameStore.set(view);
}

/** Local dispatch used by every defineActions() dispatcher. */
function dispatch(type: string, args: unknown[]): void {
  const action: Action = { type, args: structuredClone(args), by: by() };
  const { role } = syncStore.get();
  if (role === 'client') {
    const id = `${syncStore.get().peerId}:${++pendingCounter}`;
    pending.push({ id, action });
    client?.send({ t: 'action', id, action });
    rebuildView();
    return;
  }
  applyAsHost(action, syncStore.get().peerId);
}

function applyAsHost(action: Action, origin: string, id?: string): void {
  const previous = confirmed;
  confirmed = applyAction(confirmed, action);
  confirmedGameStore.set(confirmed);
  seq++;
  gameStore.set(confirmed);
  host?.broadcast({ t: 'applied', seq, action, origin, ...(id ? { id } : {}) });
  notifyConfirmed(previous, action, origin === syncStore.get().peerId);
  for (const l of hostListeners) l(confirmed);
}

setDispatchHook(dispatch);

/** Listeners for the host's authoritative state (persistence). */
const hostListeners = new Set<(s: GameState) => void>();
export function onHostState(cb: (s: GameState) => void): () => void {
  hostListeners.add(cb);
  return () => hostListeners.delete(cb);
}

// ------------------------------------------------------------------ roles

/** Single browser, no network (also the host before anyone joins). */
export function startSolo(state: GameState): void {
  setActiveMission(state.meta.missionId);
  confirmed = state;
  confirmedGameStore.set(confirmed);
  seq = 0;
  pending = [];
  host = null;
  client = null;
  syncStore.set({ role: 'solo', peerId: 'host', station: syncStore.get().station, connected: true });
  gameStore.set(confirmed);
}

/** Become the host: keep the current state and serve it to joining stations. */
export function startHost(transport: HostTransport): void {
  host = transport;
  client = null;
  syncStore.update((s) => { s.role = 'host'; s.peerId = 'host'; s.connected = true; });
  transport.onPeerJoin((peerId) => {
    if (host !== transport) return;
    transport.sendTo(peerId, { t: 'welcome', peerId });
    transport.sendTo(peerId, { t: 'snapshot', seq, state: confirmed });
  });
  transport.onMessage((peerId, msg) => {
    if (host !== transport) return;
    if (msg.t === 'action') applyAsHost({ ...msg.action }, peerId, msg.id);
    else if (msg.t === 'resync') transport.sendTo(peerId, { t: 'snapshot', seq, state: confirmed });
  });
  // A player who leaves (tab closed, connection lost) frees their seat for others.
  transport.onPeerLeave((peerId) => {
    if (host !== transport) return;
    applyAsHost({ type: 'core/releaseSeat', args: [peerId], by: 'host' }, 'host');
  });
}

/** Become a client of a host (state arrives as a snapshot). */
export function startClient(transport: ClientTransport): void {
  client = transport;
  host = null;
  pending = [];
  syncStore.update((s) => { s.role = 'client'; s.connected = true; });
  transport.onMessage((msg: HostToClient) => {
    if (client !== transport) return;
    if (msg.t === 'welcome') {
      syncStore.update((s) => { s.peerId = msg.peerId; });
    } else if (msg.t === 'snapshot') {
      setActiveMission(msg.state.meta.missionId);
      confirmed = msg.state;
      confirmedGameStore.set(confirmed);
      seq = msg.seq;
      // Pending actions the host never saw are dropped on resync.
      pending = [];
      rebuildView();
    } else if (msg.t === 'applied') {
      if (msg.seq !== seq + 1) {
        transport.send({ t: 'resync' });
        return;
      }
      seq = msg.seq;
      const previous = confirmed;
      confirmed = applyAction(confirmed, msg.action);
      confirmedGameStore.set(confirmed);
      if (msg.origin === syncStore.get().peerId && msg.id) pending = pending.filter((p) => p.id !== msg.id);
      rebuildView();
      notifyConfirmed(previous, msg.action, msg.origin === syncStore.get().peerId);
    }
  });
  transport.onClose(() => {
    if (client === transport) syncStore.update((s) => { s.connected = false; });
  });
}

/** Which station this browser views (UI only; seats are claimed via core actions). */
export function setLocalStation(station: StationId | null): void {
  syncStore.update((s) => { s.station = station; });
}

/** Read the current view state outside components. */
export function getState(): GameState {
  return gameStore.get();
}
