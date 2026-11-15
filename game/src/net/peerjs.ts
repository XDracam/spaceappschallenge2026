// Room-code transport (D-027): the host opens a room under a short code such as
// "K7Q-4XM"; players type the code and connect. A public PeerJS server
// (0.peerjs.com) only brokers connection setup; game messages travel over a direct
// WebRTC data channel, or through PeerJS's public TURN relay when a network blocks
// direct connections (PeerJS default ICE config: Google STUN + turn.peerjs.com).
//
// Same wire format as the manual-code transport (net/webrtc.ts): JSON text per
// message, `{ "~": "c", … }` chunks for long messages, `{ "~": "bye" }` on purpose-leave.
// The manual codes stay available as a fallback when the PeerJS server is unreachable.
import { Peer, type DataConnection, type PeerError } from 'peerjs';
import type { ClientToHost, ClientTransport, HostToClient, HostTransport } from '../core/protocol';

/** Namespaces our room ids on the shared public PeerJS server. */
const ID_PREFIX = 'nasa-mission-control-26-';
/** No I, L, O, 0, 1: nothing to confuse when reading a code aloud. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;
const CONNECT_TIMEOUT_MS = 30000;
const SERVER_TIMEOUT_MS = 12000;
const RECLAIM_TRIES = 4;
const RECLAIM_DELAY_MS = 2500;
const CHUNK_THRESHOLD = 20000;
const CHUNK_SIZE = 16000;

// ------------------------------------------------------------------ helpers

type Listener<A extends unknown[]> = (...args: A) => void;
function listeners<A extends unknown[]>() {
  const set = new Set<Listener<A>>();
  return {
    add(cb: Listener<A>) { set.add(cb); return () => { set.delete(cb); }; },
    emit(...args: A) { for (const cb of [...set]) { try { cb(...args); } catch (e) { console.error('[room]', e); } } },
    get size() { return set.size; },
  };
}

function randomCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(CODE_LEN));
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
}

function randomPeerId(): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return 'r-' + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 8);
}

/** "K7Q4XM" → "K7Q-4XM" (for display). */
export function formatRoomCode(code: string): string {
  return code.length === CODE_LEN ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** Normalise typed input; returns null when it is not a room code. */
export function parseRoomCode(raw: string): string | null {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length !== CODE_LEN) return null;
  for (const ch of s) if (!ALPHABET.includes(ch)) return null;
  return s;
}

/** Link that opens the join screen with the code filled in. */
export function roomLink(code: string): string {
  return `${location.origin}${location.pathname}#join=${formatRoomCode(code)}`;
}

function peerIdFor(code: string): string {
  return ID_PREFIX + code;
}

function errType(e: unknown): string {
  return (e as PeerError<string>)?.type ?? 'unknown';
}

const SERVER_ERRORS = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable']);

/** One data connection with our framing (chunking, bye) on top of PeerJS raw mode. */
class Link {
  isOpen = false;
  isClosed = false;
  readonly opened = listeners<[]>();
  readonly message = listeners<[unknown]>();
  readonly closed = listeners<[reason: 'bye' | 'lost']>();
  private chunks = new Map<string, string[]>();
  private chunkCounter = 0;
  private timer: ReturnType<typeof setTimeout>;

  constructor(readonly conn: DataConnection) {
    conn.on('open', () => {
      if (this.isClosed) return;
      clearTimeout(this.timer);
      this.isOpen = true;
      this.opened.emit();
    });
    conn.on('data', (d) => this.receive(d));
    conn.on('close', () => this.finish('lost'));
    conn.on('error', (e) => { console.warn('[room] connection error', e); this.finish('lost'); });
    conn.peerConnection?.addEventListener('connectionstatechange', () => {
      const st = conn.peerConnection?.connectionState;
      if (st === 'failed') this.finish('lost');
    });
    this.timer = setTimeout(() => { if (!this.isOpen) this.finish('lost'); }, CONNECT_TIMEOUT_MS);
  }

  send(msg: unknown): void {
    this.sendWire(JSON.stringify(msg));
  }

  sendWire(wire: string): void {
    if (!this.isOpen) return;
    try {
      if (wire.length <= CHUNK_THRESHOLD) {
        this.conn.send(wire);
        return;
      }
      const id = String(++this.chunkCounter);
      const n = Math.ceil(wire.length / CHUNK_SIZE);
      for (let i = 0; i < n; i++) {
        this.conn.send(JSON.stringify({ '~': 'c', id, i, n, d: wire.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) }));
      }
    } catch (e) {
      console.warn('[room] send failed', e);
    }
  }

  private receive(data: unknown): void {
    if (typeof data !== 'string') return;
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(data);
    } catch {
      return;
    }
    if (obj && obj['~'] === 'c') {
      const { id, i, n, d } = obj as { id: string; i: number; n: number; d: string };
      let parts = this.chunks.get(id);
      if (!parts) this.chunks.set(id, (parts = new Array<string>(n)));
      parts[i] = d;
      for (let k = 0; k < n; k++) if (parts[k] === undefined) return;
      this.chunks.delete(id);
      try {
        this.message.emit(JSON.parse(parts.join('')));
      } catch (e) {
        console.warn('[room] bad chunked message', e);
      }
      return;
    }
    if (obj && obj['~'] === 'bye') {
      this.finish('bye');
      return;
    }
    this.message.emit(obj);
  }

  /** Close on purpose; tells the other side first. */
  close(): void {
    if (this.isClosed) return;
    if (this.isOpen) {
      try { this.conn.send(JSON.stringify({ '~': 'bye' })); } catch { /* ignore */ }
    }
    this.finish('bye', true);
  }

  private finish(reason: 'bye' | 'lost', local = false): void {
    if (this.isClosed) return;
    this.isClosed = true;
    clearTimeout(this.timer);
    const wasOpen = this.isOpen;
    this.isOpen = false;
    setTimeout(() => { try { this.conn.close(); } catch { /* ignore */ } }, local ? 150 : 0);
    if (wasOpen || !local) this.closed.emit(reason);
  }
}

// ------------------------------------------------------------------ host

export type RoomStatus = 'opening' | 'open' | 'reconnecting' | 'error';

export interface RoomPlayer {
  peerId: string;
  status: 'connecting' | 'connected' | 'left';
}

/** Host side: a room under a short code; any number of players connect to it. */
export class RoomHost implements HostTransport {
  status: RoomStatus = 'opening';
  code = '';
  error = '';
  /** Fires on room status or player list changes (for the lobby UI). */
  readonly changed = listeners<[]>();
  private peer: Peer | null = null;
  private links = new Map<string, Link>();
  private playerList = new Map<string, RoomPlayer>();
  private readonly msg = listeners<[string, ClientToHost]>();
  private readonly join = listeners<[string]>();
  private readonly leave = listeners<[string]>();
  private closedForGood = false;
  private reclaimTries = 0;
  private serverTimer: ReturnType<typeof setTimeout> | undefined;
  private onPageHide = () => this.close();

  /** `preferredCode`: reopen under the same code (resumed game), if it is free. */
  constructor(preferredCode?: string | null) {
    addEventListener('pagehide', this.onPageHide);
    this.open(preferredCode && parseRoomCode(preferredCode) ? parseRoomCode(preferredCode)! : randomCode());
  }

  private open(code: string): void {
    if (this.closedForGood) return;
    this.code = code;
    this.setStatus('opening');
    const peer = new Peer(peerIdFor(code), { debug: 0 });
    this.peer = peer;
    clearTimeout(this.serverTimer);
    this.serverTimer = setTimeout(() => {
      if (this.peer === peer && this.status === 'opening') this.fail('The room-code service did not answer.');
    }, SERVER_TIMEOUT_MS);

    peer.on('open', () => {
      if (this.peer !== peer) return;
      clearTimeout(this.serverTimer);
      this.reclaimTries = 0;
      this.error = '';
      this.setStatus('open');
    });
    peer.on('connection', (conn) => {
      if (this.peer !== peer) { conn.close(); return; }
      this.accept(conn);
    });
    peer.on('disconnected', () => {
      // Lost the signalling server; open player connections keep running.
      if (this.peer !== peer || this.closedForGood) return;
      this.setStatus('reconnecting');
      setTimeout(() => {
        if (this.peer === peer && !peer.destroyed && peer.disconnected) {
          try { peer.reconnect(); } catch { /* ignore */ }
        }
      }, 2000);
    });
    peer.on('error', (e) => {
      if (this.peer !== peer) return;
      const type = errType(e);
      if (type === 'unavailable-id') {
        // Code in use: right after a reload the server may still hold our old id.
        peer.destroy();
        if (this.reclaimTries++ < RECLAIM_TRIES) setTimeout(() => this.peer === peer && this.open(code), RECLAIM_DELAY_MS);
        else { this.reclaimTries = 0; this.open(randomCode()); }
        return;
      }
      if (type === 'browser-incompatible') {
        this.fail('This browser cannot make direct connections. Please use a current Chrome, Edge, Firefox or Safari.');
        return;
      }
      if (SERVER_ERRORS.has(type) && this.status !== 'open') {
        if (this.status === 'opening') this.fail('Could not reach the room-code service.');
        return;
      }
      console.warn('[room] host peer error', type, e);
    });
  }

  private fail(message: string): void {
    this.error = message;
    this.setStatus('error');
  }

  /** Try opening the room again (after an error). */
  retry(): void {
    this.peer?.destroy();
    this.peer = null;
    this.reclaimTries = 0;
    this.open(this.code || randomCode());
  }

  private setStatus(s: RoomStatus): void {
    this.status = s;
    this.changed.emit();
  }

  private setPlayer(peerId: string, status: RoomPlayer['status']): void {
    this.playerList.set(peerId, { peerId, status });
    this.changed.emit();
  }

  private accept(conn: DataConnection): void {
    const peerId = randomPeerId();
    const link = new Link(conn);
    this.links.set(peerId, link);
    this.setPlayer(peerId, 'connecting');
    link.message.add((m) => this.msg.emit(peerId, m as ClientToHost));
    link.opened.add(() => {
      this.setPlayer(peerId, 'connected');
      this.join.emit(peerId);
    });
    link.closed.add(() => {
      this.links.delete(peerId);
      const was = this.playerList.get(peerId)?.status;
      if (was === 'connected') {
        this.setPlayer(peerId, 'left');
        this.leave.emit(peerId);
      } else {
        // Never got through: drop the row silently.
        this.playerList.delete(peerId);
        this.changed.emit();
      }
    });
  }

  players(): RoomPlayer[] {
    return [...this.playerList.values()];
  }

  /** Disconnect one player (or drop a "left" row). */
  kick(peerId: string): void {
    this.links.get(peerId)?.close();
    this.links.delete(peerId);
    this.playerList.delete(peerId);
    this.changed.emit();
  }

  broadcast(msg: HostToClient): void {
    const wire = JSON.stringify(msg);
    for (const link of this.links.values()) if (link.isOpen) link.sendWire(wire);
  }
  sendTo(peerId: string, msg: HostToClient): void {
    const link = this.links.get(peerId);
    if (link?.isOpen) link.send(msg);
  }
  onMessage(cb: (peerId: string, msg: ClientToHost) => void): () => void { return this.msg.add(cb); }
  onPeerJoin(cb: (peerId: string) => void): () => void { return this.join.add(cb); }
  onPeerLeave(cb: (peerId: string) => void): () => void { return this.leave.add(cb); }

  /** Stop hosting: tell every player, close the room. */
  close(): void {
    if (this.closedForGood) return;
    this.closedForGood = true;
    removeEventListener('pagehide', this.onPageHide);
    clearTimeout(this.serverTimer);
    for (const link of this.links.values()) link.close();
    this.links.clear();
    const peer = this.peer;
    this.peer = null;
    // Let the bye frames flush before tearing down the peer.
    setTimeout(() => { try { peer?.destroy(); } catch { /* ignore */ } }, 200);
    this.changed.emit();
  }
}

// ------------------------------------------------------------------ client

export type RoomClientStatus = 'creating' | 'connected' | 'failed' | 'closed';

/** Player side: connect to a room by code. Same surface as ClientNetwork. */
export class RoomClient implements ClientTransport {
  status: RoomClientStatus = 'creating';
  error = '';
  /** 'bye' = host closed the game on purpose; 'lost' = connection dropped. */
  closeReason: 'bye' | 'lost' | null = null;
  readonly changed = listeners<[]>();
  private peer: Peer;
  private link: Link | null = null;
  private readonly msg = listeners<[HostToClient]>();
  private readonly closeL = listeners<[]>();
  private early: HostToClient[] = [];
  private timer: ReturnType<typeof setTimeout>;
  private onPageHide = () => this.close();

  constructor(readonly code: string) {
    addEventListener('pagehide', this.onPageHide);
    const peer = new Peer({ debug: 0 });
    this.peer = peer;
    this.timer = setTimeout(() => {
      if (this.status === 'creating') this.fail('No connection after 30 seconds.');
    }, CONNECT_TIMEOUT_MS);
    peer.on('open', () => {
      if (this.status !== 'creating') return;
      const conn = peer.connect(peerIdFor(code), { serialization: 'raw', reliable: true });
      this.attach(new Link(conn));
    });
    peer.on('error', (e) => {
      const type = errType(e);
      if (this.status !== 'creating') return;
      if (type === 'peer-unavailable') {
        this.fail(`No open game with room code ${formatRoomCode(code)}. Check the code, and that the host is still on the lobby or in the game.`);
      } else if (type === 'browser-incompatible') {
        this.fail('This browser cannot make direct connections. Please use a current Chrome, Edge, Firefox or Safari.');
      } else if (SERVER_ERRORS.has(type)) {
        this.fail('Could not reach the room-code service.');
      } else {
        console.warn('[room] client peer error', type, e);
      }
    });
  }

  private attach(link: Link): void {
    this.link = link;
    link.message.add((m) => {
      if (this.msg.size === 0) this.early.push(m as HostToClient);
      else this.msg.emit(m as HostToClient);
    });
    link.opened.add(() => {
      clearTimeout(this.timer);
      this.setStatus('connected');
    });
    link.closed.add((reason) => {
      if (this.status === 'connected') {
        this.closeReason = reason;
        this.setStatus('closed');
        this.closeL.emit();
        this.peer.destroy();
      } else if (this.status === 'creating') {
        this.fail('Found the game, but could not connect to it.');
      }
    });
  }

  private fail(message: string): void {
    clearTimeout(this.timer);
    this.error = message;
    this.setStatus('failed');
    this.link?.close();
    this.peer.destroy();
  }

  private setStatus(s: RoomClientStatus): void {
    this.status = s;
    this.changed.emit();
  }

  send(msg: ClientToHost): void {
    this.link?.send(msg);
  }
  onMessage(cb: (msg: HostToClient) => void): () => void {
    const off = this.msg.add(cb);
    const early = this.early;
    this.early = [];
    for (const m of early) cb(m);
    return off;
  }
  onClose(cb: () => void): () => void { return this.closeL.add(cb); }

  /** Leave on purpose (tells the host). */
  close(): void {
    removeEventListener('pagehide', this.onPageHide);
    clearTimeout(this.timer);
    if (this.status === 'connected') this.closeReason = 'bye';
    if (this.status !== 'failed' && this.status !== 'closed') this.setStatus('closed');
    this.link?.close();
    const peer = this.peer;
    setTimeout(() => { try { peer.destroy(); } catch { /* ignore */ } }, 200);
  }
}

// ------------------------------------------------------------------ combine

/** One HostTransport over several (room code + manual codes). Peer ids are unique per transport. */
export function combineHosts(...parts: HostTransport[]): HostTransport {
  return {
    broadcast(msg) { for (const p of parts) p.broadcast(msg); },
    sendTo(peerId, msg) { for (const p of parts) p.sendTo(peerId, msg); },
    onMessage(cb) { for (const p of parts) p.onMessage(cb); },
    onPeerJoin(cb) { for (const p of parts) p.onPeerJoin(cb); },
    onPeerLeave(cb) { for (const p of parts) p.onPeerLeave(cb); },
  };
}
