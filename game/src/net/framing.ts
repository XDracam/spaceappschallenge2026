// Shared bounded JSON framing for room-code and manual WebRTC transports.
// Keep the existing wire representation; incomplete messages expire independently.
const CHUNK_THRESHOLD = 20000;
const CHUNK_SIZE = 16000;
const MAX_MESSAGE_CHARS = 8 * 1024 * 1024;
const MAX_CHUNKS = Math.ceil(MAX_MESSAGE_CHARS / CHUNK_SIZE);
const MAX_PENDING = 4;
const ASSEMBLY_TIMEOUT_MS = 30000;

export function* frames(wire: string, id: string): Generator<string> {
  if (wire.length > MAX_MESSAGE_CHARS) throw new Error('Game snapshot exceeds the connection message limit.');
  if (wire.length <= CHUNK_THRESHOLD) { yield wire; return; }
  const n = Math.ceil(wire.length / CHUNK_SIZE);
  for (let i = 0; i < n; i++) yield JSON.stringify({ '~': 'c', id, i, n, d: wire.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) });
}
interface Assembly { parts: Map<number, string>; n: number; size: number; timer: ReturnType<typeof setTimeout> }
export class FrameReceiver {
  private pending = new Map<string, Assembly>();
  constructor(private message: (value: unknown) => void, private bye: () => void) {}

  /** False means malformed/oversized framing: caller closes this connection. */
  receive(data: unknown): boolean {
    if (typeof data !== 'string' || data.length > CHUNK_THRESHOLD * 2) return false;
    let value: unknown;
    try { value = JSON.parse(data); } catch { return false; }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    if (obj['~'] === 'bye') { this.bye(); return true; }
    if (obj['~'] !== 'c') { this.message(value); return true; }
    const { id, i, n, d } = obj;
    if (typeof id !== 'string' || !id || id.length > 80 || !Number.isInteger(n) || (n as number) < 1
      || (n as number) > MAX_CHUNKS || !Number.isInteger(i) || (i as number) < 0 || (i as number) >= (n as number)
      || typeof d !== 'string' || d.length > CHUNK_SIZE) return false;
    let part = this.pending.get(id);
    if (!part) {
      if (this.pending.size >= MAX_PENDING) return false;
      const timer = setTimeout(() => this.drop(id), ASSEMBLY_TIMEOUT_MS);
      part = { parts: new Map(), n: n as number, size: 0, timer };
      this.pending.set(id, part);
    }
    if (part.n !== n || part.parts.has(i as number)) return false;
    part.parts.set(i as number, d);
    part.size += d.length;
    if (part.size > MAX_MESSAGE_CHARS) { this.drop(id); return false; }
    if (part.parts.size === part.n) {
      const wire = Array.from({ length: part.n }, (_, index) => part.parts.get(index)!).join('');
      this.drop(id);
      let message: unknown;
      try { message = JSON.parse(wire); } catch { return false; }
      this.message(message);
    }
    return true;
  }
  private drop(id: string): void {
    const part = this.pending.get(id);
    if (part) clearTimeout(part.timer);
    this.pending.delete(id);
  }
  clear(): void { for (const id of this.pending.keys()) this.drop(id); }
}
