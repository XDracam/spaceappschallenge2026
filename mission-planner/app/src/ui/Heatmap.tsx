import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { FlightState } from '../model/types';
import { actions, uiStore, useEvaluation, useGame } from '../state/store';
import { transferGrid, transferRanges } from '../physics';
import type { TransferGrid } from '../physics';
import { findManeuver } from '../model/rocketUtils';
import { dayToDate, formatDay, formatDuration, formatDv } from '../model/units';
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

export function backToEdit(maneuverId: string) {
  uiStore.update((u) => {
    u.popup = { kind: 'maneuverEdit', maneuverId, screen: localUi.get().lastEditScreen ?? mapCentre() };
  });
}

export function Heatmap({ maneuverId }: { maneuverId: string }) {
  const plan = useGame((g) => g.plan);
  const startISO = useGame((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const found = findManeuver(plan, maneuverId);
  const m = found?.maneuver.type === 'transfer' ? found.maneuver : undefined;
  const before = findResult(ev, maneuverId)?.stateBefore;
  const from = before?.kind === 'orbit' ? (before as Extract<FlightState, { kind: 'orbit' }>) : undefined;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ ix: number; iy: number } | null>(null);

  const ranges = from && m ? transferRanges(from.body, m.target, from.day) : null;
  const key = from && m ? `${from.body}|${from.altitudeKm}|${from.day}|${m.target}` : '';
  const grid = useMemo(() => {
    if (!from || !m || !ranges) return null;
    return transferGrid(from, m.target, ranges.depart, ranges.travel, NX, NY);
  }, [key]);
  const sc = grid ? scaleOf(grid) : null;

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
        const y0 = H - (iy + 1) * CH;
        for (let y = y0; y < y0 + CH; y++) {
          for (let x = ix * CW; x < (ix + 1) * CW; x++) {
            const o = (y * W + x) * 4;
            img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    // Best point.
    if (Number.isFinite(grid.best.dvMs)) {
      const bx = xOf(grid.best.departDay), by = yOf(grid.best.travelDays);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 8, by); ctx.lineTo(bx - 3, by); ctx.moveTo(bx + 3, by); ctx.lineTo(bx + 8, by);
      ctx.stroke();
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
  }, [grid, m?.departDay, m?.travelDays]);

  const cellAt = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    return { ix: clamp(Math.floor(x / CW), 0, NX - 1), iy: clamp(NY - 1 - Math.floor(y / CH), 0, NY - 1) };
  };

  const head = (
    <div class="popup-head">
      <div class="popup-title">
        <b>Δv heat map{m ? ` · ${bodyName(m.target)}` : ''}</b>
        <div class="muted small">Departure date × travel time. Click a cell to set both.</div>
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
  const tStep = [10, 20, 50, 100, 200, 500].find((s) => (t1 - t0) / s <= 6) ?? 1000;
  const travelTicks: number[] = [];
  for (let t = Math.ceil(t0 / tStep) * tStep; t <= t1; t += tStep) travelTicks.push(t);

  const hv = hover ? grid.dvMs[hover.iy]?.[hover.ix] : undefined;
  const current = (() => {
    const ix = clamp(Math.round(((m.departDay - d0) / ((d1 - d0) || 1)) * (NX - 1)), 0, NX - 1);
    const iy = clamp(Math.round(((m.travelDays - t0) / ((t1 - t0) || 1)) * (NY - 1)), 0, NY - 1);
    return grid.dvMs[iy]?.[ix];
  })();

  return (
    <div class="modal-backdrop" onClick={() => backToEdit(maneuverId)}>
      <div class="modal heatmap" onClick={(e) => e.stopPropagation()}>
        {head}
        <div class="hm-body">
          <div class="hm-yaxis">
            <span class="hm-axis-title">Travel time (days)</span>
            {travelTicks.map((t) => (
              <span class="hm-ytick num" style={{ top: `${(yOf(t) / H) * 100}%` }}>{t}</span>
            ))}
          </div>
          <div class="hm-plot">
            <canvas ref={canvasRef} width={W} height={H} class="hm-canvas"
              onMouseMove={(e) => setHover(cellAt(e))} onMouseLeave={() => setHover(null)}
              onClick={(e) => {
                const c = cellAt(e);
                actions.updateManeuver(m.id, { departDay: Math.round(grid.departDays[c.ix]), travelDays: Math.round(grid.travelDays[c.iy]) });
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
          <div class="hm-legend">
            <span class="num">{sc ? formatDv(sc.lo) : '—'}</span>
            <div class="hm-gradient" />
            <span class="num">{sc ? `≥ ${formatDv(sc.hi)}` : '—'}</span>
          </div>
          <div class="hm-readouts small">
            <div>
              <span class="muted">Current </span>
              <span class="num">{formatDay(m.departDay, startISO)} · {formatDuration(m.travelDays)} · {current !== undefined && Number.isFinite(current) ? formatDv(current) : 'no solution'}</span>
            </div>
            <div>
              <span class="muted">Best </span>
              {Number.isFinite(grid.best.dvMs) ? (
                <button class="link" onClick={() => actions.updateManeuver(m.id, { departDay: Math.round(grid.best.departDay), travelDays: Math.round(grid.best.travelDays) })}>
                  <span class="num">{formatDay(grid.best.departDay, startISO)} · {formatDuration(grid.best.travelDays)} · {formatDv(grid.best.dvMs)}</span>
                </button>
              ) : <span class="muted">no solution in range</span>}
            </div>
            <div class="hm-hover">
              {hover && (
                <>
                  <span class="muted">Cursor </span>
                  <span class="num">{formatDay(grid.departDays[hover.ix], startISO)} · {Math.round(grid.travelDays[hover.iy])} d · {hv !== undefined && Number.isFinite(hv) ? formatDv(hv) : 'no solution'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
