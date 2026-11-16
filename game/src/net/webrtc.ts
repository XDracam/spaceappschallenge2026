// WebRTC transport (D-015): one RTCPeerConnection + one ordered, reliable data
// channel per joining player. Signalling is manual: the host makes an invite code
// (its SDP offer), the player pastes it and returns a reply code (SDP answer).
// Non-trickle ICE: each code carries the complete SDP after candidate gathering.
//
// Wire format: JSON text per data-channel message. Protocol messages (core/protocol.ts)
// always have `t`; transport-level frames use `~`:
//   { "~": "c", id, i, n, d }  one chunk of a message longer than CHUNK_THRESHOLD chars
//   { "~": "bye" }             the other side is leaving on purpose (tab closed, left)
import type { ClientToHost, ClientTransport, HostToClient, HostTransport } from '../core/protocol';
import { COMPATIBILITY_ID } from '../core/build';
import { FrameReceiver, frames } from './framing';
import { CodeError, decodeCode, encodeCode } from './codes';

export const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const ICE_GATHER_TIMEOUT_MS = 5000;
const CONNECT_TIMEOUT_MS = 30000;
/** Data channels reliably carry ~64 KB per message; JSON chars ≤ 3 UTF-8 bytes each. */

type Listener<A extends unknown[]> = (...args: A) => void;
function listeners<A extends unknown[]>() {
  const set = new Set<Listener<A>>();
  return {
    add(cb: Listener<A>) { set.add(cb); return () => { set.delete(cb); }; },
    emit(...args: A) { for (const cb of [...set]) { try { cb(...args); } catch (e) { console.error('[net]', e); } } },
    get size() { return set.size; },
  };
}

function randomId(prefix: string): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return prefix + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 8);
}

/** Resolve once ICE gathering is complete (or after a timeout, with what we have). */
function gatherIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => { if (pc.iceGatheringState === 'complete') done(); };
    const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener('icegatheringstatechange', check);
  });
}

// ------------------------------------------------------------------ one link

/** A peer connection with its data channel, chunking and close detection. */
class PeerLink {
  readonly pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  private dc: RTCDataChannel | null = null;
  private receiver = new FrameReceiver(value => this.message.emit(value), () => this.finish('bye'));
  private chunkCounter = 0;
  isOpen = false;
  isClosed = false;
  readonly opened = listeners<[]>();
  readonly message = listeners<[unknown]>();
  readonly closed = listeners<[reason: 'bye' | 'lost']>();

  constructor() {
    this.pc.addEventListener('connectionstatechange', () => {
      const st = this.pc.connectionState;
      if (st === 'failed' || st === 'closed') this.finish('lost');
    });
  }

  attach(dc: RTCDataChannel): void {
    this.dc = dc;
    dc.addEventListener('open', () => {
      if (this.isClosed) return;
      this.isOpen = true;
      this.opened.emit();
    });
    dc.addEventListener('message', (e) => this.receive(e.data));
    dc.addEventListener('close', () => this.finish('lost'));
    dc.addEventListener('error', () => this.finish('lost'));
  }

  send(msg: unknown): void {
    this.sendWire(JSON.stringify(msg));
  }

  /** Send an already-serialised message (broadcast encodes once). */
  sendWire(wire: string): void {
    const dc = this.dc;
    if (!dc || dc.readyState !== 'open') return;
    try {
      for (const frame of frames(wire, String(++this.chunkCounter))) dc.send(frame);
    } catch (e) {
      console.warn('[net] send failed', e);
      this.finish('lost');
    }
  }

  private receive(data: unknown): void {
    if (!this.receiver.receive(data)) this.finish('lost');
  }

  /** Close on purpose; tells the other side first if the channel is open. */
  close(): void {
    if (this.isClosed) return;
    if (this.dc?.readyState === 'open') {
      try { this.dc.send(JSON.stringify({ '~': 'bye' })); } catch { /* ignore */ }
    }
    this.finish('bye', true);
  }

  private finish(reason: 'bye' | 'lost', local = false): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.receiver.clear();
    const wasOpen = this.isOpen;
    this.isOpen = false;
    // Let the bye frame flush before tearing down.
    setTimeout(() => {
      try { this.dc?.close(); } catch { /* ignore */ }
      try { this.pc.close(); } catch { /* ignore */ }
    }, local ? 100 : 0);
    if (wasOpen || !local) this.closed.emit(reason);
  }
}

// ------------------------------------------------------------------ host

export type InviteStatus = 'creating' | 'waiting' | 'connecting' | 'connected' | 'failed' | 'left';

export interface InviteInfo {
  peerId: string;
  /** Invite code to give to the player ('' while it is being created). */
  code: string;
  status: InviteStatus;
  error?: string;
}

/** Host side: many players, one link each. Implements core's HostTransport. */
export class HostNetwork implements HostTransport {
  private links = new Map<string, PeerLink>();
  private infos = new Map<string, InviteInfo>();
  private readonly msg = listeners<[string, ClientToHost]>();
  private readonly join = listeners<[string]>();
  private readonly leave = listeners<[string]>();
  /** Fires whenever an invite's status changes (for the lobby UI). */
  readonly changed = listeners<[]>();
  private onPageHide = () => this.close();

  constructor() {
    addEventListener('pagehide', this.onPageHide);
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

  invites(): InviteInfo[] {
    return [...this.infos.values()];
  }
  connectedPeers(): string[] {
    return [...this.links.entries()].filter(([, l]) => l.isOpen).map(([id]) => id);
  }

  private set(peerId: string, patch: Partial<InviteInfo>): void {
    const cur = this.infos.get(peerId);
    if (!cur) return;
    this.infos.set(peerId, { ...cur, ...patch });
    this.changed.emit();
  }

  /** Make a new invite code for one player. */
  async createInvite(): Promise<InviteInfo> {
    const peerId = randomId('p-');
    const link = new PeerLink();
    this.links.set(peerId, link);
    this.infos.set(peerId, { peerId, code: '', status: 'creating' });
    this.changed.emit();

    link.attach(link.pc.createDataChannel('game', { ordered: true }));
    link.message.add((m) => this.msg.emit(peerId, m as ClientToHost));
    link.opened.add(() => {
      this.set(peerId, { status: 'connected', error: undefined });
      this.join.emit(peerId);
    });
    link.closed.add(() => {
      const info = this.infos.get(peerId);
      if (info?.status === 'connected') {
        this.set(peerId, { status: 'left' });
        this.leave.emit(peerId);
      } else if (info && info.status !== 'failed') {
        this.set(peerId, { status: 'failed', error: 'The connection could not be set up.' });
      }
    });

    try {
      await link.pc.setLocalDescription(await link.pc.createOffer());
      await gatherIce(link.pc);
      const sdp = link.pc.localDescription?.sdp;
      if (!sdp) throw new Error('no local description');
      const code = await encodeCode({ v: 1, type: 'offer', sdp, peerId });
      this.set(peerId, { code, status: 'waiting' });
    } catch (e) {
      console.error('[net] invite failed', e);
      this.set(peerId, { status: 'failed', error: 'Could not create an invite code in this browser.' });
    }
    return this.infos.get(peerId)!;
  }

  /** Paste the player's reply code for an invite. Throws CodeError on a bad code. */
  async acceptReply(peerId: string, replyCode: string): Promise<void> {
    const link = this.links.get(peerId);
    const info = this.infos.get(peerId);
    if (!link || !info) throw new CodeError('This invite no longer exists. Make a new one.');
    const p = await decodeCode(replyCode);
    if (p.type !== 'answer') throw new CodeError('That is an invite code. Paste the reply code the player sent back to you.');
    if (p.peerId !== peerId) throw new CodeError('This reply code belongs to a different invite. Paste it into the matching invite.');
    if (info.status !== 'waiting') throw new CodeError('This invite was already used. Make a new invite for another player.');
    this.set(peerId, { status: 'connecting', error: undefined });
    try {
      await link.pc.setRemoteDescription({ type: 'answer', sdp: p.sdp });
    } catch (e) {
      console.error('[net] setRemoteDescription failed', e);
      this.set(peerId, { status: 'failed', error: 'The reply code could not be used. Make a new invite and try again.' });
      link.close();
      return;
    }
    setTimeout(() => {
      if (this.infos.get(peerId)?.status === 'connecting') {
        this.set(peerId, { status: 'failed', error: 'No connection after 30 seconds.' });
        link.close();
      }
    }, CONNECT_TIMEOUT_MS);
  }

  /** Remove an invite (closes its connection if any). */
  cancelInvite(peerId: string): void {
    this.links.get(peerId)?.close();
    this.links.delete(peerId);
    this.infos.delete(peerId);
    this.changed.emit();
  }

  /** Stop hosting: tell every player and close all links. */
  close(): void {
    removeEventListener('pagehide', this.onPageHide);
    for (const link of this.links.values()) link.close();
    this.links.clear();
    this.infos.clear();
    this.changed.emit();
  }
}

// ------------------------------------------------------------------ client

export type ClientStatus = 'creating' | 'waiting' | 'connected' | 'failed' | 'closed';

/** Player side: one link to the host. Implements core's ClientTransport. */
export class ClientNetwork implements ClientTransport {
  private link = new PeerLink();
  private readonly msg = listeners<[HostToClient]>();
  private readonly closeL = listeners<[]>();
  /** Messages that arrived before anyone listened (welcome + snapshot race). */
  private early: HostToClient[] = [];
  readonly changed = listeners<[]>();
  status: ClientStatus = 'creating';
  peerId = '';
  replyCode = '';
  error = '';
  /** 'bye' = host closed the game on purpose; 'lost' = connection dropped. */
  closeReason: 'bye' | 'lost' | null = null;
  private onPageHide = () => this.close();

  private constructor() {
    addEventListener('pagehide', this.onPageHide);
    this.link.pc.addEventListener('datachannel', (e) => this.link.attach(e.channel));
    this.link.message.add((m) => {
      if (this.msg.size === 0) { if (this.early.length < 8) this.early.push(m as HostToClient); else this.close(); }
      else this.msg.emit(m as HostToClient);
    });
    this.link.opened.add(() => this.setStatus('connected'));
    this.link.closed.add((reason) => {
      if (this.status === 'connected') {
        this.closeReason = reason;
        this.setStatus('closed');
        this.closeL.emit();
      } else if (this.status !== 'closed') {
        this.error = 'The connection could not be set up.';
        this.setStatus('failed');
      }
    });
  }

  /** Read an invite code and produce the reply code. Throws CodeError on a bad code. */
  static async join(inviteCode: string): Promise<ClientNetwork> {
    const p = await decodeCode(inviteCode);
    if (p.type !== 'offer') throw new CodeError('That is a reply code. Paste the invite code you got from the host.');
    const net = new ClientNetwork();
    net.peerId = p.peerId;
    try {
      await net.link.pc.setRemoteDescription({ type: 'offer', sdp: p.sdp });
      await net.link.pc.setLocalDescription(await net.link.pc.createAnswer());
      await gatherIce(net.link.pc);
      const sdp = net.link.pc.localDescription?.sdp;
      if (!sdp) throw new Error('no local description');
      net.replyCode = await encodeCode({ v: 1, type: 'answer', sdp, peerId: p.peerId });
      net.setStatus('waiting');
    } catch (e) {
      console.error('[net] join failed', e);
      net.close();
      throw new CodeError('This invite code could not be used. Ask the host for a new invite.');
    }
    return net;
  }

  private setStatus(s: ClientStatus): void {
    this.status = s;
    this.changed.emit();
  }

  send(msg: ClientToHost): void {
    if (this.link.isOpen) this.link.send(msg.t === 'hello' ? { ...msg, compatibility: COMPATIBILITY_ID } : msg);
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
    if (this.status === 'connected') this.closeReason = 'bye';
    // Mark closed first so the link's close event isn't reported as "host left".
    if (this.status !== 'failed' && this.status !== 'closed') this.setStatus('closed');
    this.link.close();
  }
}

export { CodeError };
