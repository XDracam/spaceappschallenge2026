// Shell session: which lobby screen is open, the host's room and invites, and the
// player's join progress. Wires the network layer (net/) to the replicated store (core/).
// Two ways in (D-027): a short room code (net/peerjs.ts, the default) and the
// copy-paste invite/reply codes (net/webrtc.ts, fallback when the room service fails).
import { createStore, useStore } from '../core/createStore';
import { coreActions } from '../core/coreActions';
import { computeMissionResult, missionScore } from '../stations/planner/result';
import type { StationId } from '../core/model';
import { STATIONS } from '../core/model';
import { DEFAULT_MISSION_ID, missionById } from '../core/mission';
import { clearSaved, loadSaved } from '../core/persist';
import { createGame } from '../core/state';
import { getState, setLocalStation, startClient, startHost, startSolo, syncStore } from '../core/store';
import type { ClientTransport, HostToClient } from '../core/protocol';
import { CodeError, ClientNetwork, HostNetwork, type InviteInfo } from '../net/webrtc';
import {
  RoomClient, RoomHost, combineHosts, formatRoomCode, parseRoomCode,
  type RoomPlayer, type RoomStatus,
} from '../net/peerjs';

export type Screen = 'start' | 'host' | 'join';
export type JoinStatus = 'idle' | 'creating' | 'waiting' | 'connected' | 'failed' | 'closed';

interface SessionState {
  screen: Screen;
  name: string;
  /** Host: the room players join by code. */
  room: { status: RoomStatus | 'off'; code: string; error: string };
  /** Host: players who came in through the room code. */
  roomPlayers: RoomPlayer[];
  /** Host: manual invites in creation order. */
  invites: InviteInfo[];
  /** Host: names players sent in their hello. */
  peerNames: Record<string, string>;
  /** Player: join progress. `mode` says which way in; `roomCode` is kept for rejoining. */
  join: {
    mode: 'room' | 'code';
    status: JoinStatus;
    roomCode: string;
    replyCode: string;
    error: string;
    hasSnapshot: boolean;
    closeReason: 'bye' | 'lost' | null;
  };
  /** Player: code to pre-fill (from a #join= link). */
  joinPrefill: string;
  /** Host: the calendar was running when the saved game was resumed (paused until the host continues). */
  resumePaused: boolean;
}

const NAME_KEY = 'mission-control.name';
const ROOM_KEY = 'mission-control.room';

function loadKey(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}
function saveKey(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

const IDLE_JOIN: SessionState['join'] = {
  mode: 'room', status: 'idle', roomCode: '', replyCode: '', error: '', hasSnapshot: false, closeReason: null,
};
const ROOM_OFF: SessionState['room'] = { status: 'off', code: '', error: '' };

/** A "#join=K7Q-4XM" link opens the join screen with the code filled in. */
function prefillFromUrl(): string {
  const m = /^#join=([A-Za-z0-9-]{4,16})$/.exec(location.hash);
  if (!m) return '';
  history.replaceState(null, '', location.pathname + location.search);
  return parseRoomCode(m[1]) ? formatRoomCode(parseRoomCode(m[1])!) : '';
}
const urlPrefill = prefillFromUrl();

export const session = createStore<SessionState>({
  screen: urlPrefill ? 'join' : 'start',
  name: loadKey(NAME_KEY),
  room: ROOM_OFF,
  roomPlayers: [],
  invites: [],
  peerNames: {},
  join: IDLE_JOIN,
  joinPrefill: urlPrefill,
  resumePaused: false,
});
// A #join= link opened in a tab that already runs the game only changes the hash.
addEventListener('hashchange', () => {
  const code = prefillFromUrl();
  if (!code || syncStore.get().role !== 'solo') return;
  session.update((s) => {
    s.screen = 'join';
    s.joinPrefill = code;
    s.join = IDLE_JOIN;
  });
});

export function useSession<S>(sel: (s: SessionState) => S): S {
  return useStore(session, sel);
}

/** Host: players connected through either way in. */
export function connectedPlayerCount(s: SessionState): number {
  return s.roomPlayers.filter((p) => p.status === 'connected').length + s.invites.filter((i) => i.status === 'connected').length;
}

let hostNet: HostNetwork | null = null;
let roomHost: RoomHost | null = null;
let clientNet: ClientNetwork | RoomClient | null = null;

export function setName(name: string): void {
  session.update((s) => { s.name = name.slice(0, 24); });
  saveKey(NAME_KEY, name.slice(0, 24));
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
  roomHost?.close();
  roomHost = null;
  clientNet?.close();
  clientNet = null;
  setLocalStation(null);
  startSolo(createGame(randomSeed()));
  session.update((s) => {
    s.screen = 'start';
    s.room = ROOM_OFF;
    s.roomPlayers = [];
    s.invites = [];
    s.peerNames = {};
    s.join = IDLE_JOIN;
    s.joinPrefill = '';
    s.resumePaused = false;
  });
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

// ------------------------------------------------------------------ host

/** `roomCode`: reopen the room under this code if it is free (resumed game). */
function beginHosting(roomCode: string | null): void {
  const manual = new HostNetwork();
  const room = new RoomHost(roomCode);
  hostNet = manual;
  roomHost = room;
  manual.changed.add(() => {
    if (hostNet !== manual) return;
    session.update((s) => { s.invites = manual.invites(); });
  });
  room.changed.add(() => {
    if (roomHost !== room) return;
    if (room.status === 'open') saveKey(ROOM_KEY, room.code);
    session.update((s) => {
      s.room = { status: room.status, code: room.code, error: room.error };
      s.roomPlayers = room.players();
    });
  });
  const net = combineHosts(manual, room);
  net.onMessage((peerId, msg) => {
    if (msg.t === 'hello' && hostNet === manual) {
      session.update((s) => { s.peerNames[peerId] = String(msg.name).slice(0, 24) || 'Player'; });
    }
  });
  startHost(net);
  session.update((s) => {
    s.screen = 'host';
    s.room = { status: room.status, code: room.code, error: '' };
    s.roomPlayers = [];
    s.invites = [];
    s.peerNames = {};
  });
}

/** Host a new game of the chosen mission (core/mission.ts MISSIONS; default: the first). */
export function hostNewGame(missionId: string = DEFAULT_MISSION_ID): void {
  backToStart();
  clearSaved();
  startSolo(createGame(randomSeed(), missionId));
  beginHosting(null);
}

export function hasSavedGame(): { day: number; phase: string; missionName: string } | null {
  const s = loadSaved();
  return s ? { day: s.clock.day, phase: s.meta.phase, missionName: missionById(s.meta.missionId).name } : null;
}

export function resumeHostedGame(): void {
  const saved = loadSaved();
  if (!saved) return;
  backToStart();
  startSolo(saved);
  // Same room code as last time, so players can rejoin with the code they have.
  beginHosting(loadKey(ROOM_KEY) || null);
  // Players from the previous session reconnect (new peer ids).
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

export function retryRoom(): void {
  roomHost?.retry();
}

/** Disconnect a room player, or remove their "left" row. */
export function kickRoomPlayer(peerId: string): void {
  roomHost?.kick(peerId);
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
    return e instanceof CodeError ? e.message : 'The reply could not be connected. Copy the entire reply code from the player and try again. If it still fails, remove this invite and make a new one.';
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

/** Is this input a long manual invite code rather than a room code? */
export function isManualCode(input: string): boolean {
  return /^\s*["'`]?MC1R?-/i.test(input);
}

/** Player: join with whatever was typed — a room code or a manual invite code. */
export async function joinGame(input: string): Promise<void> {
  if (isManualCode(input)) return joinWithInvite(input);
  const code = parseRoomCode(input);
  if (!code) {
    setJoin({ ...IDLE_JOIN, error: 'Room codes have 6 letters and digits, like K7Q-4XM.' });
    return;
  }
  joinWithRoom(code);
}

/** Wire a connected transport into the store once, and track its status. */
function follow(net: ClientNetwork | RoomClient): void {
  net.changed.add(() => {
    if (clientNet !== net) return;
    if (net.status === 'connected' && syncStore.get().role !== 'client') {
      startClient(net as ClientTransport);
      net.onMessage((m: HostToClient) => {
        if (m.t === 'snapshot' && clientNet === net) setJoin({ hasSnapshot: true });
      });
      net.send({ t: 'hello', name: playerName() });
    }
    setJoin({ status: net.status, error: net.error, closeReason: net.closeReason });
  });
}

function joinWithRoom(code: string): void {
  clientNet?.close();
  // A rejoin after the host left: start from a fresh local game, not the stale client view.
  if (syncStore.get().role === 'client') {
    setLocalStation(null);
    startSolo(createGame(randomSeed()));
  }
  const net = new RoomClient(code);
  clientNet = net;
  setJoin({ ...IDLE_JOIN, mode: 'room', status: 'creating', roomCode: code });
  follow(net);
}

async function joinWithInvite(code: string): Promise<void> {
  clientNet?.close();
  clientNet = null;
  setJoin({ ...IDLE_JOIN, mode: 'code', status: 'creating' });
  let net: ClientNetwork;
  try {
    net = await ClientNetwork.join(code);
  } catch (e) {
    setJoin({ status: 'idle', error: e instanceof CodeError ? e.message : 'The invite could not be opened. Paste the entire MC1- invite code from the host and try again. If it still fails, ask the host to make a new invite.' });
    return;
  }
  clientNet = net;
  setJoin({ status: net.status, replyCode: net.replyCode });
  follow(net);
}

/** Player: after the host left, try the same room code again. */
export function rejoinRoom(): void {
  const code = session.get().join.roomCode;
  if (!code) return;
  session.update((s) => { s.screen = 'join'; });
  joinWithRoom(code);
}

/** Player: cancel a join in progress (before connecting). */
export function cancelJoin(): void {
  const keep = session.get().join;
  clientNet?.close();
  clientNet = null;
  setJoin({ ...IDLE_JOIN, mode: keep.mode });
}

/** Player: sit at a station. */
export function playerTakeSeat(st: StationId): void {
  coreActions.claimSeat(st, syncStore.get().peerId, playerName());
}

/** Recovery stays inside the hosted session: transports, invitations and seats survive. */
export function hostRecoverMission(destination: 'retry' | 'choose'): void {
  if (syncStore.get().role === 'client') return;
  const s = getState();
  if (s.meta.phase !== 'launched' && s.meta.phase !== 'finished') return;
  const outcome = missionScore(computeMissionResult(s));
  session.update((x) => { x.resumePaused = false; });
  if (destination === 'retry') coreActions.restart(outcome);
  else coreActions.returnToLobby(outcome);
}

export function hostChooseMission(missionId: string): void {
  if (syncStore.get().role === 'client') return;
  coreActions.setMission(missionId);
}
