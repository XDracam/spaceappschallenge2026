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
  BODY_PX, COLORS, DRAG_THRESHOLD_PX, FONT, FONT_BOLD, FONT_TITLE, MAX_ZOOM, MIN_ZOOM, RING_HIT_BAND_PX, branchColor,
} from './style';

// ------------------------------------------------------------------ types

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

const STARS = (() => {
  const rnd = mulberry32(20261114);
  return Array.from({ length: 260 }, () => ({
    fx: rnd(), fy: rnd(), size: rnd() < 0.85 ? 0.6 : 1.1, alpha: 0.15 + rnd() * 0.45,
  }));
})();

const BELT = (() => {
  const rnd = mulberry32(7);
  const au = 149_597_870.7;
  return Array.from({ length: 420 }, () => ({ angle: rnd() * Math.PI * 2, rKm: (2.15 + rnd() * 1.15) * au, alpha: 0.08 + rnd() * 0.18 }));
})();

function finite(v: Vec2): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
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

    this.request();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
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
    const cx = this.w / 2;
    const cy = this.h / 2;
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

    const fitPx = Math.max(40, Math.min(this.w, this.h) * 0.43);
    const proj: Projection = {
      ox: this.w / 2 + this.panX,
      oy: this.h / 2 + this.panY,
      scale: fitScale(center, fitPx) * this.zoom,
    };
    const day = ui.playthrough?.day ?? ui.mapDay ?? clock.day;
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
    const { ctx } = F;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#ffffff';
    for (const s of STARS) {
      const x = (((s.fx * this.w + this.panX * 0.04) % this.w) + this.w) % this.w;
      const y = (((s.fy * this.h + this.panY * 0.04) % this.h) + this.h) % this.h;
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(x, y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  private viewBodies(center: BodyId) {
    return childrenOf(center);
  }

  private drawOrbits(F: Frame) {
    const { ctx, proj, center } = F;
    if (center === 'sun') {
      // Asteroid belt speckle.
      ctx.fillStyle = COLORS.muted;
      for (const p of BELT) {
        const s = toScreen(proj, { x: Math.cos(p.angle) * p.rKm, y: Math.sin(p.angle) * p.rKm });
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    const hoverBody = this.hover?.action.kind === 'body' ? this.hover.action.body : null;
    for (const b of this.viewBodies(center)) {
      const r = radiusPx(proj, b.orbitRadiusKm);
      const small = BODY_PX[b.id] <= 3;
      const hot = hoverBody === b.id || this.selectedBody === b.id;
      ctx.strokeStyle = hot ? COLORS.orbitHover : COLORS.orbit;
      ctx.lineWidth = hot ? 1.5 : 1;
      ctx.globalAlpha = small && !hot ? 0.7 : 1;
      ctx.setLineDash(small ? [2, 4] : []);
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
      ctx.shadowColor = cb.color;
      ctx.shadowBlur = 24;
    }
    const grad = ctx.createRadialGradient(c.x - c.r * 0.35, c.y - c.r * 0.35, c.r * 0.1, c.x, c.y, c.r);
    grad.addColorStop(0, withAlpha(cb.color, 1));
    grad.addColorStop(1, center === 'sun' ? withAlpha(cb.color, 0.9) : withAlpha(cb.color, 0.55));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (center === 'sun') this.label(F, cb.name, c.x + c.r + 5, c.y + 4, false);
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
      if (hot) {
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (this.selectedBody === b.id) {
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.label(F, b.name, a.x + a.r + 5, a.y + 4, hot);
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
    ctx.font = FONT;
    ctx.fillStyle = hot ? COLORS.text : COLORS.muted;
    ctx.fillText(text, x, y);
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
        ctx.save();
        ctx.globalAlpha = selected || isFocus ? 1 : 0.5;
        ctx.strokeStyle = failed ? COLORS.fail : branchColor(i);
        ctx.lineWidth = isFocus ? 2.6 : selected ? 1.8 : 1.4;
        ctx.setLineDash(failed ? [6, 5] : []);
        if (isFocus) {
          ctx.shadowColor = failed ? COLORS.fail : branchColor(i);
          ctx.shadowBlur = 8;
        }
        this.tracePolyline(F, t.points);
        ctx.stroke();
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
      ctx.strokeStyle = BODIES[g.body].color;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.9;
      ctx.font = FONT;
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(`${BODIES[g.body].name} at ${g.text} · ${formatDay(g.day, F.startISO)}`, a.x + a.r + 6, a.y - 6);
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
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = BODIES[b].color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const hitKey = end ? `end:${end.branchId}` : '';
    const hot = !!end && this.hover?.key === hitKey;
    const tooltip: TipLine[] | undefined = end ? [
      { text: `${end.name}: ${describeState(s)}`, bold: true },
      { text: `Since ${formatDay(s.day, F.startISO)}`, color: COLORS.muted },
      { text: 'Click to add the next maneuver', color: COLORS.muted },
    ] : undefined;

    ctx.save();
    ctx.globalAlpha = hot ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (hot) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }

    if (s.kind === 'orbit') {
      let r = a.r + orbitRingOffset(b, s.altitudeKm);
      if (a.isCenter) r = Math.max(r, radiusPx(proj, BODIES[b].radiusKm + s.altitudeKm));
      r += 4 * this.stackCount(F, `ring:${a.key}:${Math.round(r)}`);
      ctx.lineWidth = end ? (hot ? 2.6 : 1.8) : 1;
      ctx.setLineDash(end ? [5, 3] : []);
      ctx.beginPath();
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (end) {
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

  private plusBadge(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.bg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 2.8, y);
    ctx.lineTo(x + 2.8, y);
    ctx.moveTo(x, y - 2.8);
    ctx.lineTo(x, y + 2.8);
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
    const size = selected || hot ? 6.5 : 5;

    ctx.save();
    ctx.globalAlpha = p.dim && !hot && !selected ? 0.6 : 1;
    if (hot) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = selected ? '#ffffff' : COLORS.bg;
    ctx.lineWidth = selected ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - size);
    ctx.lineTo(p.x + size, p.y);
    ctx.lineTo(p.x, p.y + size);
    ctx.lineTo(p.x - size, p.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    if (selected) ctx.stroke();
    ctx.shadowBlur = 0;

    if (sev) {
      // Warning badge: small triangle with "!" at the marker's top-right.
      const bx = p.x + 7;
      const by = p.y - 7;
      ctx.fillStyle = sev === 'error' ? COLORS.fail : COLORS.warn;
      ctx.strokeStyle = COLORS.bg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, by - 5);
      ctx.lineTo(bx + 5, by + 4);
      ctx.lineTo(bx - 5, by + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(bx - 0.6, by - 2, 1.2, 3.2);
      ctx.fillRect(bx - 0.6, by + 2, 1.2, 1.2);
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
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = FONT;
      ctx.fillStyle = COLORS.text;
      const name = game.plan.branches.find((b) => b.id === br.branchId)?.name ?? '';
      ctx.fillText(name, p.x + 8, p.y - 7);
      ctx.restore();
    });
  }

  // --------------------------------------------------------------- HUD

  private drawHud(F: Frame) {
    const { ctx, center, ui } = F;
    let x = 12;
    const y = 12;
    ctx.save();
    ctx.textBaseline = 'middle';
    if (center !== 'sun') {
      const text = '◀ Solar system';
      ctx.font = FONT;
      const w = ctx.measureText(text).width + 18;
      const h = 24;
      const hot = this.hover?.key === 'back';
      roundRectPath(ctx, x, y, w, h, 6);
      ctx.fillStyle = hot ? '#1c2740' : COLORS.panel;
      ctx.fill();
      ctx.strokeStyle = hot ? COLORS.orbitHover : COLORS.panelBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.fillText(text, x + 9, y + h / 2 + 0.5);
      const bx = x;
      this.hits.push({
        key: 'back', priority: 10, action: { kind: 'back' },
        contains: (px, py) => px >= bx && px <= bx + w && py >= y && py <= y + h,
      });
      x += w + 12;
    }
    ctx.font = FONT_TITLE;
    ctx.fillStyle = COLORS.text;
    const title = center === 'sun' ? 'Solar system' : `${BODIES[center].name} system`;
    ctx.fillText(title, x, y + 12.5);
    ctx.font = FONT;
    ctx.fillStyle = COLORS.muted;
    const mode = ui.playthrough ? 'Playthrough' : ui.mapDay !== null ? 'Positions' : 'Today';
    ctx.fillText(`${mode} · ${formatDay(F.day, F.startISO)}`, 12, y + 40);

    // Hint line, bottom-left.
    ctx.textBaseline = 'alphabetic';
    const hint = center === 'sun'
      ? 'Scroll to zoom · drag to pan · double-click to reset · click Earth, Mars or Jupiter for its moons'
      : 'Scroll to zoom · drag to pan · double-click to reset';
    ctx.globalAlpha = 0.75;
    ctx.fillText(hint, 12, this.h - 10);
    ctx.restore();
  }

  private drawTooltip(F: Frame) {
    const tip = this.hover?.tooltip;
    if (!tip || !this.mouse || this.drag?.moved) return;
    const { ctx } = F;
    ctx.save();
    const lineH = 16;
    let w = 0;
    for (const l of tip) {
      ctx.font = l.bold ? FONT_BOLD : FONT;
      w = Math.max(w, ctx.measureText(l.text).width);
    }
    const pad = 8;
    const bw = w + pad * 2;
    const bh = tip.length * lineH + pad * 2 - 4;
    let x = this.mouse.x + 14;
    let y = this.mouse.y + 16;
    if (x + bw > this.w - 4) x = this.mouse.x - bw - 10;
    if (y + bh > this.h - 4) y = this.mouse.y - bh - 10;
    x = Math.max(4, x);
    y = Math.max(4, y);
    roundRectPath(ctx, x, y, bw, bh, 6);
    ctx.fillStyle = COLORS.panel;
    ctx.fill();
    ctx.strokeStyle = COLORS.panelBorder;
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
