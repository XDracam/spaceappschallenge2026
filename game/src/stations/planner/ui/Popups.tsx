import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type {
  BodyId, Branch, FlightState, FlybyManeuver, Maneuver, ManeuverOption, ManeuverResult, MissionPlan, SeparateManeuver,
  TransferManeuver, Vec2,
} from '../model/types';
import { actions, getPlanner, uiStore, useEvaluation, usePlanner, useUi } from '../state/store';
import {
  altitudeGoalsAt, altitudeOk, availableManeuvers, branchEndState, createManeuver, goalOrbitText, transferRanges, transferRelation,
} from '../physics';
import { bodyById, childrenOf } from '../data/bodies';
import { findBranch, findManeuver } from '../model/rocketUtils';
import { formatDay, formatDuration } from '../model/units';
import { Slider } from './Slider';
import {
  ChevronIcon, CloseIcon, HeatIcon, ManeuverIcon, TrashIcon, bodyName, branchColor, clamp, describeState, findResult, fmtNum,
  localUi, newId, rememberPopupFocus, restorePopupFocus,
} from './common';
import { Heatmap, kms, pickCheapest, transferTotal } from './Heatmap';

/** Close the popup and forget the selected maneuver, so its ghost trajectory disappears. */
function closeAll() {
  uiStore.update((u) => {
    u.popup = null;
    u.mapDay = null;
    u.selectedManeuverId = null;
  });
}

export function PopupLayer() {
  const popup = useUi((u) => u.popup);
  const phase = usePlanner((g) => g.phase);

  // Popups are also closed from outside (Escape in App, clicks on the map): when an edit / heat-map popup
  // goes away, clear the selection and the map day too.
  useEffect(() => {
    let prev = uiStore.get().popup;
    return uiStore.subscribe(() => {
      const cur = uiStore.get().popup;
      const wasEdit = !!prev && (prev.kind === 'maneuverEdit' || prev.kind === 'heatmap');
      prev = cur;
      if (wasEdit && !cur && getPlanner().phase === 'planning') {
        queueMicrotask(() => {
          const u = uiStore.get();
          if (u.popup || (u.selectedManeuverId === null && u.mapDay === null)) return;
          uiStore.update((d) => { d.selectedManeuverId = null; d.mapDay = null; });
        });
      }
    });
  }, []);

  if (!popup || phase !== 'planning') return null;
  if (popup.kind === 'maneuverMenu') return <ManeuverMenu key={popup.branchId} branchId={popup.branchId} screen={popup.screen} />;
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

  const focused = useRef(false);
  useLayoutEffect(() => {
    if (!pos || focused.current) return;
    rememberPopupFocus();
    const el = ref.current;
    const target = el?.querySelector<HTMLElement>('.option:not(:disabled)')
      ?? el?.querySelector<HTMLElement>('input:not(:disabled)')
      ?? el?.querySelector<HTMLElement>('button:not(:disabled)');
    target?.focus({ preventScroll: true });
    focused.current = document.activeElement === target;
  }, [pos]);

  useEffect(() => () => {
    // Run after the replacement popup, if any, has committed. Menu → editor keeps its origin.
    requestAnimationFrame(restorePopupFocus);
  }, []);

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

function PopupHead({ title, sub, color, onClose }: { title: string; sub?: string; color?: string; onClose: () => void }) {
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
      <button class="round-btn small" aria-label="Close maneuver popup" title="Close (Esc)" onClick={onClose}><CloseIcon /></button>
    </div>
  );
}

// ------------------------------------------------------------ maneuver menu

function ManeuverMenu({ branchId, screen }: { branchId: string; screen: Vec2 }) {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const [more, setMore] = useState(false);
  const branch = findBranch(game.plan, branchId);
  const bi = game.plan.branches.findIndex((b) => b.id === branchId);
  const state = branchEndState(ev, branchId);
  const options = branch && state && state.kind !== 'lost' ? availableManeuvers(game, branch, state) : [];
  const primary = options.filter((o) => !o.secondary);
  const secondary = options.filter((o) => o.secondary);
  // Nothing primary: show everything directly instead of a lone "More…" row.
  const showSecondary = more || primary.length === 0;

  const pick = (opt: ManeuverOption) => {
    if (!branch || !state) return;
    const m = createManeuver(getPlanner(), branch, state, opt, newId);
    actions.addManeuver(branch.id, m);
    uiStore.update((u) => {
      u.selectedBranchId = branch.id;
      u.selectedManeuverId = m.id;
      u.popup = { kind: 'maneuverEdit', maneuverId: m.id, screen };
    });
  };

  const item = (o: ManeuverOption, i: number) => (
    <li key={`${o.type}-${o.target ?? ''}-${o.spacecraftId ?? ''}-${i}`}>
      <button class="option" disabled={!o.enabled} title={o.reason} onClick={() => pick(o)}>
        <span class="opt-icon"><ManeuverIcon type={o.type} /></span>
        <span class="opt-text">
          <span>{o.label}</span>
          {!o.enabled && o.reason && <span class="muted tiny opt-reason">{o.reason}</span>}
        </span>
      </button>
    </li>
  );

  return (
    <Floating screen={screen} cls="menu-popup">
      <PopupHead title="Next step" sub={`${branch?.name ?? branchId} · ${describeState(state, game.mission.startDateISO)}`}
        color={branchColor(bi)} onClose={closeAll} />
      {state?.kind === 'lost' && <div class="err-line">{state.reason}</div>}
      {options.length === 0 && state?.kind !== 'lost' && <div class="empty">No maneuvers available from here.</div>}
      <ul class="option-list">
        {primary.map(item)}
        {secondary.length > 0 && primary.length > 0 && (
          <li>
            <button class="option more-row" aria-expanded={more} onClick={() => setMore(!more)}>
              <span class="opt-icon more-icon"><ChevronIcon open={more} /></span>
              <span class="opt-text"><span>More destinations… <span class="muted">({secondary.length})</span></span></span>
            </button>
          </li>
        )}
        {showSecondary && secondary.map(item)}
      </ul>
    </Floating>
  );
}

// ------------------------------------------------------------ maneuver edit

function stateBody(s: FlightState | undefined): BodyId | undefined {
  return s && s.kind !== 'lost' ? s.body : undefined;
}

const hasAir = (id: BodyId | undefined) => {
  const a = id ? bodyById(id)?.atmosphere : undefined;
  return a === 'thin' || a === 'thick';
};

function altSlider(body: BodyId, value: number, onChange: (v: number) => void, label = 'Orbit altitude') {
  const b = bodyById(body);
  const min = b?.minOrbitAltKm ?? 100;
  const max = b?.maxOrbitAltKm ?? 100_000;
  return (
    <div class="stat">
      <div class="stat-head"><span class="stat-label">{label}</span><span class="stat-value num">{fmtNum(value)} km</span></div>
      <Slider label={`${bodyName(body)} ${label}`} valueText={`${fmtNum(value)} km`} min={min} max={max} step={1} scale="log" value={value}
        onChange={(v) => onChange(v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v))} />
    </div>
  );
}

/** Maneuvers removed together with this one: later steps of its branch plus everything on branches split off by them. */
function laterStepCount(plan: MissionPlan, branch: Branch, index: number): number {
  const removed = branch.maneuvers.slice(index);
  let n = removed.length - 1;
  const seen = new Set<string>();
  const visit = (ms: Maneuver[]) => {
    for (const m of ms) {
      if (m.type !== 'separate' || seen.has(m.newBranchId)) continue;
      seen.add(m.newBranchId);
      const child = findBranch(plan, m.newBranchId);
      if (child) {
        n += child.maneuvers.length;
        visit(child.maneuvers);
      }
    }
  };
  visit(removed);
  return n;
}

function ManeuverEdit({ maneuverId, screen }: { maneuverId: string; screen: Vec2 }) {
  const plan = usePlanner((g) => g.plan);
  const rocket = usePlanner((g) => g.rocket);
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const deadline = usePlanner((g) => g.mission.completionDeadlineDay);
  const ev = useEvaluation();
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        <PopupHead title="Maneuver not found" onClose={closeAll} />
      </Floating>
    );
  }
  const { maneuver: m, branch, index } = found;
  const bi = plan.branches.findIndex((b) => b.id === branch.id);
  const isLaunch = bi === 0 && index === 0;
  const upd = (patch: Partial<Maneuver>) => actions.updateManeuver(m.id, patch);
  const title = result?.label ?? defaultLabel(m);
  const before = result?.stateBefore;
  const here = stateBody(before);

  const short = !!result && result.issues.some((i) => i.code === 'dv');
  const dur = result ? result.endDay - result.startDay : 0;
  const payers = result ? [...new Set(result.burns.map((b) => stageName(rocket, b.stageId)))] : [];
  const fuelFrac = result && result.dvAvailableBeforeMs > 0 ? clamp(result.dvRequiredMs / result.dvAvailableBeforeMs, 0, 1) : short ? 1 : 0;
  const later = laterStepCount(plan, branch, index);

  const canAerobrake = m.type === 'insertion' && !m.aerocapture && hasAir(here);
  const fromOrbit = before?.kind === 'orbit' ? before : undefined;
  const sibling = m.type === 'transfer' && !!fromOrbit && transferRelation(fromOrbit.body, m.target) === 'sibling';

  return (
    <Floating screen={screen} cls="edit-popup">
      <PopupHead title={title} sub={branch.name} color={branchColor(bi)} onClose={closeAll} />

      {m.type !== 'separate' && result && (
        <div class={`fuel-row${short ? ' short' : ''}`}
          title="Δv (km/s) is how much the spacecraft can change its speed: it measures fuel. Each step uses some.">
          <div class="fuel-text num">
            <span>Uses <b>{kms(result.dvRequiredMs)}</b></span>
            <span class="muted"> · </span>
            <span>{kms(result.dvAvailableBeforeMs)} left before</span>
          </div>
          <div class="fuel-bar"><div class="fuel-fill" style={{ width: `${fuelFrac * 100}%` }} /></div>
        </div>
      )}
      {m.type === 'separate' && (
        <p class="release-line">Releases <b>{m.spacecraftIds.map((id) => rocket.spacecraft.find((s) => s.id === id)?.name ?? id).join(' + ') || 'nothing'}</b> onto its own path.</p>
      )}
      {result && (
        <div class="meta-line">
          {dur >= 1 ? `${formatDay(result.startDay, startISO)} → ${formatDay(result.endDay, startISO)}` : formatDay(result.startDay, startISO)}
          {payers.length > 0 && ` · paid by ${payers.join(', ')}`}
        </div>
      )}
      {result?.twr !== undefined && (m.type === 'launch' || m.type === 'land' || m.type === 'ascent') && (
        <LiftLine type={m.type} twr={result.twr} />
      )}

      <div class="edit-controls">
        <ManeuverControls m={m} branch={branch} index={index} result={result} upd={upd} />
      </div>

      {result && result.issues.length > 0 && (
        <ul class="err-lines">
          {result.issues.map((i, k) => (
            <li key={k} class={`sev-line ${i.severity}`}>
              <span>{i.message}</span>
              {i.code === 'dv' && canAerobrake && (
                <button class="pill small primary inline-fix" onClick={() => upd({ aerocapture: true })}>Try aerobraking</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmDelete ? (
        <div class="popup-foot confirm-row">
          <span class="confirm-text">
            {isLaunch ? 'Delete the launch and the whole plan?'
              : later === 0 ? 'Delete this step?'
              : `Delete this step and ${later} later step${later === 1 ? '' : 's'}?`}
          </span>
          <button class="btn small danger" onClick={() => actions.removeManeuver(m.id)}>Delete</button>
          <button class="btn small ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      ) : (
        <div class="popup-foot">
          {m.type === 'transfer' && sibling && fromOrbit && (
            <button class="pill small primary" title="Earliest launch window that is nearly as cheap as the best one and arrives before the mission deadline"
              onClick={() => {
                const p = pickCheapest(fromOrbit, m.target, deadline);
                if (p) upd(p);
              }}>
              Pick best window
            </button>
          )}
          {m.type === 'transfer' && (
            <button class="pill small ghost" disabled={!fromOrbit}
              title={!fromOrbit ? 'Needs a computed departure orbit' : 'Fuel needed for every departure date and travel time'}
              onClick={() => uiStore.update((u) => { u.popup = { kind: 'heatmap', maneuverId: m.id }; })}>
              <HeatIcon /> Δv heat map
            </button>
          )}
          <div class="spacer" />
          <button class="round-btn small danger" title={isLaunch ? 'Delete the launch (removes the whole plan)' : 'Delete this step'} aria-label={isLaunch ? 'Delete the launch (removes the whole plan)' : 'Delete this step'}
            onClick={() => setConfirmDelete(true)}>
            <TrashIcon />
          </button>
        </div>
      )}
    </Floating>
  );
}

function LiftLine({ type, twr }: { type: 'launch' | 'land' | 'ascent'; twr: number }) {
  const r = twr.toFixed(2);
  if (twr <= 1) {
    return (
      <div class="lift-line err-text">
        {type === 'land' ? `Too weak to land softly (ratio ${r}) — add engines` : `Too weak to lift off (ratio ${r}) — add engines`}
      </div>
    );
  }
  const marginal = type === 'launch' && twr < 1.2;
  return (
    <div class={`lift-line ${marginal ? 'warn-text' : 'muted'}`}
      title="Lift ratio = engine thrust ÷ weight. Above 1 the rocket can rise; 1.2 or more is comfortable.">
      {type === 'land' ? `Landing thrust OK (ratio ${r})` : marginal ? `Lift-off thrust is marginal (ratio ${r})` : `Lift-off thrust OK (ratio ${r})`}
    </div>
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
    case 'flyby': return `Swing past toward ${bodyName(m.target)}`;
    case 'changeOrbit': return 'Change orbit height';
    case 'insertion': return 'Enter orbit';
    case 'land': return 'Land';
    case 'ascent': return 'Lift off';
    case 'separate': return 'Release';
    case 'entry': return 'Land directly';
  }
}

/** One-click buttons that set the altitude to a goal orbit at this body (e.g. geostationary). */
function GoalAltitudeButtons({ body, value, onPick }: { body: BodyId; value: number; onPick: (v: number) => void }) {
  const mission = usePlanner((g) => g.mission);
  const goals = altitudeGoalsAt(mission, body);
  const seen = new Set<number>();
  const list = goals.filter((g) => !seen.has(g.altitudeKm) && (seen.add(g.altitudeKm), true));
  if (!list.length) return null;
  return (
    <div class="goal-alt-row">
      {list.map((g) => (
        <button key={g.id} class="pill small" disabled={altitudeOk(g, value)}
          title={altitudeOk(g, value) ? `Already in ${goalOrbitText(g)}` : `Set the altitude to the goal orbit: ${goalOrbitText(g)}`}
          onClick={() => onPick(g.altitudeKm)}>
          {altitudeOk(g, value) ? `In ${goalOrbitText(g)}` : `Set to ${goalOrbitText(g)}`}
        </button>
      ))}
    </div>
  );
}

function ManeuverControls({ m, branch, index, result, upd }: {
  m: Maneuver; branch: Branch; index: number; result?: ManeuverResult; upd: (p: Partial<Maneuver>) => void;
}) {
  const before = result?.stateBefore;
  switch (m.type) {
    case 'launch':
      return (
        <>
          {altSlider(m.body, m.altitudeKm, (v) => upd({ altitudeKm: v }))}
          <GoalAltitudeButtons body={m.body} value={m.altitudeKm} onPick={(v) => upd({ altitudeKm: v })} />
        </>
      );
    case 'changeOrbit': {
      const body = stateBody(before) ?? 'earth';
      return (
        <>
          {altSlider(body, m.altitudeKm, (v) => upd({ altitudeKm: v }))}
          <GoalAltitudeButtons body={body} value={m.altitudeKm} onPick={(v) => upd({ altitudeKm: v })} />
        </>
      );
    }
    case 'ascent':
      return altSlider(stateBody(before) ?? 'earth', m.altitudeKm, (v) => upd({ altitudeKm: v }));
    case 'insertion': {
      const body = stateBody(before) ?? 'earth';
      const air = hasAir(body);
      const name = bodyName(body);
      return (
        <>
          {altSlider(body, m.altitudeKm, (v) => upd({ altitudeKm: v }))}
          <label class={`check${!air ? ' muted' : ''}`}
            title="Dip into the upper atmosphere to slow down instead of burning fuel. The spacecraft needs a heat shield.">
            <input type="checkbox" checked={m.aerocapture} disabled={!air && !m.aerocapture}
              onChange={(e) => upd({ aerocapture: (e.currentTarget as HTMLInputElement).checked })} />
            {air
              ? <span>Brake in {name.endsWith('s') ? `${name}'` : `${name}'s`} air (aerobraking — needs a heat shield)</span>
              : <span>Aerobraking <span class="tiny">· {name} has no air to brake in</span></span>}
          </label>
        </>
      );
    }
    case 'transfer':
      return <TransferControls m={m} result={result} upd={upd} />;
    case 'flyby':
      return <FlybyControls m={m} before={before} upd={upd} />;
    case 'separate':
      return <SeparateControls m={m} branch={branch} index={index} upd={upd} />;
    case 'land':
    case 'entry':
      return null;
  }
}

type Dir = 'left' | 'right' | 'here' | null;

/** Which way along one slider the whole transfer gets cheaper (from neighbouring values). */
function cheaperDir(f: (v: number) => number, v: number, step: number, lo: number, hi: number): Dir {
  const c = f(v);
  const l = v - step >= lo ? f(v - step) : Infinity;
  const r = v + step <= hi ? f(v + step) : Infinity;
  if (!Number.isFinite(c) && !Number.isFinite(l) && !Number.isFinite(r)) return null;
  if (l < c && l <= r) return 'left';
  if (r < c) return 'right';
  return 'here';
}

function TransferControls({ m, result, upd }: { m: TransferManeuver; result?: ManeuverResult; upd: (p: Partial<Maneuver>) => void }) {
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const deadline = usePlanner((g) => g.mission.completionDeadlineDay);
  const before = result?.stateBefore;
  const from = stateBody(before) ?? 'earth';
  const earliest = before?.day ?? launchDay;
  const ranges = transferRanges(from, m.target, earliest);
  const [d0, d1] = ranges.depart;
  const [t0, t1] = ranges.travel;
  const orbit = before?.kind === 'orbit' ? before : undefined;
  const sibling = !!orbit && transferRelation(orbit.body, m.target) === 'sibling';

  const hints = useMemo(() => {
    if (!orbit || !sibling) return { dep: null as Dir, trav: null as Dir };
    const ds = Math.max(2, (d1 - d0) / 80);
    const ts = Math.max(2, (t1 - t0) / 80);
    return {
      dep: cheaperDir((d) => transferTotal(orbit, m.target, d, m.travelDays), m.departDay, ds, d0, d1),
      trav: cheaperDir((t) => transferTotal(orbit, m.target, m.departDay, t), m.travelDays, ts, t0, t1),
    };
  }, [orbit?.body, orbit?.altitudeKm, orbit?.day, sibling, m.target, m.departDay, m.travelDays, d0, d1, t0, t1]);

  const dv = result ? kms(result.dvRequiredMs) : '—';
  const arrive = m.departDay + m.travelDays;
  const late = arrive > deadline;
  const depHint = hints.dep === 'left' ? '← cheaper earlier' : hints.dep === 'right' ? 'cheaper later →' : hints.dep === 'here' ? 'cheapest nearby' : '';
  const travHint = hints.trav === 'left' ? '← faster and cheaper' : hints.trav === 'right' ? 'faster ← → cheaper' : hints.trav === 'here' ? 'cheapest travel time' : 'faster ← → slower';

  return (
    <>
      <div class="stat">
        <div class="stat-head"><span class="stat-label">Departure</span>
          <span class="stat-value num">{formatDay(m.departDay, startISO)} <span class="muted">(+{formatDuration(m.departDay - earliest)})</span></span>
        </div>
        <Slider label="Departure date" valueText={formatDay(m.departDay, startISO)} min={d0} max={Math.max(d0 + 1, d1)} step={1} scale="linear" value={m.departDay}
          onChange={(v) => upd({ departDay: Math.round(v) })} />
        <div class="slider-caption"><span class="num">Δv {dv}</span><span>{depHint}</span></div>
      </div>
      <div class="stat">
        <div class="stat-head"><span class="stat-label">Travel time</span>
          <span class="stat-value num">{formatDuration(m.travelDays)} <span class={late ? 'err-text' : 'muted'}>· arrive {formatDay(arrive, startISO)}</span></span>
        </div>
        <Slider label="Travel time" valueText={formatDuration(m.travelDays)} min={t0} max={Math.max(t0 + 1, t1)} step={1} scale="linear" value={m.travelDays}
          onChange={(v) => upd({ travelDays: Math.round(v) })} />
        <div class="slider-caption"><span class="num">Δv {dv}</span><span>{travHint}</span></div>
        {late && <div class="slider-caption err-text"><span>Arrives after the mission deadline ({formatDay(deadline, startISO)})</span></div>}
      </div>
    </>
  );
}

function FlybyControls({ m, before, upd }: { m: FlybyManeuver; before?: FlightState; upd: (p: Partial<Maneuver>) => void }) {
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const at = stateBody(before);
  const parent = at ? bodyById(at)?.parent : bodyById(m.target)?.parent;
  const siblings = parent ? childrenOf(parent).filter((b) => b.id !== at) : [];
  const ranges = transferRanges(at ?? 'earth', m.target, before?.day ?? launchDay);
  const [t0, t1] = ranges.travel;
  return (
    <>
      {at && <div class="kv"><span>Swing past</span><b>{bodyName(at)}</b></div>}
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
        <Slider label="Travel time" valueText={formatDuration(m.travelDays)} min={t0} max={Math.max(t0 + 1, t1)} step={1} scale="linear" value={m.travelDays}
          onChange={(v) => upd({ travelDays: Math.round(v) })} />
      </div>
    </>
  );
}

function SeparateControls({ m, branch, index, upd }: { m: SeparateManeuver; branch: Branch; index: number; upd: (p: Partial<Maneuver>) => void }) {
  const rocket = usePlanner((g) => g.rocket);
  // Spacecraft still on the branch at this point: start set minus earlier separations.
  let onBoard = [...branch.spacecraftIds];
  for (const prev of branch.maneuvers.slice(0, index)) {
    if (prev.type === 'separate') onBoard = onBoard.filter((id) => !prev.spacecraftIds.includes(id));
  }
  // With two spacecraft the choice was made in the menu; the list only helps with three or more.
  if (onBoard.length <= 2) return null;
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...new Set([...m.spacecraftIds, id])] : m.spacecraftIds.filter((x) => x !== id);
    if (next.length === 0) return;
    upd({ spacecraftIds: next });
  };
  return (
    <>
      <div class="label" title="Spacecraft leaving on their own path">Released</div>
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
        <p class="warn-text small">All spacecraft leave; nothing stays on this path.</p>
      )}
    </>
  );
}
