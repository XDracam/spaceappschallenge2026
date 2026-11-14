import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { BodyId, FlightState } from '../model/types';
import { actions, uiStore, useEvaluation, usePlanner } from '../state/store';
import { transferGrid, transferRanges } from '../physics';
import type { TransferGrid } from '../physics';
import { findManeuver } from '../model/rocketUtils';
import { DAYS_PER_MONTH, dayToDate, formatDay, formatDuration } from '../model/units';
import { CloseIcon, bodyName, clamp, findResult, localUi, mapCentre } from './common';

const NX = 60;
const NY = 40;
const CW = 8;
const CH = 6;
const W = NX * CW;
const H = NY * CH;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STOPS: [number, [number, number, number]][] = [
  [0, [143, 247, 227]],
  [0.3, [47, 179, 196]],
  [0.65, [63, 91, 184]],
  [1, [42, 19, 64]],
];

function colour(t: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (t <= p1) {
      const f = (t - p0) / (p1 - p0);
      return [0, 1, 2].map((k) => Math.round(c0[k] + f * (c1[k] - c0[k]))) as [number, number, number];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function scaleOf(grid: TransferGrid): { lo: number; hi: number } | null {
  let lo = Infinity, hi = -Infinity;
  for (const row of grid.dvMs) for (const v of row) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (!Number.isFinite(lo)) return null;
  hi = lo > 0 ? Math.min(hi, lo * 3) : hi;
  if (hi <= lo) hi = lo + 1;
  return { lo, hi };
}

/** Always km/s with 2 decimals, so every number in the popups reads the same. */
export const kms = (ms: number) => `${(ms / 1000).toFixed(2)} km/s`;

type OrbitState = Extract<FlightState, { kind: 'orbit' }>;
export interface GridPoint { departDay: number; travelDays: number; dvMs: number; ix: number; iy: number }

/** Cheapest cell arriving by `deadline` (null if none). */
export function bestBefore(g: TransferGrid, deadline: number): GridPoint | null {
  let out: GridPoint | null = null;
  g.travelDays.forEach((t, iy) => g.departDays.forEach((d, ix) => {
    const v = g.dvMs[iy][ix];
    if (d + t <= deadline && Number.isFinite(v) && (!out || v < out.dvMs)) out = { departDay: d, travelDays: t, dvMs: v, ix, iy };
  }));
  return out;
}

/** First departure column whose cheapest (deadline-respecting) cell is within 5 % of the best. */
export function earliestGood(g: TransferGrid, deadline: number): GridPoint | null {
  const best = bestBefore(g, deadline);
  if (!best) return null;
  for (let ix = 0; ix < g.departDays.length; ix++) {
    let col: GridPoint | null = null;
    for (let iy = 0; iy < g.travelDays.length; iy++) {
      const v = g.dvMs[iy][ix];
      if (g.departDays[ix] + g.travelDays[iy] <= deadline && Number.isFinite(v) && (!col || v < col.dvMs)) {
        col = { departDay: g.departDays[ix], travelDays: g.travelDays[iy], dvMs: v, ix, iy };
      }
    }
    if (col && col.dvMs <= best.dvMs * 1.05) return col;
  }
  return best;
}

/** Whole-transfer cost (leave + enter orbit) for one departure day / travel time. */
export function transferTotal(from: OrbitState, target: BodyId, departDay: number, travelDays: number): number {
  return transferGrid(from, target, [departDay, departDay], [travelDays, travelDays], 1, 1).best.dvMs;
}

/**
 * Cheapest departure / travel time arriving by the deadline (falls back to the overall cheapest).
 * Coarse grid like the heat map, then a finer grid around the winner.
 */
export function pickCheapest(from: OrbitState, target: BodyId, deadline: number): { departDay: number; travelDays: number } | null {
  const r = transferRanges(from.body, target, from.day);
  const g = transferGrid(from, target, r.depart, r.travel, NX, NY);
  const limit = bestBefore(g, deadline) ? deadline : Infinity;
  // Earliest window within 5 % of the cheapest (avoids jumping years ahead to save a few m/s).
  const coarse = earliestGood(g, limit) ?? bestBefore(g, limit);
  if (!coarse) return null;
  const dx = (r.depart[1] - r.depart[0]) / (NX - 1);
  const dy = (r.travel[1] - r.travel[0]) / (NY - 1);
  const fine = transferGrid(from, target,
    [Math.max(from.day, coarse.departDay - dx), coarse.departDay + dx],
    [Math.max(1, coarse.travelDays - dy), coarse.travelDays + dy], 15, 15);
  const f = bestBefore(fine, limit);
  const pt = f && f.dvMs < coarse.dvMs ? f : coarse;
  const departDay = Math.max(Math.ceil(from.day), Math.round(pt.departDay));
  let travelDays = Math.max(1, Math.round(pt.travelDays));
  if (departDay + travelDays > limit) travelDays = Math.max(1, Math.floor(limit - departDay));
  return { departDay, travelDays };
}

export function backToEdit(maneuverId: string) {
  uiStore.update((u) => {
    u.popup = { kind: 'maneuverEdit', maneuverId, screen: localUi.get().lastEditScreen ?? mapCentre() };
  });
}

export function Heatmap({ maneuverId }: { maneuverId: string }) {
  const plan = usePlanner((g) => g.plan);
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const deadline = usePlanner((g) => g.mission.completionDeadlineDay);
  const ev = useEvaluation();
  const found = findManeuver(plan, maneuverId);
  const m = found?.maneuver.type === 'transfer' ? found.maneuver : undefined;
  const result = findResult(ev, maneuverId);
  const before = result?.stateBefore;
  const from = before?.kind === 'orbit' ? (before as OrbitState) : undefined;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ ix: number; iy: number } | null>(null);

  const ranges = from && m ? transferRanges(from.body, m.target, from.day) : null;
  const key = from && m ? `${from.body}|${from.altitudeKm}|${from.day}|${m.target}` : '';
  const grid = useMemo(() => {
    if (!from || !m || !ranges) return null;
    return transferGrid(from, m.target, ranges.depart, ranges.travel, NX, NY);
  }, [key]);
  const sc = grid ? scaleOf(grid) : null;
  const best = useMemo(() => (grid ? bestBefore(grid, deadline) : null), [grid, deadline]);
  const early = useMemo(() => (grid ? earliestGood(grid, deadline) : null), [grid, deadline]);
  const sameMarker = !!best && !!early && best.ix === early.ix && best.iy === early.iy;

  // Keep the map showing the departure day.
  useEffect(() => {
    if (m) uiStore.update((u) => { u.mapDay = m.departDay; });
  }, [m?.departDay]);

  const xOf = (d: number) => (grid ? ((d - grid.departDays[0]) / ((grid.departDays[NX - 1] - grid.departDays[0]) || 1)) * (W - CW) + CW / 2 : 0);
  const yOf = (t: number) => (grid ? H - (((t - grid.travelDays[0]) / ((grid.travelDays[NY - 1] - grid.travelDays[0]) || 1)) * (H - CH) + CH / 2) : 0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !grid) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const img = ctx.createImageData(W, H);
    for (let iy = 0; iy < NY; iy++) {
      for (let ix = 0; ix < NX; ix++) {
        const v = grid.dvMs[iy]?.[ix];
        if (v === undefined || !Number.isFinite(v) || !sc) continue;
        const [r, g, b] = colour(clamp((v - sc.lo) / (sc.hi - sc.lo), 0, 1));
        const late = grid.departDays[ix] + grid.travelDays[iy] > deadline;
        // After the deadline: greyed out with diagonal hatching.
        const grey = Math.round((r + g + b) / 3 * 0.35 + 30);
        const y0 = H - (iy + 1) * CH;
        for (let y = y0; y < y0 + CH; y++) {
          for (let x = ix * CW; x < (ix + 1) * CW; x++) {
            const o = (y * W + x) * 4;
            if (late) {
              const stripe = (x + y) % 6 < 2;
              const c = stripe ? 92 : grey;
              img.data[o] = c; img.data[o + 1] = c + 4; img.data[o + 2] = c + 14;
            } else {
              img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b;
            }
            img.data[o + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // Deadline line: arrival = deadline.
    const d0 = grid.departDays[0], d1 = grid.departDays[NX - 1];
    ctx.strokeStyle = 'rgba(255, 200, 87, 0.85)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xOf(d0), yOf(deadline - d0));
    ctx.lineTo(xOf(d1), yOf(deadline - d1));
    ctx.stroke();
    ctx.setLineDash([]);

    const label = (text: string, x: number, y: number) => {
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      const w = ctx.measureText(text).width;
      const lx = x + 10 + w > W - 2 ? x - 10 - w : x + 10;
      const ly = clamp(y + 4, 12, H - 4);
      ctx.fillStyle = 'rgba(5, 8, 15, 0.75)';
      ctx.fillRect(lx - 3, ly - 11, w + 6, 15);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, lx, ly);
    };

    // Earliest good window: diamond.
    if (early && !sameMarker) {
      const ex = xOf(early.departDay), ey = yOf(early.travelDays);
      ctx.strokeStyle = '#3fe0a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex, ey - 6); ctx.lineTo(ex + 6, ey); ctx.lineTo(ex, ey + 6); ctx.lineTo(ex - 6, ey); ctx.closePath();
      ctx.stroke();
      label('Earliest good', ex, ey);
    }
    // Best point (before the deadline).
    if (best) {
      const bx = xOf(best.departDay), by = yOf(best.travelDays);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 8, by); ctx.lineTo(bx - 3, by); ctx.moveTo(bx + 3, by); ctx.lineTo(bx + 8, by);
      ctx.stroke();
      label(sameMarker ? 'Cheapest & earliest' : 'Cheapest', bx, by);
    }
    // Crosshair at the maneuver's current values.
    if (m) {
      const cx = xOf(m.departDay), cy = yOf(m.travelDays);
      ctx.strokeStyle = 'rgba(255, 166, 87, 0.95)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.moveTo(0, cy); ctx.lineTo(W, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffa657';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [grid, m?.departDay, m?.travelDays, deadline]);

  const cellAt = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    return { ix: clamp(Math.floor(x / CW), 0, NX - 1), iy: clamp(NY - 1 - Math.floor(y / CH), 0, NY - 1) };
  };

  const fromName = from ? bodyName(from.body) : 'this';
  const toName = m ? bodyName(m.target) : 'the target';
  const head = (
    <div class="popup-head">
      <div class="popup-title">
        <b>Fuel needed for this transfer <span class="hm-title-sub">(leaving {fromName} orbit + entering {toName} orbit)</span></b>
        <div class="muted small">Each square is a departure date and travel time. Click a square to use it.</div>
      </div>
      <button class="btn icon-btn ghost" title="Close (Esc)" onClick={() => backToEdit(maneuverId)}><CloseIcon /></button>
    </div>
  );

  if (!m || !from || !grid) {
    return (
      <div class="modal-backdrop" onClick={() => backToEdit(maneuverId)}>
        <div class="modal heatmap" onClick={(e) => e.stopPropagation()}>
          {head}
          <p class="empty">{!m ? 'Not a transfer.' : 'The departure orbit is not computed yet, so no heat map is available.'}</p>
        </div>
      </div>
    );
  }

  // Axis ticks.
  const d0 = grid.departDays[0], d1 = grid.departDays[NX - 1];
  const monthTicks: { day: number; label: string }[] = [];
  {
    let prevMonth = -1;
    const all: { day: number; label: string }[] = [];
    for (let d = Math.ceil(d0); d <= d1; d++) {
      const dt = dayToDate(d, startISO);
      const mm = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
      if (mm !== prevMonth) {
        if (prevMonth !== -1) all.push({ day: d, label: dt.getUTCMonth() === 0 ? String(dt.getUTCFullYear()) : MONTHS[dt.getUTCMonth()] });
        prevMonth = mm;
      }
    }
    const every = Math.max(1, Math.ceil(all.length / 10));
    all.forEach((t, i) => { if (i % every === 0 || t.label.length === 4) monthTicks.push(t); });
  }
  const t0 = grid.travelDays[0], t1 = grid.travelDays[NY - 1];
  const mo0 = t0 / DAYS_PER_MONTH, mo1 = t1 / DAYS_PER_MONTH;
  const moStep = [1, 2, 3, 6, 12, 24].find((s) => (mo1 - mo0) / s <= 6) ?? 48;
  const travelTicks: number[] = [];
  for (let mo = Math.ceil(mo0 / moStep) * moStep; mo <= mo1; mo += moStep) travelTicks.push(mo);

  const hv = hover ? grid.dvMs[hover.iy]?.[hover.ix] : undefined;
  const hoverArrive = hover ? grid.departDays[hover.ix] + grid.travelDays[hover.iy] : 0;
  const currentTotal = transferTotal(from, m.target, m.departDay, m.travelDays);
  const currentLate = m.departDay + m.travelDays > deadline;
  const leaving = result?.dvRequiredMs;
  const set = (p: { departDay: number; travelDays: number }) =>
    actions.updateManeuver(m.id, { departDay: Math.max(Math.ceil(from.day), Math.round(p.departDay)), travelDays: Math.max(1, Math.round(p.travelDays)) });

  return (
    <div class="modal-backdrop" onClick={() => backToEdit(maneuverId)}>
      <div class="modal heatmap" onClick={(e) => e.stopPropagation()}>
        {head}
        <div class="hm-body">
          <div class="hm-yaxis">
            <span class="hm-axis-title">Travel time (months)</span>
            {travelTicks.map((mo) => (
              <span class="hm-ytick num" style={{ top: `${(yOf(mo * DAYS_PER_MONTH) / H) * 100}%` }}>{mo}</span>
            ))}
          </div>
          <div class="hm-plot">
            <canvas ref={canvasRef} width={W} height={H} class="hm-canvas"
              onMouseMove={(e) => setHover(cellAt(e))} onMouseLeave={() => setHover(null)}
              onClick={(e) => {
                const c = cellAt(e);
                set({ departDay: grid.departDays[c.ix], travelDays: grid.travelDays[c.iy] });
              }} />
            <div class="hm-xaxis">
              {monthTicks.map((t) => (
                <span class={`hm-xtick${t.label.length === 4 ? ' year' : ''}`} style={{ left: `${(xOf(t.day) / W) * 100}%` }}>{t.label}</span>
              ))}
            </div>
            <div class="hm-axis-title center">Departure date</div>
          </div>
        </div>
        <div class="hm-foot">
          <div class="hm-legend-col">
            <div class="hm-legend">
              <span>cheap</span>
              <div class="hm-gradient" />
              <span>expensive</span>
            </div>
            <div class="hm-legend-nums tiny muted num">
              <span>{sc ? kms(sc.lo) : '—'}</span><span>{sc ? `≥ ${kms(sc.hi)}` : '—'}</span>
            </div>
            <div class="hm-legend-late tiny muted"><span class="hm-swatch-late" /> arrives after the mission deadline ({formatDay(deadline, startISO)})</div>
          </div>
          <div class="hm-readouts small">
            <div>
              <span class="muted">Current: </span>
              <span class="num">
                {formatDay(m.departDay, startISO)} · {formatDuration(m.travelDays)} · {Number.isFinite(currentTotal) ? kms(currentTotal) : 'no solution'}
              </span>
              {leaving !== undefined && <span class="muted num"> (of which leaving orbit: {kms(leaving)})</span>}
              {currentLate && <span class="err-text"> · after mission deadline</span>}
            </div>
            <div>
              <span class="muted">Cheapest before deadline: </span>
              {best ? (
                <button class="link" onClick={() => set(pickCheapest(from, m.target, deadline) ?? best)}>
                  <span class="num">{formatDay(best.departDay, startISO)} · {formatDuration(best.travelDays)} · {kms(best.dvMs)}</span>
                </button>
              ) : <span class="muted">none: every option arrives too late</span>}
            </div>
            {early && !sameMarker && (
              <div>
                <span class="muted">Earliest good window: </span>
                <button class="link" onClick={() => set(early)}>
                  <span class="num">{formatDay(early.departDay, startISO)} · {formatDuration(early.travelDays)} · {kms(early.dvMs)}</span>
                </button>
              </div>
            )}
            <div class="hm-hover">
              {hover && (
                <>
                  <span class="muted">Cursor: </span>
                  <span class="num">
                    {formatDay(grid.departDays[hover.ix], startISO)} · {formatDuration(grid.travelDays[hover.iy])} · {hv !== undefined && Number.isFinite(hv) ? kms(hv) : 'no solution'}
                  </span>
                  {hoverArrive > deadline
                    ? <span class="err-text"> · After mission deadline</span>
                    : <span class="muted"> · arrive {formatDay(hoverArrive, startISO)}</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
