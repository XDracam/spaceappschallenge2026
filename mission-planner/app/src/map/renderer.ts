// Canvas renderer + interaction for the solar-system map.
// Owns zoom/pan and hover state; reads game/ui/clock stores; writes only
// uiStore (view centre, selection, hover, popup).

import type { BodyId, BranchResult, Evaluation, FlightState, GameState, ManeuverResult, Vec2 } from '../model/types';
import { BODIES, SYSTEM_VIEW_BODIES, childrenOf } from '../data/bodies';
import { bodyPosition, spacecraftPositionAt } from '../physics';
import { clockStore, gameStore, getEvaluation, uiStore, type UiState } from '../state/store';
import { formatDay, formatDv } from '../model/units';
import { type Projection, fitScale, radiusPx, toScreen } from './projection';
import {
  ANIM_FPS, BODY_PX, COLORS, DRAG_THRESHOLD_PX, FONT, FONT_BOLD, FONT_HINT, FONT_HUD, FONT_LABEL, FONT_TITLE, LABEL_SPACING,
  MAX_ZOOM, MIN_ZOOM, RIM_COLOR, RING_HIT_BAND_PX, branchColor,
} from './style';
import {
  type Star, drawBody, drawGlow, drawStreak, drawSunDisc, nebulaLayer, starLayer, withAlpha,
} from './sprites';

// ------------------------------------------------------------------ types

/** CSS px of the map covered by floating UI on each side. */
export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The free (uncovered) rectangle of the canvas, CSS px. */
interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type TipLine = { text: string; color?: string; bold?: boolean };

type HitAction =
  | { kind: 'back' }
  | { kind: 'body'; body: BodyId }
  | { kind: 'maneuver'; maneuverId: string; branchId: string; x: number; y: number }
  | { kind: 'endState'; branchId: string };

interface HitTarget {
  key: string;
  priority: number;
  contains: (x: number, y: number) => boolean;
  action: HitAction;
  tooltip?: TipLine[];
}

/** Where a body is drawn in the current view. */
interface Anchor {
  x: number;
  y: number;
  r: number;
  key: string;
  body: BodyId;
  isCenter: boolean;
  /** Moon shown next to its planet in the system view (not drawn as a regular body). */
  proxy: boolean;
}

interface Frame {
  ctx: CanvasRenderingContext2D;
  game: GameState;
  ui: UiState;
  evaluation: Evaluation | null;
  day: number;
  center: BodyId;
  proj: Projection;
  planning: boolean;
  startISO: string;
  anchors: Map<string, Anchor | null>;
  stack: Map<string, number>;
  drawnProxies: Set<string>;
}

interface PendingMarker {
  m: ManeuverResult;
  branchIndex: number;
  failed: boolean;
  dim: boolean;
  x: number;
  y: number;
  anchorKey?: string;
  anchor?: Anchor;
}

// ---------------------------------------------------------------- helpers

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_TINTS = ['#ffffff', '#ffffff', '#cfe6ff', '#a9d8ff', '#ffe9c7'];

const STARS: Star[] = (() => {
  const rnd = mulberry32(20261114);
  return Array.from({ length: 320 }, () => {
    const big = rnd() > 0.88;
    return {
      fx: rnd(), fy: rnd(), size: big ? 1.3 + rnd() * 0.5 : 0.6 + rnd() * 0.5,
      alpha: big ? 0.35 + rnd() * 0.35 : 0.1 + rnd() * 0.35,
      tint: STAR_TINTS[Math.floor(rnd() * STAR_TINTS.length)],
    };
  });
})();

/** A few bright stars drawn per frame with a soft glow, cross flare and twinkle. */
const BRIGHT_STARS = (() => {
  const rnd = mulberry32(4242);
  return Array.from({ length: 9 }, () => ({
    fx: rnd(), fy: rnd(), size: 0.9 + rnd() * 0.9, phase: rnd() * Math.PI * 2, speed: 0.5 + rnd() * 0.9,
    tint: rnd() > 0.4 ? '#bfe6ff' : '#ffffff',
  }));
})();

const BELT = (() => {
  const rnd = mulberry32(7);
  const au = 149_597_870.7;
  return Array.from({ length: 520 }, () => ({
    angle: rnd() * Math.PI * 2, rKm: (2.15 + rnd() * 1.15) * au, alpha: 0.06 + rnd() * 0.16, size: rnd() > 0.85 ? 1.4 : 1,
  }));
})();

function finite(v: Vec2): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Canvas letterSpacing (Chromium/Firefox); ignored where unsupported. */
function setSpacing(ctx: CanvasRenderingContext2D, v: string) {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = v;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function stateBody(s: FlightState): BodyId | null {
  return s.kind === 'lost' ? null : s.body;
}

function stateKey(s: FlightState): string | null {
  switch (s.kind) {
    case 'orbit': return `o:${s.body}:${Math.round(s.altitudeKm)}`;
    case 'surface': return `s:${s.body}`;
    case 'approach': return `a:${s.body}:${Math.round(s.day)}`;
    default: return null;
  }
}

function describeState(s: FlightState): string {
  switch (s.kind) {
    case 'orbit': return `Orbit ${Math.round(s.altitudeKm).toLocaleString('en-US')} km above ${BODIES[s.body].name}`;
    case 'surface': return `On the surface of ${BODIES[s.body].name}`;
    case 'approach': return `Approaching ${BODIES[s.body].name}`;
    case 'lost': return `Lost: ${s.reason}`;
  }
}

/** Cosmetic low-orbit ring offset: 6..14 px, log of altitude within the body's allowed range. */
function orbitRingOffset(body: BodyId, altKm: number): number {
  const b = BODIES[body];
  const lo = Math.max(1, b.minOrbitAltKm);
  const hi = Math.max(lo * 1.001, b.maxOrbitAltKm);
  const t = clamp(Math.log(Math.max(altKm, lo) / lo) / Math.log(hi / lo), 0, 1);
  return 6 + 8 * t;
}

function failIndexOf(br: BranchResult): number {
  if (br.failedAtManeuverId) {
    const i = br.maneuvers.findIndex((m) => m.maneuverId === br.failedAtManeuverId);
    if (i >= 0) return i;
  }
  const j = br.maneuvers.findIndex((m) => !m.ok);
  return j >= 0 ? j : Infinity;
}

function worstSeverity(m: ManeuverResult): 'error' | 'warning' | null {
  if (m.issues.some((i) => i.severity === 'error')) return 'error';
  if (m.issues.some((i) => i.severity === 'warning')) return 'warning';
  return null;
}

// --------------------------------------------------------------- renderer

export class MapRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private lastCenter: BodyId | null = null;
  private hits: HitTarget[] = [];
  private hover: HitTarget | null = null;
  private mouse: Vec2 | null = null;
  private drag: { id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null = null;
  private selectedBody: BodyId | null = null;
  private ourHoverManeuver: string | null = null;
  private raf = 0;
  private cleanups: (() => void)[] = [];
  private insets: MapInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  /** Set during draw when something on screen animates (end-state pulse). */
  private animating = false;
  private animTimer = 0;
  /** Animation clock (s), sampled at draw time. */
  private time = 0;

  constructor(private canvas: HTMLCanvasElement, private container: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not available');
    this.ctx = ctx;

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.cleanups.push(() => ro.disconnect());
    this.resize();

    const req = () => this.request();
    this.cleanups.push(gameStore.subscribe(req), uiStore.subscribe(req), clockStore.subscribe(req));

    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      canvas.addEventListener(type, fn as EventListener, opts);
      this.cleanups.push(() => canvas.removeEventListener(type, fn as EventListener, opts));
    };
    on('pointerdown', (e) => this.onPointerDown(e));
    on('pointermove', (e) => this.onPointerMove(e));
    on('pointerup', (e) => this.onPointerUp(e));
    on('pointercancel', () => { this.drag = null; });
    on('pointerleave', () => this.onLeave());
    on('wheel', (e) => this.onWheel(e), { passive: false });
    on('dblclick', (e) => { e.preventDefault(); this.resetView(); });
    on('contextmenu', (e) => e.preventDefault());

    // Web fonts (Inter / Exo 2) may arrive after the first draw.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      fonts.ready.then(req).catch(() => { /* ignore */ });
      fonts.addEventListener('loadingdone', req);
      this.cleanups.push(() => fonts.removeEventListener('loadingdone', req));
    }
    // Resume the animation when the tab becomes visible again.
    const onVis = () => { if (document.visibilityState === 'visible') this.request(); };
    document.addEventListener('visibilitychange', onVis);
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

    this.request();
  }

  /** Area covered by floating UI; the default view fits the rest. */
  setInsets(insets: MapInsets) {
    const n = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);
    const next = { top: n(insets.top), right: n(insets.right), bottom: n(insets.bottom), left: n(insets.left) };
    const cur = this.insets;
    if (next.top === cur.top && next.right === cur.right && next.bottom === cur.bottom && next.left === cur.left) return;
    this.insets = next;
    // Zoom and pan are relative to the free rectangle, so the view re-fits.
    this.request();
  }

  /** Free rectangle (CSS px). Falls back to the whole canvas if the insets leave too little. */
  private free(): FreeRect {
    const { top, right, bottom, left } = this.insets;
    let x = left;
    let w = this.w - left - right;
    let y = top;
    let h = this.h - top - bottom;
    if (w < 200) { x = 0; w = this.w; }
    if (h < 160) { y = 0; h = this.h; }
    return { x, y, w, h };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.animTimer);
    this.animTimer = 0;
    this.cleanups.forEach((c) => c());
    this.cleanups = [];
    if (this.ourHoverManeuver && uiStore.get().hoverManeuverId === this.ourHoverManeuver) {
      uiStore.update((u) => { u.hoverManeuverId = null; });
    }
  }

  private request() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    this.w = Math.max(1, Math.round(rect.width));
    this.h = Math.max(1, Math.round(rect.height));
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.request();
  }

  private resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.request();
  }

  // ------------------------------------------------------------ input

  private local(e: MouseEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const p = this.local(e);
    this.mouse = p;
    this.drag = { id: e.pointerId, sx: p.x, sy: p.y, px: this.panX, py: this.panY, moved: false };
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  private onPointerMove(e: PointerEvent) {
    const p = this.local(e);
    this.mouse = p;
    if (this.drag && this.drag.id === e.pointerId) {
      const dx = p.x - this.drag.sx;
      const dy = p.y - this.drag.sy;
      if (!this.drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) this.drag.moved = true;
      if (this.drag.moved) {
        this.panX = this.drag.px + dx;
        this.panY = this.drag.py + dy;
        this.canvas.style.cursor = 'grabbing';
        this.request();
        return;
      }
    }
    this.updateHover();
  }

  private onPointerUp(e: PointerEvent) {
    const d = this.drag;
    this.drag = null;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = this.local(e);
    this.mouse = p;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) this.click(p);
    this.updateHover();
  }

  private onLeave() {
    if (this.drag) return;
    this.mouse = null;
    this.updateHover();
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const p = this.local(e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const factor = Math.exp(-e.deltaY * unit * 0.0015);
    const z2 = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const ratio = z2 / this.zoom;
    const fr = this.free();
    const cx = fr.x + fr.w / 2;
    const cy = fr.y + fr.h / 2;
    // Keep the point under the cursor fixed.
    this.panX = p.x - cx - ratio * (p.x - cx - this.panX);
    this.panY = p.y - cy - ratio * (p.y - cy - this.panY);
    this.zoom = z2;
    this.request();
  }

  private hitTest(p: Vec2 | null): HitTarget | null {
    if (!p) return null;
    let best: HitTarget | null = null;
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if ((!best || h.priority > best.priority) && h.contains(p.x, p.y)) best = h;
    }
    return best;
  }

  private updateHover() {
    const next = this.drag?.moved ? null : this.hitTest(this.mouse);
    const changed = (next?.key ?? null) !== (this.hover?.key ?? null);
    this.hover = next;
    if (!this.drag?.moved) this.canvas.style.cursor = next ? 'pointer' : 'default';
    // Tooltip follows the mouse, so redraw whenever something is hovered.
    if (changed || next?.tooltip) this.request();
    const mnv = next?.action.kind === 'maneuver' ? next.action.maneuverId : null;
    if (mnv !== this.ourHoverManeuver) {
      const prev = this.ourHoverManeuver;
      this.ourHoverManeuver = mnv;
      const cur = uiStore.get().hoverManeuverId;
      if (mnv !== null ? cur !== mnv : cur === prev) {
        // Defer: may be called during draw.
        queueMicrotask(() => uiStore.update((u) => { u.hoverManeuverId = mnv; }));
      }
    }
  }

  private click(p: Vec2) {
    const hit = this.hitTest(p);
    const planning = gameStore.get().phase === 'planning';
    if (!hit) {
      this.selectedBody = null;
      if (uiStore.get().popup) uiStore.update((u) => { u.popup = null; });
      else this.request();
      return;
    }
    const a = hit.action;
    switch (a.kind) {
      case 'back':
        uiStore.update((u) => { u.viewCenter = 'sun'; u.popup = null; });
        break;
      case 'body': {
        const center = uiStore.get().viewCenter;
        if (center === 'sun' && SYSTEM_VIEW_BODIES.includes(a.body)) {
          uiStore.update((u) => { u.viewCenter = a.body; u.popup = null; });
        } else {
          this.selectedBody = this.selectedBody === a.body ? null : a.body;
          if (uiStore.get().popup) uiStore.update((u) => { u.popup = null; });
          else this.request();
        }
        break;
      }
      case 'maneuver':
        uiStore.update((u) => {
          u.selectedManeuverId = a.maneuverId;
          u.selectedBranchId = a.branchId;
          u.popup = planning ? { kind: 'maneuverEdit', maneuverId: a.maneuverId, screen: { x: a.x, y: a.y } } : null;
        });
        break;
      case 'endState':
        if (!planning) break;
        uiStore.update((u) => {
          u.selectedBranchId = a.branchId;
          u.popup = { kind: 'maneuverMenu', branchId: a.branchId, screen: { x: p.x, y: p.y } };
        });
        break;
    }
  }

  // ------------------------------------------------------------- draw

  private draw() {
    // Browser zoom / moving to another monitor changes the DPR without a resize.
    if ((window.devicePixelRatio || 1) !== this.dpr) {
      this.resize();
      if (this.raf) cancelAnimationFrame(this.raf); // resize() re-requested; we draw now
      this.raf = 0;
    }
    const ctx = this.ctx;
    const game = gameStore.get();
    const ui = uiStore.get();
    const clock = clockStore.get();
    let evaluation: Evaluation | null = null;
    try {
      evaluation = getEvaluation();
    } catch (err) {
      console.error('[map] evaluation failed', err);
    }

    const center = ui.viewCenter;
    if (center !== this.lastCenter) {
      this.lastCenter = center;
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.selectedBody = null;
    }

    const fr = this.free();
    const fitPx = Math.max(40, Math.min(fr.w, fr.h) * 0.43);
    const proj: Projection = {
      ox: fr.x + fr.w / 2 + this.panX,
      oy: fr.y + fr.h / 2 + this.panY,
      scale: fitScale(center, fitPx) * this.zoom,
    };
    this.time = performance.now() / 1000;
    this.animating = false;
    // Default to the planned launch day while planning, so Earth and the launch orbit line up.
    const day = ui.playthrough?.day ?? ui.mapDay ?? (game.phase === 'planning' ? game.plan.launchDay : clock.day);
    const F: Frame = {
      ctx, game, ui, evaluation, day, center, proj,
      planning: game.phase === 'planning',
      startISO: game.mission.startDateISO,
      anchors: new Map(), stack: new Map(), drawnProxies: new Set(),
    };

    this.hits = [];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = FONT;
    ctx.textBaseline = 'alphabetic';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.drawBackground(F);
    this.drawOrbits(F);
    this.drawBodies(F);
    if (evaluation) {
      this.drawTrajectories(F, evaluation);
      this.drawGhosts(F, evaluation);
      this.drawStates(F, evaluation);
      this.drawMarkers(F, evaluation);
      if (ui.playthrough) this.drawSpacecraft(F, evaluation);
    }
    this.drawHud(F);

    // Hits changed: refresh hover (does not loop: only re-requests on change).
    if (!this.drag?.moved) {
      const next = this.hitTest(this.mouse);
      if ((next?.key ?? null) !== (this.hover?.key ?? null)) this.updateHover();
      else this.hover = next;
    }
    this.drawTooltip(F);
    this.scheduleAnimation();
  }

  /** Pulse / twinkle: redraw at most ANIM_FPS while something animates and the tab is visible. */
  private scheduleAnimation() {
    if (!this.animating || this.animTimer || document.visibilityState !== 'visible') return;
    this.animTimer = window.setTimeout(() => {
      this.animTimer = 0;
      this.request();
    }, 1000 / ANIM_FPS);
  }

  // ---------------------------------------------------------- anchors

  private anchor(F: Frame, body: BodyId, day: number): Anchor | null {
    const ck = `${body}@${day}`;
    if (F.anchors.has(ck)) return F.anchors.get(ck)!;
    const a = this.computeAnchor(F, body, day);
    F.anchors.set(ck, a);
    return a;
  }

  private computeAnchor(F: Frame, body: BodyId, day: number): Anchor | null {
    const { center, proj } = F;
    const b = BODIES[body];
    if (body === center) {
      const minPx = center === 'sun' ? BODY_PX.sun : BODY_PX[center] + 4;
      return { x: proj.ox, y: proj.oy, r: Math.max(minPx, radiusPx(proj, b.radiusKm)), key: body, body, isCenter: true, proxy: false };
    }
    if (b.parent === center) {
      const p = toScreen(proj, bodyPosition(body, day));
      if (!finite(p)) return null;
      return { ...p, r: BODY_PX[body], key: body, body, isCenter: false, proxy: false };
    }
    if (b.parent && BODIES[b.parent].parent === center) {
      // Moon in the system view: a small proxy dot next to its planet.
      const pa = this.anchor(F, b.parent, day);
      if (!pa) return null;
      const rel = bodyPosition(body, day);
      const len = Math.hypot(rel.x, rel.y);
      const dx = len > 0 ? rel.x / len : 0.7071;
      const dy = len > 0 ? -rel.y / len : -0.7071;
      const d = pa.r + 9;
      return { x: pa.x + dx * d, y: pa.y + dy * d, r: 2.5, key: body, body, isCenter: false, proxy: true };
    }
    return null;
  }

  private ensureProxyDrawn(F: Frame, a: Anchor) {
    if (!a.proxy || F.drawnProxies.has(a.key)) return;
    F.drawnProxies.add(a.key);
    const ctx = F.ctx;
    ctx.save();
    drawGlow(ctx, BODIES[a.body].color, a.x, a.y, a.r * 3.2, 0.35);
    ctx.fillStyle = BODIES[a.body].color;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.hits.push({
      key: `body:${a.body}`, priority: 1, action: { kind: 'body', body: a.body },
      contains: (x, y) => Math.hypot(x - a.x, y - a.y) <= 7,
      tooltip: [{ text: BODIES[a.body].name, bold: true }, { text: `Moon of ${BODIES[BODIES[a.body].parent!].name}`, color: COLORS.muted }],
    });
  }

  private stackCount(F: Frame, key: string): number {
    const n = F.stack.get(key) ?? 0;
    F.stack.set(key, n + 1);
    return n;
  }

  // ------------------------------------------------------- background

  private drawBackground(F: Frame) {
    const { ctx, proj } = F;
    const { w, h } = this;
    // Base colour + nebula haze (cached, fixed to the screen).
    ctx.drawImage(nebulaLayer(w, h, this.dpr), 0, 0, w, h);

    // Deep-blue glow behind the view centre.
    const m = Math.min(w, h);
    drawGlow(ctx, COLORS.centerGlow, proj.ox, proj.oy, m * 0.85, 0.55);

    // Dim star field, tiled with a slight parallax.
    const stars = starLayer(w, h, this.dpr, STARS);
    const ox = (((this.panX * 0.04) % w) + w) % w;
    const oy = (((this.panY * 0.04) % h) + h) % h;
    for (const dx of [ox - w, ox]) {
      for (const dy of [oy - h, oy]) {
        if (dx + w <= 0 || dy + h <= 0 || dx >= w || dy >= h) continue;
        ctx.drawImage(stars, dx, dy, w, h);
      }
    }

    // A few bright stars with a soft glow and a very subtle twinkle.
    for (const s of BRIGHT_STARS) {
      const x = (((s.fx * w + this.panX * 0.06) % w) + w) % w;
      const y = (((s.fy * h + this.panY * 0.06) % h) + h) % h;
      const tw = 0.82 + 0.18 * Math.sin(this.time * s.speed + s.phase);
      drawGlow(ctx, s.tint, x, y, 7 * s.size, 0.45 * tw);
      drawStreak(ctx, s.tint, x, y, 9 * s.size, 0.9, 0.35 * tw);
      ctx.globalAlpha = 0.9 * tw;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, s.size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Screen angle (radians, y down) from a point toward the Sun. */
  private lightAngle(F: Frame, x: number, y: number): number {
    if (F.center === 'sun') return Math.atan2(F.proj.oy - y, F.proj.ox - x);
    const v = bodyPosition(F.center, F.day);
    if (!finite(v) || (v.x === 0 && v.y === 0)) return Math.PI;
    return Math.atan2(v.y, -v.x);
  }

  private viewBodies(center: BodyId) {
    return childrenOf(center);
  }

  private drawOrbits(F: Frame) {
    const { ctx, proj, center } = F;
    if (center === 'sun') {
      // Asteroid belt speckle.
      ctx.fillStyle = COLORS.belt;
      for (const p of BELT) {
        const s = toScreen(proj, { x: Math.cos(p.angle) * p.rKm, y: Math.sin(p.angle) * p.rKm });
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(s.x, s.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }
    const hoverBody = this.hover?.action.kind === 'body' ? this.hover.action.body : null;
    for (const b of this.viewBodies(center)) {
      const r = radiusPx(proj, b.orbitRadiusKm);
      const small = BODY_PX[b.id] <= 3;
      const hot = hoverBody === b.id || this.selectedBody === b.id;
      ctx.strokeStyle = hot ? COLORS.orbitHover : center === 'sun' ? COLORS.orbit : COLORS.orbitMoon;
      ctx.lineWidth = hot ? 1.3 : 1;
      ctx.globalAlpha = small && !hot ? 0.8 : 1;
      ctx.setLineDash(small ? [1.5, 4] : []);
      ctx.beginPath();
      ctx.arc(proj.ox, proj.oy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private drawBodies(F: Frame) {
    const { ctx, center, day } = F;
    const hoverBody = this.hover?.action.kind === 'body' ? this.hover.action.body : null;

    // Centre body.
    const c = this.anchor(F, center, day)!;
    const cb = BODIES[center];
    ctx.save();
    if (center === 'sun') {
      // Large soft bloom + faint horizontal flare, then the white-hot disc.
      const bloom = Math.max(70, c.r * 9);
      drawGlow(ctx, '#ff9a2e', c.x, c.y, bloom, 0.32);
      drawGlow(ctx, '#ffd27a', c.x, c.y, bloom * 0.45, 0.55);
      drawGlow(ctx, '#fff4d6', c.x, c.y, c.r * 3, 0.8);
      drawStreak(ctx, '#ffe2a8', c.x, c.y, bloom * 1.1, Math.max(1.5, c.r * 0.22), 0.45);
      drawSunDisc(ctx, this.dpr, c.x, c.y, c.r);
    } else {
      const rim = RIM_COLOR[center] ?? cb.color;
      drawGlow(ctx, rim, c.x, c.y, Math.max(c.r * 2.3, c.r + 60), 0.28);
      drawBody(ctx, this.dpr, center, c.x, c.y, c.r, this.lightAngle(F, c.x, c.y), true);
    }
    ctx.restore();
    // Below the flare streak.
    if (center === 'sun') this.label(F, cb.name, c.x + c.r * 0.7 + 4, c.y + c.r + 13, false);
    this.hits.push({
      key: `body:${center}`, priority: 0, action: { kind: 'body', body: center },
      contains: (x, y) => Math.hypot(x - c.x, y - c.y) <= Math.max(c.r, 9),
      tooltip: [{ text: cb.name, bold: true }],
    });

    for (const b of this.viewBodies(center)) {
      const a = this.anchor(F, b.id, day);
      if (!a) continue;
      const hot = hoverBody === b.id || this.selectedBody === b.id;
      ctx.save();
      drawGlow(ctx, b.color, a.x, a.y, a.r * (hot ? 5 : 3.6), hot ? 0.6 : 0.38);
      drawBody(ctx, this.dpr, b.id, a.x, a.y, a.r, this.lightAngle(F, a.x, a.y), false);
      ctx.restore();
      if (this.selectedBody === b.id) {
        ctx.save();
        ctx.strokeStyle = withAlpha(COLORS.accent, 0.8);
        ctx.shadowColor = COLORS.accent;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      this.label(F, b.name, a.x + a.r + 6, a.y + 4, hot);
      const nested = center === 'sun' && SYSTEM_VIEW_BODIES.includes(b.id);
      const tip: TipLine[] = [{ text: b.name, bold: true }];
      if (nested) tip.push({ text: `Click to open the ${b.name} system`, color: COLORS.muted });
      this.hits.push({
        key: `body:${b.id}`, priority: 1, action: { kind: 'body', body: b.id },
        contains: (x, y) => Math.hypot(x - a.x, y - a.y) <= Math.max(a.r + 4, 10),
        tooltip: tip,
      });
    }
  }

  private label(F: Frame, text: string, x: number, y: number, hot: boolean) {
    const { ctx } = F;
    ctx.save();
    ctx.font = FONT_LABEL;
    setSpacing(ctx, LABEL_SPACING);
    ctx.fillStyle = hot ? COLORS.text : COLORS.muted;
    if (hot) {
      ctx.shadowColor = withAlpha(COLORS.accent, 0.6);
      ctx.shadowBlur = 6;
    }
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.restore();
  }

  // ----------------------------------------------------- trajectories

  private tracePolyline(F: Frame, pts: Vec2[]) {
    const { ctx, proj } = F;
    ctx.beginPath();
    let prevKm: Vec2 | null = null;
    let prevPx: Vec2 | null = null;
    for (const km of pts) {
      if (!finite(km)) { prevKm = prevPx = null; continue; }
      const px = toScreen(proj, km);
      if (!prevKm || !prevPx) {
        ctx.moveTo(px.x, px.y);
      } else {
        // Subdivide long segments: the sqrt mapping bends straight km segments.
        const n = Math.min(32, Math.floor(Math.hypot(px.x - prevPx.x, px.y - prevPx.y) / 12));
        for (let i = 1; i < n; i++) {
          const t = i / n;
          const q = toScreen(proj, { x: prevKm.x + (km.x - prevKm.x) * t, y: prevKm.y + (km.y - prevKm.y) * t });
          ctx.lineTo(q.x, q.y);
        }
        ctx.lineTo(px.x, px.y);
      }
      prevKm = km;
      prevPx = px;
    }
  }

  private drawTrajectories(F: Frame, ev: Evaluation) {
    const { ctx, ui, center } = F;
    const focus = ui.hoverManeuverId ?? ui.selectedManeuverId;
    // Unselected branches first so the selected one sits on top.
    const order = ev.branches.map((br, i) => ({ br, i })).sort((a, b) =>
      Number(a.br.branchId === ui.selectedBranchId) - Number(b.br.branchId === ui.selectedBranchId));
    for (const { br, i } of order) {
      const failIdx = failIndexOf(br);
      const selected = br.branchId === ui.selectedBranchId;
      br.maneuvers.forEach((m, mi) => {
        const t = m.trajectory;
        if (!t || t.centerBody !== center || t.points.length < 2) return;
        const failed = mi >= failIdx;
        const isFocus = m.maneuverId === focus;
        const color = failed ? COLORS.fail : branchColor(i);
        ctx.save();
        ctx.globalAlpha = isFocus ? 1 : selected ? 0.95 : 0.45;
        ctx.strokeStyle = color;
        ctx.lineWidth = isFocus ? 2.8 : selected ? 2 : 1.3;
        ctx.setLineDash(failed ? [6, 5] : []);
        ctx.shadowColor = color;
        ctx.shadowBlur = isFocus ? 14 : selected ? 10 : 6;
        this.tracePolyline(F, t.points);
        ctx.stroke();
        if (selected || isFocus) {
          // Bright thin core on top of the glow.
          ctx.shadowBlur = 0;
          ctx.globalAlpha = isFocus ? 0.85 : 0.55;
          ctx.strokeStyle = failed ? '#ffd0d4' : '#e6f8ff';
          ctx.lineWidth = isFocus ? 1 : 0.7;
          ctx.stroke();
        }
        ctx.restore();
      });
    }
  }

  /** Bodies at departure / arrival day of the focused transfer or flyby. */
  private drawGhosts(F: Frame, ev: Evaluation) {
    const { ctx, ui, day } = F;
    const focus = ui.hoverManeuverId ?? ui.selectedManeuverId;
    if (!focus) return;
    let m: ManeuverResult | undefined;
    for (const br of ev.branches) {
      m = br.maneuvers.find((x) => x.maneuverId === focus);
      if (m) break;
    }
    if (!m || (m.type !== 'transfer' && m.type !== 'flyby')) return;
    const ghosts: { body: BodyId; day: number; text: string }[] = [];
    const from = stateBody(m.stateBefore);
    const to = stateBody(m.stateAfter);
    if (from) ghosts.push({ body: from, day: m.startDay, text: 'departure' });
    if (to) ghosts.push({ body: to, day: m.endDay, text: 'arrival' });
    for (const g of ghosts) {
      const a = this.anchor(F, g.body, g.day);
      const now = this.anchor(F, g.body, day);
      if (!a || a.isCenter || a.proxy) continue;
      if (now && Math.hypot(now.x - a.x, now.y - a.y) < 6) continue;
      ctx.save();
      const color = BODIES[g.body].color;
      drawGlow(ctx, color, a.x, a.y, a.r * 3, 0.25);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.9;
      ctx.font = FONT_LABEL;
      setSpacing(ctx, '0.8px');
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(`${BODIES[g.body].name} at ${g.text} · ${formatDay(g.day, F.startISO)}`.toUpperCase(), a.x + a.r + 6, a.y - 6);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ states

  private drawStates(F: Frame, ev: Evaluation) {
    const { ui, game } = F;
    ev.branches.forEach((br, i) => {
      const failIdx = failIndexOf(br);
      const selected = br.branchId === ui.selectedBranchId;
      const color = branchColor(i);
      const finalKey = stateKey(br.finalState);
      const seen = new Set<string>();
      br.maneuvers.forEach((m, mi) => {
        const k = stateKey(m.stateAfter);
        if (!k || k === finalKey || seen.has(k)) return;
        seen.add(k);
        this.drawState(F, m.stateAfter, mi >= failIdx ? COLORS.fail : color, selected ? 0.75 : 0.4, null);
      });
      if (!finalKey) return;
      const failed = failIdx !== Infinity;
      const name = game.plan.branches.find((b) => b.id === br.branchId)?.name ?? br.branchId;
      this.drawState(F, br.finalState, failed ? COLORS.fail : color, selected ? 1 : 0.5,
        F.planning ? { branchId: br.branchId, name } : null);
    });
  }

  /** Draws one flight state at its body. `end` = clickable branch end state. */
  private drawState(F: Frame, s: FlightState, color: string, alpha: number, end: { branchId: string; name: string } | null) {
    const b = stateBody(s);
    if (!b) return;
    // Draw the state where the body is on the state's own day, so the marker sits
    // at the end of the trajectory that led there (not where the body is today).
    const a = this.anchor(F, b, s.day);
    if (!a) return;
    this.ensureProxyDrawn(F, a);
    const { ctx, proj } = F;
    const now = this.anchor(F, b, F.day);
    if (!a.isCenter && !a.proxy && now && Math.hypot(now.x - a.x, now.y - a.y) > 6) {
      // Faint ghost of the body at the state's day.
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawGlow(ctx, BODIES[b].color, a.x, a.y, a.r * 3, 0.5);
      drawBody(ctx, this.dpr, b, a.x, a.y, a.r, this.lightAngle(F, a.x, a.y), false);
      ctx.restore();
    }
    const hitKey = end ? `end:${end.branchId}` : '';
    const hot = !!end && this.hover?.key === hitKey;
    const tooltip: TipLine[] | undefined = end ? [
      { text: `${end.name}: ${describeState(s)}`, bold: true },
      { text: `Since ${formatDay(s.day, F.startISO)}`, color: COLORS.muted },
      { text: 'Click to add the next maneuver', color: COLORS.muted },
    ] : undefined;

    // Clickable end states pulse slowly (subtle).
    let pulse = 0;
    if (end) {
      this.animating = true;
      pulse = 0.5 + 0.5 * Math.sin(this.time * 2.4);
    }

    ctx.save();
    ctx.globalAlpha = hot ? 1 : end ? alpha * (0.8 + 0.2 * pulse) : alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = hot ? 16 : end ? 6 + 6 * pulse : 4;

    if (s.kind === 'orbit') {
      let r = a.r + orbitRingOffset(b, s.altitudeKm);
      if (a.isCenter) r = Math.max(r, radiusPx(proj, BODIES[b].radiusKm + s.altitudeKm));
      r += 4 * this.stackCount(F, `ring:${a.key}:${Math.round(r)}`);
      ctx.lineWidth = end ? (hot ? 2.4 : 1.6) : 1;
      ctx.setLineDash(end ? [5, 3] : []);
      ctx.beginPath();
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (end) {
        // Soft echo ring breathing outward with the pulse.
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = (hot ? 0.35 : 0.22) * (1 - pulse * 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, r + 3 + 2 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // "+" badge on the ring to hint that it is clickable.
        const bx = a.x + r * Math.SQRT1_2;
        const by = a.y - r * Math.SQRT1_2;
        this.plusBadge(ctx, bx, by, color);
        this.hits.push({
          key: hitKey, priority: 2, action: { kind: 'endState', branchId: end.branchId }, tooltip,
          contains: (x, y) => {
            const d = Math.hypot(x - a.x, y - a.y);
            // Band around the ring, but leave the body disc itself clickable.
            return (d > a.r + 1 && Math.abs(d - r) <= RING_HIT_BAND_PX) || Math.hypot(x - bx, y - by) <= 8;
          },
        });
      }
    } else if (s.kind === 'surface') {
      const n = this.stackCount(F, `pin:${a.key}`);
      const ang = -Math.PI / 2 + n * 0.45;
      const ux = Math.cos(ang);
      const uy = Math.sin(ang);
      const bx = a.x + ux * a.r;
      const by = a.y + uy * a.r;
      const len = end ? 11 : 8;
      const hx = bx + ux * len;
      const hy = by + uy * len;
      ctx.lineWidth = end ? 1.6 : 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, end ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (end) {
        ctx.strokeStyle = COLORS.bg;
        ctx.lineWidth = 1;
        ctx.stroke();
        this.plusBadge(ctx, hx + 8, hy - 6, color);
        this.hits.push({
          key: hitKey, priority: 2, action: { kind: 'endState', branchId: end.branchId }, tooltip,
          contains: (x, y) => Math.hypot(x - hx, y - hy) <= 11 || Math.hypot(x - (hx + 8), y - (hy - 6)) <= 8,
        });
      }
    } else if (s.kind === 'approach') {
      const v = s.vInf;
      const len = Math.hypot(v.x, v.y);
      // Screen direction of travel (y flipped); default: arriving from the left.
      const dx = len > 0 ? v.x / len : 1;
      const dy = len > 0 ? -v.y / len : 0;
      const n = this.stackCount(F, `chev:${a.key}`);
      const dist = a.r + 12 + n * 9;
      const cx = a.x - dx * dist;
      const cy = a.y - dy * dist;
      const px = -dy;
      const py = dx;
      const sz = end ? 5.5 : 4;
      ctx.lineWidth = end ? 2 : 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - dx * sz * 0.6 + px * sz, cy - dy * sz * 0.6 + py * sz);
      ctx.lineTo(cx + dx * sz * 0.6, cy + dy * sz * 0.6);
      ctx.lineTo(cx - dx * sz * 0.6 - px * sz, cy - dy * sz * 0.6 - py * sz);
      ctx.stroke();
      if (end) {
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        this.hits.push({
          key: hitKey, priority: 2, action: { kind: 'endState', branchId: end.branchId }, tooltip,
          contains: (x, y) => Math.hypot(x - cx, y - cy) <= 9 + RING_HIT_BAND_PX,
        });
      }
    }
    ctx.restore();
  }

  /** "+" badge as a small glass circle. */
  private plusBadge(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.85);
    ctx.setLineDash([]);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLORS.glass;
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = withAlpha(color, 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x, y + 3);
    ctx.stroke();
    ctx.restore();
  }

  // ----------------------------------------------------------- markers

  private drawMarkers(F: Frame, ev: Evaluation) {
    const { ui, center, proj, day } = F;
    const pending: PendingMarker[] = [];
    ev.branches.forEach((br, i) => {
      const failIdx = failIndexOf(br);
      const dim = br.branchId !== ui.selectedBranchId;
      br.maneuvers.forEach((m, mi) => {
        const failed = mi >= failIdx;
        const t = m.trajectory;
        const b = stateBody(m.stateBefore);
        const a = b ? this.anchor(F, b, day) : null;
        if (t && t.centerBody === center && t.points.length > 0 && finite(t.points[0])) {
          const p = toScreen(proj, t.points[0]);
          // Starts on top of its body (e.g. departing at the shown day): join the body's row instead.
          if (!a || Math.hypot(p.x - a.x, p.y - a.y) > a.r + 6) {
            pending.push({ m, branchIndex: i, failed, dim, x: p.x, y: p.y });
            return;
          }
        }
        if (!a) return;
        pending.push({ m, branchIndex: i, failed, dim, x: a.x, y: a.y, anchorKey: a.key, anchor: a });
      });
    });

    // Body-anchored markers: a centred row above their body.
    const groups = new Map<string, PendingMarker[]>();
    for (const p of pending) if (p.anchorKey) groups.set(p.anchorKey, [...(groups.get(p.anchorKey) ?? []), p]);
    for (const list of groups.values()) {
      const a = list[0].anchor!;
      this.ensureProxyDrawn(F, a);
      const y = a.y - a.r - (a.proxy ? 10 : 24);
      list.forEach((p, k) => {
        p.x = a.x + (k - (list.length - 1) / 2) * 14;
        p.y = y;
      });
    }
    // Free markers: nudge away from earlier ones.
    const placed: Vec2[] = pending.filter((p) => p.anchorKey).map((p) => ({ x: p.x, y: p.y }));
    for (const p of pending) {
      if (p.anchorKey) continue;
      let guard = 0;
      while (placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 11) && guard++ < 12) p.x += 13;
      placed.push({ x: p.x, y: p.y });
    }

    // Selected/hovered last so they draw on top.
    const focus = ui.hoverManeuverId ?? ui.selectedManeuverId;
    pending.sort((a, b) => Number(a.m.maneuverId === focus) - Number(b.m.maneuverId === focus) || Number(b.dim) - Number(a.dim));
    for (const p of pending) this.drawMarker(F, p);
  }

  private drawMarker(F: Frame, p: PendingMarker) {
    const { ctx, ui } = F;
    const { m } = p;
    const key = `mnv:${m.maneuverId}`;
    const hot = this.hover?.key === key || ui.hoverManeuverId === m.maneuverId;
    const selected = ui.selectedManeuverId === m.maneuverId;
    const color = p.failed ? COLORS.fail : branchColor(p.branchIndex);
    const sev = worstSeverity(m);
    const big = selected || hot;
    const dot = big ? 4 : 3.2;

    // Point of interest: bright dot with a glow and faint concentric rings.
    ctx.save();
    ctx.globalAlpha = p.dim && !big ? 0.6 : 1;
    drawGlow(ctx, color, p.x, p.y, hot ? 22 : big ? 18 : 13, hot ? 0.75 : 0.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha *= big ? 0.75 : 0.45;
    ctx.beginPath();
    ctx.arc(p.x, p.y, big ? 7.5 : 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.45;
    ctx.beginPath();
    ctx.arc(p.x, p.y, big ? 11 : 9.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = p.dim && !big ? 0.6 : 1;
    if (selected) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowColor = color;
    ctx.shadowBlur = hot ? 12 : 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, dot, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, dot * 0.42, 0, Math.PI * 2);
    ctx.fill();

    if (sev) {
      // Severity badge: small round "!" at the marker's top-right.
      const bx = p.x + 7.5;
      const by = p.y - 7.5;
      const bc = sev === 'error' ? COLORS.fail : COLORS.warn;
      ctx.globalAlpha = 1;
      ctx.shadowColor = bc;
      ctx.shadowBlur = 6;
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.arc(bx, by, 4.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = COLORS.bg;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(bx - 0.65, by - 2.6, 1.3, 3.2);
      ctx.fillRect(bx - 0.65, by + 1.3, 1.3, 1.3);
    }
    ctx.restore();

    const tip: TipLine[] = [{ text: m.label, bold: true }];
    let when = formatDay(m.startDay, F.startISO);
    if (m.endDay - m.startDay >= 1) when += ` → ${formatDay(m.endDay, F.startISO)}`;
    tip.push({ text: `Δv ${formatDv(m.dvRequiredMs)} · ${when}`, color: COLORS.muted });
    for (const issue of m.issues.slice(0, 4)) {
      if (issue.severity === 'info') continue;
      tip.push({ text: `⚠ ${issue.message}`, color: issue.severity === 'error' ? COLORS.fail : COLORS.warn });
    }
    if (F.planning) tip.push({ text: 'Click to edit', color: COLORS.muted });
    const x = p.x;
    const y = p.y;
    this.hits.push({
      key, priority: 3, tooltip: tip,
      action: { kind: 'maneuver', maneuverId: m.maneuverId, branchId: m.branchId, x: x + 10, y },
      contains: (hx, hy) => Math.abs(hx - x) + Math.abs(hy - y) <= 10,
    });
  }

  // ------------------------------------------------------- playthrough

  private drawSpacecraft(F: Frame, ev: Evaluation) {
    const { ctx, center, proj, day, game } = F;
    ev.branches.forEach((br, i) => {
      let pos: { centerBody: BodyId; pos: Vec2 } | null = null;
      try {
        pos = spacecraftPositionAt(ev, br.branchId, day);
      } catch {
        pos = null;
      }
      if (!pos || !finite(pos.pos)) return;
      let p: Vec2 | null = null;
      if (pos.centerBody === center) {
        p = toScreen(proj, pos.pos);
      } else {
        const a = this.anchor(F, pos.centerBody, day);
        if (!a) return;
        const len = Math.hypot(pos.pos.x, pos.pos.y);
        const d = a.r + 7;
        p = len > 0 ? { x: a.x + (pos.pos.x / len) * d, y: a.y - (pos.pos.y / len) * d } : { x: a.x, y: a.y - d };
      }
      const color = branchColor(i);
      ctx.save();
      drawGlow(ctx, color, p.x, p.y, 26, 0.7);
      drawStreak(ctx, color, p.x, p.y, 16, 1.2, 0.6);
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = FONT_LABEL;
      setSpacing(ctx, LABEL_SPACING);
      ctx.fillStyle = COLORS.text;
      const name = game.plan.branches.find((b) => b.id === br.branchId)?.name ?? '';
      ctx.fillText(name.toUpperCase(), p.x + 9, p.y - 8);
      ctx.restore();
    });
  }

  // --------------------------------------------------------------- HUD

  private drawHud(F: Frame) {
    const { ctx, center, ui } = F;
    const fr = this.free();
    const left = fr.x + 16;
    let x = left;
    const y = fr.y + 16;
    const rowH = 28;
    ctx.save();
    ctx.textBaseline = 'middle';
    if (center !== 'sun') {
      // Glass pill back button.
      const text = '◀ Solar system';
      ctx.font = FONT_BOLD;
      const w = ctx.measureText(text).width + 26;
      const h = rowH;
      const hot = this.hover?.key === 'back';
      ctx.save();
      roundRectPath(ctx, x, y, w, h, h / 2);
      ctx.shadowColor = hot ? withAlpha(COLORS.accent, 0.45) : 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = hot ? 14 : 10;
      ctx.fillStyle = hot ? COLORS.glassHot : COLORS.glass;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = hot ? COLORS.glassBorderHot : COLORS.glassBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = hot ? '#ffffff' : COLORS.text;
      ctx.fillText(text, x + 13, y + h / 2 + 0.5);
      const bx = x;
      this.hits.push({
        key: 'back', priority: 10, action: { kind: 'back' },
        contains: (px, py) => px >= bx && px <= bx + w && py >= y && py <= y + h,
      });
      x += w + 14;
    }
    ctx.font = FONT_TITLE;
    setSpacing(ctx, '0.5px');
    ctx.fillStyle = COLORS.text;
    ctx.shadowColor = withAlpha(COLORS.accent, 0.35);
    ctx.shadowBlur = 12;
    const title = center === 'sun' ? 'Solar system' : `${BODIES[center].name} system`;
    ctx.fillText(title, x, y + rowH / 2 + 1);
    ctx.shadowBlur = 0;

    ctx.font = FONT_HUD;
    setSpacing(ctx, LABEL_SPACING);
    const mode = ui.playthrough ? 'Playthrough' : ui.mapDay !== null ? 'Positions' : F.game.phase === 'planning' ? 'Launch day' : 'Today';
    const dateY = y + rowH + 16;
    // Small cyan status dot before the date line.
    ctx.fillStyle = ui.playthrough ? COLORS.accent : withAlpha(COLORS.accent, 0.7);
    ctx.beginPath();
    ctx.arc(left + 3, dateY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`${mode} · ${formatDay(F.day, F.startISO)}`.toUpperCase(), left + 12, dateY);

    // Hint, wrapped to the free area.
    const hint = center === 'sun'
      ? 'Scroll to zoom · drag to pan · double-click to reset · click Earth, Mars or Jupiter for its moons'
      : 'Scroll to zoom · drag to pan · double-click to reset';
    ctx.font = FONT_HINT;
    setSpacing(ctx, '0.3px');
    ctx.globalAlpha = 0.6;
    const maxW = Math.max(160, fr.w - 32);
    const lines: string[] = [];
    let cur = '';
    for (const part of hint.split(' · ')) {
      const next = cur ? `${cur} · ${part}` : part;
      if (cur && ctx.measureText(next).width > maxW) {
        lines.push(cur);
        cur = part;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    lines.forEach((l, i) => ctx.fillText(l, left, dateY + 18 + i * 14));
    ctx.restore();
  }

  private drawTooltip(F: Frame) {
    const tip = this.hover?.tooltip;
    if (!tip || !this.mouse || this.drag?.moved) return;
    const { ctx } = F;
    ctx.save();
    const lineH = 17;
    let w = 0;
    for (const l of tip) {
      ctx.font = l.bold ? FONT_BOLD : FONT;
      w = Math.max(w, ctx.measureText(l.text).width);
    }
    const pad = 10;
    const bw = w + pad * 2;
    const bh = tip.length * lineH + pad * 2 - 4;
    // Keep inside the free area where possible, else inside the canvas.
    const fr = this.free();
    const m = 6;
    const minX = bw <= fr.w - 2 * m ? fr.x + m : m;
    const maxX = bw <= fr.w - 2 * m ? fr.x + fr.w - m : this.w - m;
    const minY = bh <= fr.h - 2 * m ? fr.y + m : m;
    const maxY = bh <= fr.h - 2 * m ? fr.y + fr.h - m : this.h - m;
    let x = this.mouse.x + 14;
    let y = this.mouse.y + 16;
    if (x + bw > maxX) x = this.mouse.x - bw - 10;
    if (y + bh > maxY) y = this.mouse.y - bh - 10;
    x = clamp(x, minX, Math.max(minX, maxX - bw));
    y = clamp(y, minY, Math.max(minY, maxY - bh));
    roundRectPath(ctx, x, y, bw, bh, 10);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = COLORS.glass;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = COLORS.glassBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textBaseline = 'top';
    tip.forEach((l, i) => {
      ctx.font = l.bold ? FONT_BOLD : FONT;
      ctx.fillStyle = l.color ?? COLORS.text;
      ctx.fillText(l.text, x + pad, y + pad + i * lineH);
    });
    ctx.restore();
  }
}
