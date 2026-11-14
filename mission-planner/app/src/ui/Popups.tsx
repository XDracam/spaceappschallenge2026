import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type {
  BodyId, Branch, FlightState, FlybyManeuver, Maneuver, ManeuverResult, SeparateManeuver, TransferManeuver, Vec2,
} from '../model/types';
import { actions, gameStore, uiStore, useEvaluation, useGame, useUi } from '../state/store';
import { availableManeuvers, branchEndState, createManeuver, transferRanges } from '../physics';
import { bodyById, childrenOf } from '../data/bodies';
import { findBranch, findManeuver } from '../model/rocketUtils';
import { formatDay, formatDuration, formatDv } from '../model/units';
import { Slider } from './Slider';
import {
  CloseIcon, SeverityIcon, bodyName, branchColor, clamp, closePopup, describeState, findResult, fmtNum, localUi, newId,
} from './common';
import { Heatmap } from './Heatmap';

export function PopupLayer() {
  const popup = useUi((u) => u.popup);
  const phase = useGame((g) => g.phase);
  if (!popup || phase !== 'planning') return null;
  if (popup.kind === 'maneuverMenu') return <ManeuverMenu branchId={popup.branchId} screen={popup.screen} />;
  if (popup.kind === 'maneuverEdit') return <ManeuverEdit key={popup.maneuverId} maneuverId={popup.maneuverId} screen={popup.screen} />;
  if (popup.kind === 'heatmap') return <Heatmap maneuverId={popup.maneuverId} />;
  return null;
}

/** Absolutely positioned popup next to a screen point, clamped inside its offset parent. */
function Floating({ screen, children, cls }: { screen: Vec2; children: ComponentChildren; cls?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [, setTick] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    const w = el.offsetWidth, h = el.offsetHeight, W = parent.clientWidth, H = parent.clientHeight;
    let left = screen.x + 16;
    if (left + w > W - 8) left = screen.x - w - 16;
    left = clamp(left, 8, Math.max(8, W - w - 8));
    const top = clamp(screen.y - 24, 8, Math.max(8, H - h - 8));
    if (!pos || Math.abs(pos.left - left) > 0.5 || Math.abs(pos.top - top) > 0.5) setPos({ left, top });
  });

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div ref={ref} class={`popup ${cls ?? ''}`}
      style={{ left: pos?.left ?? screen.x, top: pos?.top ?? screen.y, visibility: pos ? 'visible' : 'hidden' }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

function PopupHead({ title, sub, color }: { title: string; sub?: string; color?: string }) {
  return (
    <div class="popup-head">
      {color && <span class="dot" style={{ background: color }} />}
      <div class="popup-title">
        <b>{title}</b>
        {sub && <div class="muted small">{sub}</div>}
      </div>
      <button class="btn icon-btn ghost" title="Close (Esc)" onClick={closePopup}><CloseIcon /></button>
    </div>
  );
}

// ------------------------------------------------------------ maneuver menu

function ManeuverMenu({ branchId, screen }: { branchId: string; screen: Vec2 }) {
  const game = useGame((g) => g);
  const ev = useEvaluation();
  const branch = findBranch(game.plan, branchId);
  const bi = game.plan.branches.findIndex((b) => b.id === branchId);
  const state = branchEndState(ev, branchId);
  const options = branch && state && state.kind !== 'lost' ? availableManeuvers(game, branch, state) : [];

  const pick = (i: number) => {
    if (!branch || !state) return;
    const opt = options[i];
    const m = createManeuver(gameStore.get(), branch, state, opt, newId);
    actions.addManeuver(branch.id, m);
    uiStore.update((u) => {
      u.selectedBranchId = branch.id;
      u.selectedManeuverId = m.id;
      u.popup = { kind: 'maneuverEdit', maneuverId: m.id, screen };
    });
  };

  return (
    <Floating screen={screen} cls="menu-popup">
      <PopupHead title={`Add maneuver · ${branch?.name ?? branchId}`} sub={describeState(state, game.mission.startDateISO)}
        color={branchColor(bi)} />
      {state?.kind === 'lost' && <p class="err-text small">{state.reason}</p>}
      {options.length === 0 && state?.kind !== 'lost' && <p class="empty">No maneuvers available from here.</p>}
      <ul class="option-list">
        {options.map((o, i) => (
          <li key={`${o.type}-${o.target ?? ''}-${i}`}>
            <button class="option" disabled={!o.enabled} title={o.reason} onClick={() => pick(i)}>
              <span>{o.label}</span>
              {!o.enabled && o.reason && <span class="muted small">{o.reason}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Floating>
  );
}

// ------------------------------------------------------------ maneuver edit

function stateBody(s: FlightState | undefined): BodyId | undefined {
  return s && s.kind !== 'lost' ? s.body : undefined;
}

function altSlider(body: BodyId, value: number, onChange: (v: number) => void, label = 'Orbit altitude') {
  const b = bodyById(body);
  const min = b?.minOrbitAltKm ?? 100;
  const max = b?.maxOrbitAltKm ?? 100_000;
  return (
    <div class="stat">
      <div class="stat-head"><span class="stat-label">{label}</span><span class="stat-value num">{fmtNum(value)} km</span></div>
      <Slider min={min} max={max} step={1} scale="log" value={value}
        onChange={(v) => onChange(v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v))} />
    </div>
  );
}

function ManeuverEdit({ maneuverId, screen }: { maneuverId: string; screen: Vec2 }) {
  const plan = useGame((g) => g.plan);
  const rocket = useGame((g) => g.rocket);
  const startISO = useGame((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const found = findManeuver(plan, maneuverId);
  const result = findResult(ev, maneuverId);

  useEffect(() => {
    localUi.update((s) => { s.lastEditScreen = screen; });
  }, [screen.x, screen.y]);

  // While editing a transfer, show body positions at its departure day.
  const departDay = found?.maneuver.type === 'transfer' ? found.maneuver.departDay : null;
  useEffect(() => {
    if (departDay === null) return;
    uiStore.update((u) => { u.mapDay = departDay; });
  }, [departDay]);
  useEffect(() => () => uiStore.update((u) => { u.mapDay = null; }), []);

  if (!found) {
    return (
      <Floating screen={screen} cls="edit-popup">
        <PopupHead title="Maneuver not found" />
      </Floating>
    );
  }
  const { maneuver: m, branch, index } = found;
  const bi = plan.branches.findIndex((b) => b.id === branch.id);
  const isLaunch = bi === 0 && index === 0;
  const upd = (patch: Partial<Maneuver>) => actions.updateManeuver(m.id, patch);
  const title = result?.label ?? defaultLabel(m);

  return (
    <Floating screen={screen} cls="edit-popup">
      <PopupHead title={title} sub={branch.name} color={branchColor(bi)} />
      <div class="edit-summary">
        <div class="kv"><span>Δv required</span><b class={`num${result && !result.ok ? ' err-text' : ''}`}>{result ? formatDv(result.dvRequiredMs) : '—'}</b></div>
        {result && (
          <div class="kv"><span>Δv left before</span><span class="num">{formatDv(result.dvAvailableBeforeMs)}</span></div>
        )}
        {result && (
          <div class="kv"><span>Dates</span>
            <span class="num">{formatDay(result.startDay, startISO)} → {formatDay(result.endDay, startISO)}
              {result.endDay - result.startDay >= 1 && <span class="muted"> ({formatDuration(result.endDay - result.startDay)})</span>}
            </span>
          </div>
        )}
        {result?.twr !== undefined && (
          <div class="kv"><span>TWR</span><span class={`num${result.twr < 1 ? ' err-text' : ''}`}>{result.twr.toFixed(2)}</span></div>
        )}
        {result && result.burns.length > 0 && (
          <div class="kv"><span>Paid by</span>
            <span class="num small">{result.burns.map((b) => `${stageName(rocket, b.stageId)} ${formatDv(b.dvMs)}`).join(' · ')}</span>
          </div>
        )}
      </div>

      <div class="edit-controls">
        <ManeuverControls m={m} branch={branch} index={index} result={result} upd={upd} />
      </div>

      {result && result.issues.length > 0 && (
        <ul class="issue-list compact">
          {result.issues.map((i, k) => (
            <li key={k} class={`issue ${i.severity}`}><SeverityIcon severity={i.severity} /><span>{i.message}</span></li>
          ))}
        </ul>
      )}

      <div class="popup-foot">
        {isLaunch ? (
          <span class="muted small">The launch can’t be deleted.</span>
        ) : (
          <>
            <span class="muted small">Deleting also removes all later maneuvers in this branch.</span>
            <button class="btn small danger" onClick={() => actions.removeManeuver(m.id)}>Delete</button>
          </>
        )}
      </div>
    </Floating>
  );
}

function stageName(rocket: { stages: { id: string; name: string }[]; spacecraft: { stages: { id: string; name: string }[] }[] }, id: string) {
  return rocket.stages.find((s) => s.id === id)?.name
    ?? rocket.spacecraft.flatMap((s) => s.stages).find((s) => s.id === id)?.name ?? id;
}

function defaultLabel(m: Maneuver): string {
  switch (m.type) {
    case 'launch': return `Launch from ${bodyName(m.body)}`;
    case 'transfer': return `Transfer to ${bodyName(m.target)}`;
    case 'flyby': return `Flyby toward ${bodyName(m.target)}`;
    case 'changeOrbit': return 'Change orbit';
    case 'insertion': return 'Orbit insertion';
    case 'land': return 'Land';
    case 'ascent': return 'Ascent';
    case 'separate': return 'Separate';
    case 'entry': return 'Atmospheric entry';
  }
}

function ManeuverControls({ m, branch, index, result, upd }: {
  m: Maneuver; branch: Branch; index: number; result?: ManeuverResult; upd: (p: Partial<Maneuver>) => void;
}) {
  const before = result?.stateBefore;
  switch (m.type) {
    case 'launch':
      return altSlider(m.body, m.altitudeKm, (v) => upd({ altitudeKm: v }));
    case 'changeOrbit':
    case 'ascent':
      return altSlider(stateBody(before) ?? 'earth', m.altitudeKm, (v) => upd({ altitudeKm: v }));
    case 'insertion': {
      const body = stateBody(before) ?? 'earth';
      const atm = bodyById(body)?.atmosphere !== 'none';
      return (
        <>
          {altSlider(body, m.altitudeKm, (v) => upd({ altitudeKm: v }))}
          <label class="check" title={atm ? 'Needs a heat shield' : 'Needs an atmosphere'}>
            <input type="checkbox" checked={m.aerocapture} disabled={!atm && !m.aerocapture}
              onChange={(e) => upd({ aerocapture: (e.currentTarget as HTMLInputElement).checked })} />
            Aerocapture {atm ? '(needs a heat shield)' : '(no atmosphere here)'}
          </label>
        </>
      );
    }
    case 'transfer':
      return <TransferControls m={m} before={before} upd={upd} />;
    case 'flyby':
      return <FlybyControls m={m} before={before} upd={upd} />;
    case 'separate':
      return <SeparateControls m={m} branch={branch} index={index} upd={upd} />;
    case 'land':
    case 'entry':
      return <p class="muted small">No parameters.</p>;
  }
}

function TransferControls({ m, before, upd }: { m: TransferManeuver; before?: FlightState; upd: (p: Partial<Maneuver>) => void }) {
  const startISO = useGame((g) => g.mission.startDateISO);
  const launchDay = useGame((g) => g.plan.launchDay);
  const from = stateBody(before) ?? 'earth';
  const earliest = before?.day ?? launchDay;
  const ranges = transferRanges(from, m.target, earliest);
  const [d0, d1] = ranges.depart;
  const [t0, t1] = ranges.travel;
  return (
    <>
      <div class="kv"><span>Target</span><b>{bodyName(m.target)}</b></div>
      <div class="stat">
        <div class="stat-head"><span class="stat-label">Departure</span>
          <span class="stat-value num">{formatDay(m.departDay, startISO)} <span class="muted">(+{formatDuration(m.departDay - earliest)})</span></span>
        </div>
        <Slider min={d0} max={Math.max(d0 + 1, d1)} step={1} scale="linear" value={m.departDay}
          onChange={(v) => upd({ departDay: Math.round(v) })} />
      </div>
      <div class="stat">
        <div class="stat-head"><span class="stat-label">Travel time</span>
          <span class="stat-value num">{formatDuration(m.travelDays)} <span class="muted">· arrive {formatDay(m.departDay + m.travelDays, startISO)}</span></span>
        </div>
        <Slider min={t0} max={Math.max(t0 + 1, t1)} step={1} scale="linear" value={m.travelDays}
          onChange={(v) => upd({ travelDays: Math.round(v) })} />
      </div>
      <button class="btn small primary" disabled={before?.kind !== 'orbit'}
        title={before?.kind !== 'orbit' ? 'Needs a computed departure orbit' : 'Departure date × travel time'}
        onClick={() => uiStore.update((u) => { u.popup = { kind: 'heatmap', maneuverId: m.id }; })}>
        Δv heat map
      </button>
    </>
  );
}

function FlybyControls({ m, before, upd }: { m: FlybyManeuver; before?: FlightState; upd: (p: Partial<Maneuver>) => void }) {
  const launchDay = useGame((g) => g.plan.launchDay);
  const at = stateBody(before);
  const parent = at ? bodyById(at)?.parent : bodyById(m.target)?.parent;
  const siblings = parent ? childrenOf(parent).filter((b) => b.id !== at) : [];
  const ranges = transferRanges(at ?? 'earth', m.target, before?.day ?? launchDay);
  const [t0, t1] = ranges.travel;
  return (
    <>
      {at && <div class="kv"><span>Flyby of</span><b>{bodyName(at)}</b></div>}
      <label class="field">
        <span>Toward</span>
        <select value={m.target} onChange={(e) => upd({ target: (e.currentTarget as HTMLSelectElement).value as BodyId })}>
          {siblings.length === 0 && <option value={m.target}>{bodyName(m.target)}</option>}
          {siblings.map((b) => <option value={b.id}>{b.name}</option>)}
        </select>
      </label>
      {altSlider(at ?? 'earth', m.periapsisAltKm, (v) => upd({ periapsisAltKm: v }), 'Closest approach')}
      <div class="stat">
        <div class="stat-head"><span class="stat-label">Travel time</span><span class="stat-value num">{formatDuration(m.travelDays)}</span></div>
        <Slider min={t0} max={Math.max(t0 + 1, t1)} step={1} scale="linear" value={m.travelDays}
          onChange={(v) => upd({ travelDays: Math.round(v) })} />
      </div>
    </>
  );
}

function SeparateControls({ m, branch, index, upd }: { m: SeparateManeuver; branch: Branch; index: number; upd: (p: Partial<Maneuver>) => void }) {
  const rocket = useGame((g) => g.rocket);
  // Spacecraft still on the branch at this point: start set minus earlier separations.
  let onBoard = [...branch.spacecraftIds];
  for (const prev of branch.maneuvers.slice(0, index)) {
    if (prev.type === 'separate') onBoard = onBoard.filter((id) => !prev.spacecraftIds.includes(id));
  }
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...new Set([...m.spacecraftIds, id])] : m.spacecraftIds.filter((x) => x !== id);
    if (next.length === 0) return;
    upd({ spacecraftIds: next });
  };
  return (
    <>
      <div class="muted small">Spacecraft leaving on a new branch:</div>
      {onBoard.map((id) => {
        const sc = rocket.spacecraft.find((s) => s.id === id);
        return (
          <label class="check" key={id}>
            <input type="checkbox" checked={m.spacecraftIds.includes(id)}
              onChange={(e) => toggle(id, (e.currentTarget as HTMLInputElement).checked)} />
            {sc?.name ?? id}
          </label>
        );
      })}
      {onBoard.every((id) => m.spacecraftIds.includes(id)) && (
        <p class="warn-text small">All spacecraft leave; nothing stays on this branch.</p>
      )}
    </>
  );
}
