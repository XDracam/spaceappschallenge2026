// Cached offscreen sprites (glows, shaded planet discs, background layers),
// so per-frame drawing is mostly drawImage without gradient allocation.

import type { BodyId } from '../model/types';
import { BODIES } from '../data/bodies';
import { COLORS, RIM_COLOR } from './style';

type Sprite = HTMLCanvasElement;

function makeCanvas(w: number, h: number): Sprite {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mix(hex: string, toward: string, t: number): string {
  const a = rgb(hex);
  const b = rgb(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// ------------------------------------------------------------------ glows

const GLOW_RES = 128;
const glowCache = new Map<string, Sprite>();

/** Soft radial glow (opaque centre fading to 0 at the edge), 128 px. */
export function glowSprite(color: string): Sprite {
  let s = glowCache.get(color);
  if (s) return s;
  s = makeCanvas(GLOW_RES, GLOW_RES);
  const g = s.getContext('2d')!;
  const c = GLOW_RES / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, withAlpha(color, 1));
  grad.addColorStop(0.18, withAlpha(color, 0.55));
  grad.addColorStop(0.45, withAlpha(color, 0.18));
  grad.addColorStop(0.75, withAlpha(color, 0.05));
  grad.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, GLOW_RES, GLOW_RES);
  glowCache.set(color, s);
  return s;
}

/** Draws a glow of the given radius (CSS px) centred at (x, y). */
export function drawGlow(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, radius: number, alpha: number) {
  if (radius <= 0 || alpha <= 0) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(glowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = prev;
}

/** Thin horizontal light streak (lens-flare style), cached per colour. */
const streakCache = new Map<string, Sprite>();
export function drawStreak(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, halfLen: number, halfH: number, alpha: number) {
  let s = streakCache.get(color);
  if (!s) {
    s = makeCanvas(256, 16);
    const g = s.getContext('2d')!;
    const lin = g.createLinearGradient(0, 0, 256, 0);
    lin.addColorStop(0, withAlpha(color, 0));
    lin.addColorStop(0.5, withAlpha(color, 1));
    lin.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = lin;
    g.fillRect(0, 0, 256, 16);
    // Fade vertically.
    g.globalCompositeOperation = 'destination-in';
    const v = g.createLinearGradient(0, 0, 0, 16);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.5, 'rgba(0,0,0,1)');
    v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v;
    g.fillRect(0, 0, 256, 16);
    streakCache.set(color, s);
  }
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(s, x - halfLen, y - halfH, halfLen * 2, halfH * 2);
  ctx.globalAlpha = prev;
}

// ------------------------------------------------------------------ bodies

const bodyCache = new Map<string, Sprite>();
const MAX_BODY_SPRITE_R = 360; // device px; larger discs are scaled up

/**
 * Shaded planet disc, lit from +x (rotate when drawing). The sprite is
 * (2 * (r * 1.3) + 4) px square with the disc centred; `large` adds the
 * atmosphere rim and a dotted latitude texture.
 */
function bodySprite(body: BodyId, rDev: number, large: boolean): { sprite: Sprite; r: number } {
  const r = Math.max(2, Math.min(MAX_BODY_SPRITE_R, Math.round(rDev)));
  const key = `${body}:${r}:${large ? 1 : 0}`;
  let s = bodyCache.get(key);
  if (s) return { sprite: s, r };
  if (bodyCache.size > 96) bodyCache.clear();
  const ext = Math.ceil(r * 1.3) + 2;
  s = makeCanvas(ext * 2, ext * 2);
  const g = s.getContext('2d')!;
  const c = ext;
  const color = BODIES[body].color;
  const rim = large ? RIM_COLOR[body] ?? null : null;

  if (rim) {
    // Atmosphere halo just outside the disc, strongest on the lit (+x) limb.
    const tmp = makeCanvas(ext * 2, ext * 2);
    const t = tmp.getContext('2d')!;
    const outer = t.createRadialGradient(c, c, r * 0.9, c, c, r * 1.28);
    outer.addColorStop(0, withAlpha(rim, 0.6));
    outer.addColorStop(0.3, withAlpha(rim, 0.22));
    outer.addColorStop(1, withAlpha(rim, 0));
    t.fillStyle = outer;
    t.fillRect(0, 0, ext * 2, ext * 2);
    t.globalCompositeOperation = 'destination-in';
    const side = t.createLinearGradient(c - r, 0, c + r, 0);
    side.addColorStop(0, 'rgba(0,0,0,0.2)');
    side.addColorStop(0.5, 'rgba(0,0,0,0.6)');
    side.addColorStop(1, 'rgba(0,0,0,1)');
    t.fillStyle = side;
    t.fillRect(0, 0, ext * 2, ext * 2);
    g.drawImage(tmp, 0, 0);
  }

  // Base: lit hemisphere toward +x.
  const base = g.createRadialGradient(c + r * 0.45, c - r * 0.2, r * 0.05, c + r * 0.15, c, r * 1.15);
  base.addColorStop(0, mix(color, '#ffffff', 0.45));
  base.addColorStop(0.45, color);
  base.addColorStop(1, mix(color, '#05080f', 0.55));
  g.fillStyle = base;
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.fill();

  g.save();
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.clip();

  if (large && r >= 14) {
    // Dotted latitude texture (orthographic projection of a lat/lon grid).
    g.fillStyle = mix(rim ?? color, '#ffffff', 0.55);
    const latStep = r > 160 ? 5 : r > 70 ? 7.5 : r > 35 ? 10 : 15;
    const dot = Math.max(1, r / 110);
    for (let lat = -84; lat <= 84; lat += latStep) {
      const cl = Math.cos((lat * Math.PI) / 180);
      const sl = Math.sin((lat * Math.PI) / 180);
      const n = Math.max(6, Math.round((360 / latStep) * cl));
      for (let k = 0; k < n; k++) {
        const lon = (k / n) * Math.PI * 2;
        const z = cl * Math.cos(lon);
        if (z <= 0.02) continue;
        const x = cl * Math.sin(lon);
        g.globalAlpha = 0.08 + 0.3 * z;
        g.fillRect(c + x * r - dot / 2, c - sl * r - dot / 2, dot, dot);
      }
    }
    g.globalAlpha = 1;
  }

  if (rim) {
    // Inner rim brightening at the limb (the terminator below dims its night side).
    const inner = g.createRadialGradient(c, c, r * 0.7, c, c, r);
    inner.addColorStop(0, withAlpha(rim, 0));
    inner.addColorStop(1, withAlpha(rim, 0.5));
    g.fillStyle = inner;
    g.globalCompositeOperation = 'lighter';
    g.fillRect(c - r, c - r, r * 2, r * 2);
    g.globalCompositeOperation = 'source-over';
  }

  // Terminator: darken the side away from the light.
  const sh = g.createLinearGradient(c + r * 0.25, c, c - r, c);
  sh.addColorStop(0, 'rgba(3, 6, 12, 0)');
  sh.addColorStop(0.55, 'rgba(3, 6, 12, 0.55)');
  sh.addColorStop(1, 'rgba(3, 6, 12, 0.8)');
  g.fillStyle = sh;
  g.fillRect(c - r, c - r, r * 2, r * 2);
  g.restore();

  bodyCache.set(key, s);
  return { sprite: s, r };
}

/**
 * Draws a shaded body disc of radius r (CSS px) at (x, y), lit from screen
 * angle `lightAngle` (radians, 0 = +x, y down).
 */
export function drawBody(
  ctx: CanvasRenderingContext2D, dpr: number, body: BodyId,
  x: number, y: number, r: number, lightAngle: number, large: boolean,
) {
  const { sprite, r: rDev } = bodySprite(body, r * dpr, large);
  const scale = r / rDev; // CSS px per sprite px
  const half = (sprite.width / 2) * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lightAngle);
  ctx.drawImage(sprite, -half, -half, half * 2, half * 2);
  ctx.restore();
}

/** The Sun: white-hot core fading to warm yellow, with a separate bloom. */
const sunCache = new Map<number, Sprite>();
export function drawSunDisc(ctx: CanvasRenderingContext2D, dpr: number, x: number, y: number, r: number) {
  const rDev = Math.max(2, Math.min(MAX_BODY_SPRITE_R, Math.round(r * dpr)));
  let s = sunCache.get(rDev);
  if (!s) {
    if (sunCache.size > 32) sunCache.clear();
    s = makeCanvas(rDev * 2 + 2, rDev * 2 + 2);
    const g = s.getContext('2d')!;
    const c = rDev + 1;
    const grad = g.createRadialGradient(c, c, 0, c, c, rDev);
    grad.addColorStop(0, '#fffdf4');
    grad.addColorStop(0.55, '#fff1c2');
    grad.addColorStop(0.85, '#ffd76a');
    grad.addColorStop(1, '#ffbf3d');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(c, c, rDev, 0, Math.PI * 2);
    g.fill();
    sunCache.set(rDev, s);
  }
  const half = (s.width / 2) * (r / rDev);
  ctx.drawImage(s, x - half, y - half, half * 2, half * 2);
}

// -------------------------------------------------------------- background

export interface Star { fx: number; fy: number; size: number; alpha: number; tint: string }

/** Fixed layer: base colour + faint nebula haze. Cached per size. */
let nebula: { key: string; sprite: Sprite } | null = null;
export function nebulaLayer(w: number, h: number, dpr: number): Sprite {
  const key = `${w}x${h}@${dpr}`;
  if (nebula?.key === key) return nebula.sprite;
  const s = makeCanvas(w * dpr, h * dpr);
  const g = s.getContext('2d')!;
  g.scale(dpr, dpr);
  g.fillStyle = COLORS.bg;
  g.fillRect(0, 0, w, h);
  const m = Math.max(w, h);
  const blobs: [number, number, number, string, number][] = [
    [0.18, 0.78, 0.55, '#16306b', 0.16],
    [0.86, 0.22, 0.5, '#2a1d5e', 0.12],
    [0.62, 0.92, 0.4, '#0d4a62', 0.1],
    [0.05, 0.12, 0.35, '#122a55', 0.1],
  ];
  for (const [fx, fy, fr, color, a] of blobs) {
    const x = fx * w;
    const y = fy * h;
    const r = fr * m;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, withAlpha(color, a));
    grad.addColorStop(0.5, withAlpha(color, a * 0.4));
    grad.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  nebula = { key, sprite: s };
  return s;
}

/** Dim star field on a transparent layer (tiled with parallax). Cached per size. */
let starLayerCache: { key: string; sprite: Sprite } | null = null;
export function starLayer(w: number, h: number, dpr: number, stars: Star[]): Sprite {
  const key = `${w}x${h}@${dpr}`;
  if (starLayerCache?.key === key) return starLayerCache.sprite;
  const s = makeCanvas(w * dpr, h * dpr);
  const g = s.getContext('2d')!;
  g.scale(dpr, dpr);
  for (const st of stars) {
    g.globalAlpha = st.alpha;
    g.fillStyle = st.tint;
    g.beginPath();
    g.arc(st.fx * w, st.fy * h, st.size / 2, 0, Math.PI * 2);
    g.fill();
  }
  starLayerCache = { key, sprite: s };
  return s;
}
