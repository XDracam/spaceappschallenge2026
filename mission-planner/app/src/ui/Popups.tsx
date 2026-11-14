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
  CloseIcon, HeatIcon, ManeuverIcon, TrashIcon, bodyName, branchColor, clamp, closePopup, describeState, findResult, fmtNum,
  localUi, newId,
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
      <div class="popup-title">
        <div class="popup-big">{title}</div>
        {sub && (
          <div class="popup-sub">
            {color && <span class="dot" style={{ background: color }} />}
            {sub}
          </div>
        )}
      </div>
      <button class="round-btn small" title="Close (Esc)" onClick={closePopup}><CloseIcon /></button>
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
      <PopupHead title="Add maneuver" sub={`${branch?.name ?? branchId} · ${describeState(state, game.mission.startDateISO)}`}
        color={branchColor(bi)} />
      {state?.kind === 'lost' && <div class="err-line">{state.reason}</div>}
      {options.length === 0 && state?.kind !== 'lost' && <div class="empty">No maneuvers available from here.</div>}
      <ul class="option-list">
        {options.map((o, i) => (
          <li key={`${o.type}-${o.target ?? ''}-${i}`}>
            <button class="option" disabled={!o.enabled} title={o.reason} onClick={() => pick(i)}>
              <span class="opt-icon"><ManeuverIcon type={o.type} /></span>
              <span class="opt-text">
                <span>{o.label}</span>
                {!o.enabled && o.reason && <span class="muted tiny opt-reason">{o.reason}</span>}
              </span>
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

  const left = result ? result.dvAvailableBeforeMs - result.dvRequiredMs : undefined;
  const paidBy = result?.burns.map((b) => `${stageName(rocket, b.stageId)} ${formatDv(b.dvMs)}`).join(' · ') ?? '';
  const dur = result ? result.endDay - result.startDay : 0;

  return (
    <Floating screen={screen} cls="edit-popup">
      <PopupHead title={title} sub={branch.name} color={branchColor(bi)} />
      <div class="stat-grid">
        <div>
          <span class="label">Δv required</span>
          <b class={`num${result && !result.ok ? ' err-text' : ''}`}>{result ? formatDv(result.dvRequiredMs) : '—'}</b>
        </div>
        <div title={result ? `Before the maneuver: ${formatDv(result.dvAvailableBeforeMs)}` : undefined}>
          <span class="label">Δv left</span>
          <b class={`num${left !== undefined && left < 0 ? ' err-text' : ''}`}>{left !== undefined ? (left < 0 ? `−${formatDv(-left)}` : formatDv(left)) : '—'}</b>
        </div>
        <div title={result && dur >= 1 ? `Duration ${formatDuration(dur)}` : undefined}>
          <span class="label">Start → end</span>
          <b class="num date-val">
            {result ? (dur >= 1
              ? <>{formatDay(result.startDay, startISO)}<span class="muted"> →</span><br />{formatDay(result.endDay, startISO)}</>
              : formatDay(result.startDay, startISO)) : '—'}
          </b>
        </div>
        <div title={paidBy || undefined}>
          <span class="label">Paid by</span>
          <b class="paid-val">{result && result.burns.length > 0 ? result.burns.map((b) => stageName(rocket, b.stageId)).join(', ') : '—'}</b>
          {result?.twr !== undefined && (
            <span class={`tiny num${result.twr < 1 ? ' err-text' : ' muted'}`}>TWR {result.twr.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div class="edit-controls">
        <ManeuverControls m={m} branch={branch} index={index} result={result} upd={upd} />
      </div>

      {result && result.issues.length > 0 && (
        <ul class="err-lines">
          {result.issues.map((i, k) => (
            <li key={k} class={`sev-line ${i.severity}`} title={i.message}>{i.message}</li>
          ))}
        </ul>
      )}

      <div class="popup-foot">
        {m.type === 'transfer' && (
          <button class="pill small" disabled={result?.stateBefore.kind !== 'orbit'}
            title={result?.stateBefore.kind !== 'orbit' ? 'Needs a computed departure orbit' : 'Departure date × travel time'}
            onClick={() => uiStore.update((u) => { u.popup = { kind: 'heatmap', maneuverId: m.id }; })}>
            <HeatIcon /> Δv heat map
          </button>
        )}
        <div class="spacer" />
        {isLaunch ? (
          <span class="muted tiny">The launch can’t be deleted.</span>
        ) : (
          <button class="round-btn small danger" title="Delete maneuver (also removes all later maneuvers in this branch)"
            onClick={() => actions.removeManeuver(m.id)}>
            <TrashIcon />
          </button>
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
            Aerocapture{!atm && <span class="muted tiny"> · no atmosphere</span>}
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
      return null;
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
      <div class="label" title="Spacecraft leaving on a new branch">Separating</div>
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
