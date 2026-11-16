// Copy-paste connection codes (D-015): the WebRTC session description of one side,
// deflate-compressed and base64url-encoded behind a short prefix.
//   MC1-…  compressed (CompressionStream 'deflate')
//   MC1R-… uncompressed fallback for browsers without CompressionStream

export interface CodePayload {
  v: 1;
  /** 'offer' = invite code (host → player), 'answer' = reply code (player → host). */
  type: 'offer' | 'answer';
  sdp: string;
  /** Peer id the host assigned to this player. */
  peerId: string;
}

const PREFIX = 'MC1-';
const PREFIX_RAW = 'MC1R-';

export class CodeError extends Error {}

export async function encodeCode(p: CodePayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  if (typeof CompressionStream === 'undefined') return PREFIX_RAW + toBase64Url(bytes);
  return PREFIX + toBase64Url(await pipe(bytes, new CompressionStream('deflate')));
}

export async function decodeCode(raw: string): Promise<CodePayload> {
  // Tolerate whitespace, line breaks and quotes picked up by chat apps.
  const text = raw.replace(/[\s"'`<>]/g, '');
  if (!text) throw new CodeError('Paste a code first.');
  if (text.length > 200000) throw new CodeError('This code is too long. Ask the host for a new invite.');
  let bytes: Uint8Array;
  try {
    if (text.startsWith(PREFIX_RAW)) {
      bytes = fromBase64Url(text.slice(PREFIX_RAW.length));
    } else if (text.startsWith(PREFIX)) {
      if (typeof DecompressionStream === 'undefined') throw new CodeError('This browser cannot read compressed codes. Please use a current Chrome, Edge, Firefox or Safari.');
      bytes = await pipe(fromBase64Url(text.slice(PREFIX.length)), new DecompressionStream('deflate'));
    } else {
      throw new CodeError(`That doesn't look like a connection code. Codes start with “${PREFIX}”.`);
    }
    const p = JSON.parse(new TextDecoder().decode(bytes)) as CodePayload;
    if (p?.v !== 1 || (p.type !== 'offer' && p.type !== 'answer') || typeof p.sdp !== 'string' || typeof p.peerId !== 'string') {
      throw new CodeError('This code is from a different version of the game.');
    }
    return p;
  } catch (e) {
    if (e instanceof CodeError) throw e;
    throw new CodeError('This code is incomplete or damaged. Copy it again with the Copy button and paste the whole code.');
  }
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  const reader = out.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1024 * 1024) { await reader.cancel(); throw new CodeError('This code is too large. Ask the host for a new invite.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
