// Shell session: which lobby screen is open, the host's invites and the player's
// join progress. Wires the WebRTC transport (net/) to the replicated store (core/).
import { createStore, useStore } from '../core/createStore';
import { coreActions } from '../core/coreActions';
import type { StationId } from '../core/model';
import { STATIONS } from '../core/model';
import { clearSaved, loadSaved } from '../core/persist';
import { createGame } from '../core/state';
import { getState, setLocalStation, startClient, startHost, startSolo, syncStore } from '../core/store';
import { CodeError, ClientNetwork, HostNetwork, type ClientStatus, type InviteInfo } from '../net/webrtc';

export type Screen = 'start' | 'host' | 'join';

interface SessionState {
  screen: Screen;
  name: string;
  /** Host: invites in creation order. */
  invites: InviteInfo[];
  /** Host: names players sent in their hello. */
  peerNames: Record<string, string>;
  /** Player: join progress. */
  join: { status: ClientStatus | 'idle'; replyCode: string; error: string; hasSnapshot: boolean; closeReason: 'bye' | 'lost' | null };
  /** Host: the calendar was running when the saved game was resumed (paused until the host continues). */
  resumePaused: boolean;
}

const NAME_KEY = 'mission-control.name';
function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

const IDLE_JOIN: SessionState['join'] = { status: 'idle', replyCode: '', error: '', hasSnapshot: false, closeReason: null };

export const session = createStore<SessionState>({
  screen: 'start',
  name: loadName(),
  invites: [],
  peerNames: {},
  join: IDLE_JOIN,
  resumePaused: false,
});
export function useSession<S>(sel: (s: SessionState) => S): S {
  return useStore(session, sel);
}

let hostNet: HostNetwork | null = null;
let clientNet: ClientNetwork | null = null;

export function setName(name: string): void {
  session.update((s) => { s.name = name.slice(0, 24); });
  try {
    localStorage.setItem(NAME_KEY, name.slice(0, 24));
  } catch { /* ignore */ }
}
export function playerName(): string {
  return session.get().name.trim() || (syncStore.get().role === 'client' ? 'Player' : 'Host');
}
export function setScreen(screen: Screen): void {
  session.update((s) => { s.screen = screen; });
}

/** Tear down any network role and return to the start screen with a fresh local state. */
export function backToStart(): void {
  hostNet?.close();
  hostNet = null;
  clientNet?.close();
  clientNet = null;
  setLocalStation(null);
  startSolo(createGame(randomSeed()));
  session.update((s) => {
    s.screen = 'start';
    s.invites = [];
    s.peerNames = {};
    s.join = IDLE_JOIN;
    s.resumePaused = false;
  });
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

// ------------------------------------------------------------------ host

function beginHosting(): void {
  const net = new HostNetwork();
  hostNet = net;
  net.changed.add(() => {
    if (hostNet !== net) return;
    session.update((s) => { s.invites = net.invites(); });
  });
  net.onMessage((peerId, msg) => {
    if (msg.t === 'hello' && hostNet === net) {
      session.update((s) => { s.peerNames[peerId] = String(msg.name).slice(0, 24) || 'Player'; });
    }
  });
  startHost(net);
  session.update((s) => {
    s.screen = 'host';
    s.invites = [];
    s.peerNames = {};
  });
}

export function hostNewGame(): void {
  backToStart();
  clearSaved();
  startSolo(createGame(randomSeed()));
  beginHosting();
}

export function hasSavedGame(): { day: number; phase: string } | null {
  const s = loadSaved();
  return s ? { day: s.clock.day, phase: s.meta.phase } : null;
}

export function resumeHostedGame(): void {
  const saved = loadSaved();
  if (!saved) return;
  backToStart();
  startSolo(saved);
  beginHosting();
  // Players from the previous session reconnect with new codes (new peer ids).
  const stale = new Set(
    STATIONS.map((st) => saved.meta.seats[st].claimedBy).filter((id): id is string => !!id && id !== 'host'),
  );
  for (const id of stale) coreActions.releaseSeat(id);
  // Hold the calendar until the host is back at a station.
  if (saved.meta.phase === 'planning' && saved.clock.running) {
    coreActions.setRunning(false);
    session.update((s) => { s.resumePaused = true; });
  }
}

export async function createInvite(): Promise<void> {
  await hostNet?.createInvite();
}

/** Returns an error message for the UI, or null when the reply code was accepted. */
export async function acceptReply(peerId: string, code: string): Promise<string | null> {
  if (!hostNet) return 'You are not hosting a game.';
  try {
    await hostNet.acceptReply(peerId, code);
    return null;
  } catch (e) {
    return e instanceof CodeError ? e.message : 'Something went wrong with this code.';
  }
}

export function cancelInvite(peerId: string): void {
  hostNet?.cancelInvite(peerId);
}

/** Host: sit at a station (frees the host's previous seat). */
export function hostTakeSeat(st: StationId): void {
  coreActions.claimSeat(st, 'host', playerName());
}

/** Host: start (or continue) the mission and go to the host's station. */
export function hostEnterMission(): void {
  const s = getState();
  const mine = STATIONS.find((st) => s.meta.seats[st].claimedBy === 'host');
  if (!mine) return;
  if (s.meta.phase === 'lobby') coreActions.startGame();
  if (session.get().resumePaused) {
    coreActions.setRunning(true);
    session.update((x) => { x.resumePaused = false; });
  }
  setLocalStation(mine);
}

// ------------------------------------------------------------------ player

function setJoin(patch: Partial<SessionState['join']>): void {
  session.update((s) => { s.join = { ...s.join, ...patch }; });
}

export async function joinWithInvite(code: string): Promise<void> {
  clientNet?.close();
  clientNet = null;
  setJoin({ ...IDLE_JOIN, status: 'creating' });
  let net: ClientNetwork;
  try {
    net = await ClientNetwork.join(code);
  } catch (e) {
    setJoin({ status: 'idle', error: e instanceof CodeError ? e.message : 'This invite code could not be used.' });
    return;
  }
  clientNet = net;
  setJoin({ status: net.status, replyCode: net.replyCode });
  net.changed.add(() => {
    if (clientNet !== net) return;
    if (net.status === 'connected' && syncStore.get().role !== 'client') {
      startClient(net);
      net.onMessage((m) => {
        if (m.t === 'snapshot' && clientNet === net) setJoin({ hasSnapshot: true });
      });
      net.send({ t: 'hello', name: playerName() });
    }
    setJoin({ status: net.status, error: net.error, closeReason: net.closeReason });
  });
}

/** Player: cancel a join in progress (before connecting). */
export function cancelJoin(): void {
  clientNet?.close();
  clientNet = null;
  setJoin(IDLE_JOIN);
}

/** Player: sit at a station. */
export function playerTakeSeat(st: StationId): void {
  coreActions.claimSeat(st, syncStore.get().peerId, playerName());
}
