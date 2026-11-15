import { useEffect, useState } from 'preact/hooks';
import { createStore, useStore } from '../../../core/createStore';
import type { Goal, Issue, ManeuverType, Severity } from '../model/types';
import { uiStore, useClock, useEvaluation, usePlanner, useUi } from '../state/store';
import { DAYS_PER_MONTH, formatDv } from '../model/units';
import { allParts, partPlaceName } from '../model/rocketUtils';
import {
  SeverityIcon, useLocalUi, branchColor, branchDisplayName, chanceClass, highlightPart, openManeuverEdit, openTab, partReadiness, pct, plural,
} from './common';

/** Bottom row of three floating glass cards: Δv budget, goals, issues. */
export function BottomStrip() {
  return (
    <div class="cards-row">
      <DvCard />
      <GoalsCard />
      <IssuesCard />
    </div>
  );
}

function km(ms: number): string {
  return (ms / 1000).toFixed(2);
}

const SHORT_LABEL: Record<ManeuverType, string> = {
  launch: 'Launch', changeOrbit: 'Orbit change', transfer: 'Transfer', flyby: 'Flyby', insertion: 'Orbit',
  land: 'Land', ascent: 'Ascent', separate: 'Separate', entry: 'Entry',
};

function DvCard() {
  const game = usePlanner((g) => g);
  const branches = game.plan.branches;
  const selected = useUi((u) => u.selectedBranchId);
  const selManeuver = useUi((u) => u.selectedManeuverId);
  const ev = useEvaluation();
  const idx = Math.max(0, branches.findIndex((b) => b.id === selected));
  const branch = branches[idx];
  const br = ev.branches.find((b) => b.branchId === branch?.id);
  const required = br?.dvRequiredTotalMs ?? 0;
  const available = br?.dvAvailableTotalMs ?? 0;
  const margin = available - required;
  const short = margin < -0.5;
  const scale = Math.max(required, available, 1);
  const stageName = (id: string) => {
    const s = br?.stageBands.find((b) => b.stageId === id);
    return s ? `${s.ownerName} · ${s.stageName}` : id;
  };

  return (
    <section class="card glass dv-card">
      <div class="card-top">
        <span class="label">Δv budget</span>
        {branches.length > 1 && (
          <div class="branch-chips">
            {branches.map((b, i) => {
              const name = branchDisplayName(game, b);
              return (
                <button class={`mini-pill${b.id === branch?.id ? ' active' : ''}`} key={b.id} title={name}
                  onClick={() => uiStore.update((u) => { u.selectedBranchId = b.id; })}>
                  <span class="dot" style={{ background: branchColor(i) }} />{name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div class="dv-head" title={`Required ${formatDv(required)} · available ${formatDv(available)}${short ? ' — not enough Δv' : ''}`}>
        <span class="dv-margin-label">Margin</span>
        <span class={`dv-margin num ${short ? 'err-text' : 'ok-text'}`}>{margin >= 0 ? '+' : '−'}{km(Math.abs(margin))}</span>
        <span class="unit">km/s</span>
        <span class="muted small dv-sub num">needs {km(required)} of {km(available)} km/s</span>
      </div>
      {!br || br.maneuvers.length === 0 ? (
        <div class="muted small">No maneuvers planned yet.</div>
      ) : (
        <div class="seg-bar">
          {br.maneuvers.map((m) => {
            const w = (m.dvRequiredMs / scale) * 100;
            const tiny = w < 0.6;
            const stages = m.burns.filter((b) => b.dvMs > 0.5).map((b) => `${stageName(b.stageId)} ${formatDv(b.dvMs)}`);
            return (
              <button key={m.maneuverId}
                class={`seg${m.ok ? '' : ' bad'}${m.maneuverId === selManeuver ? ' selected' : ''}${tiny ? ' zero' : ''}`}
                style={{ width: tiny ? undefined : `${w}%`, '--seg': branchColor(idx) }}
                title={`${m.label}: ${formatDv(m.dvRequiredMs)}${m.ok ? '' : ' — fails here'}${stages.length ? `\nPaid by ${stages.join(', ')}` : ''}`}
                onClick={() => openManeuverEdit(m.maneuverId, m.branchId)}>
                {w > 15 && <span class="seg-label">{SHORT_LABEL[m.type] ?? m.label}</span>}
              </button>
            );
          })}
          {short && <span class="seg-avail" style={{ left: `${(available / scale) * 100}%` }} title={`Available ${formatDv(available)}`} />}
        </div>
      )}
    </section>
  );
}

function goalAsk(g: Goal): string {
  const body = g.body.charAt(0).toUpperCase() + g.body.slice(1);
  const orbit = g.orbitName ?? (g.altitudeKm !== undefined ? `an orbit around ${body} at ${Math.round(g.altitudeKm).toLocaleString('en')} km` : `an orbit around ${body}`);
  switch (g.kind) {
    case 'orbit': return `Reach ${orbit}.`;
    case 'orbitData': return `Reach ${orbit} and send data home${g.instrument ? ` with the ${g.instrument} instrument` : ''}${g.minPerformance !== undefined ? ` at performance ${g.minPerformance} or better` : ''}.`;
    case 'surfaceData': return `Land on ${body} and send data home${g.instrument ? ` with the ${g.instrument} instrument` : ''}${g.minPerformance !== undefined ? ` at performance ${g.minPerformance} or better` : ''}.`;
    case 'land': return `Land on ${body}.`;
    default: return `Bring the craft back from ${body}.`;
  }
}

const goalStore = createStore<{ id: string | null }>({ id: null });
const openGoal = (id: string) => goalStore.set({ id });

/** Larger window with everything about one goal; mounted at the station root so it covers the free map area. */
export function GoalDialogHost() {
  const id = useStore(goalStore, (s) => s.id);
  const goal = usePlanner((g) => g.mission.goals.find((x) => x.id === id));
  return goal ? <GoalDialog goal={goal} onClose={() => goalStore.set({ id: null })} /> : null;
}

function GoalDialog({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const insets = useLocalUi((s) => s.insets);
  const r = ev.goals.find((x) => x.goalId === goal.id);
  const c = r?.successChance ?? 0;
  const na = !r || !r.achievable || c <= 0;
  const branch = game.plan.branches.find((b) => b.id === r?.branchId);
  const locs = new Map(allParts(game.rocket).map((l) => [l.part.id, l]));
  const factors = [...(r?.factors ?? [])].filter((f) => locs.has(f.partId)).sort((a, b) => a.p - b.p);
  const optWeight = game.mission.goals.filter((x) => x.optional).reduce((n, x) => n + (x.bonusPoints ?? 1), 0);
  const share = goal.optional && optWeight > 0 ? Math.round(((goal.bonusPoints ?? 1) / optWeight) * 100) : 0;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div class="briefing-wrap goal-dialog-wrap" style={{ top: `${insets.top}px`, right: `${insets.right}px`, bottom: `${insets.bottom}px`, left: `${insets.left}px` }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section class={`briefing glass strong goal-dialog${goal.optional ? ' is-optional' : ''}`} role="dialog" aria-labelledby="goal-dialog-title">
        <div class="tb-label">{goal.optional ? 'Optional goal · bonus points' : 'Mission-critical goal'}</div>
        <h2 id="goal-dialog-title" class="briefing-title">{goal.name}</h2>
        <p>{goalAsk(goal)}</p>
        {goal.optional
          ? <p class="muted">The mission is complete without it. Achieving it earns {share} % of the bonus part of the score.</p>
          : <p class="muted">The mission needs this goal. It must be planned before launch, and it counts in the goal share of the score.</p>}
        <h3 class="goal-dialog-h">Status</h3>
        {na ? (
          <p class={/^The plan does not/.test(r?.reason ?? 'x') || !r ? 'muted' : 'err-text'}>{r?.reason ?? 'Not reached by the plan.'}</p>
        ) : (
          <>
            <div class="goal-dialog-chance">
              <span class="goal-bar"><span class={`gb-fill ${chanceClass(c)}`} style={{ width: `${Math.max(2, c * 100)}%` }} /></span>
              <span class={`num ${chanceClass(c)}`}>{pct(c)}</span>
            </div>
            <p class="muted">Chance of success, reached by {branch ? branchDisplayName(game, branch) : 'the plan'}.</p>
          </>
        )}
        {factors.length > 0 && (
          <>
            <h3 class="goal-dialog-h">Parts it depends on</h3>
            <ul class="goal-dialog-parts">
              {factors.map((f) => (
                <li key={f.partId}>
                  <button class="text-btn" title="Show this part in the Rocket panel" onClick={() => { highlightPart(f.partId); onClose(); }}>{partPlaceName(locs.get(f.partId)!)}</button>
                  <span class="num">{Math.round(f.p * 1000) / 10}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div class="briefing-foot"><button class="pill primary" autoFocus onClick={onClose}>Close</button></div>
      </section>
    </div>
  );
}

function GoalsCard() {
  const goals = usePlanner((g) => g.mission.goals);
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  return (
    <section class="card glass goals-card">
      <div class="card-top">
        <span class="label">Goals</span>
        <div class="spacer" />
        <span class="goal-hint">chance of success</span>
      </div>
      <ul class="goal-list thin-scroll">
        {[...goals].sort((a, b) => Number(!!a.optional) - Number(!!b.optional)).map((g, i, all) => {
          const r = ev.goals.find((x) => x.goalId === g.id);
          const c = r?.successChance ?? 0;
          const na = !r || !r.achievable || c <= 0;
          const reason = r?.reason ?? 'Not reached by the plan';
          const notPlanned = na && /^The plan does not/.test(reason);
          const branch = game.plan.branches.find((b) => b.id === r?.branchId);
          if (na) {
            return (
              <li key={g.id} class={`goal na ${notPlanned ? 'not-planned' : 'blocked'}${g.optional ? ' is-optional' : ''}${g.optional && !all[i - 1]?.optional ? ' first-optional' : ''}`} title={`${g.name}: ${reason}`} role="button" tabIndex={0} onClick={() => openGoal(g.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGoal(g.id); } }}>
                <span class="goal-name">{g.name}{g.optional ? <em class="goal-optional">Bonus</em> : null}</span>
                <span class="goal-status">{notPlanned ? 'Not planned' : 'Blocked'}</span>
                <span class="goal-reason">{reason}</span>
              </li>
            );
          }
          const cls = chanceClass(c);
          return (
            <li key={g.id} class={`goal${g.optional ? ' is-optional' : ''}${g.optional && !all[i - 1]?.optional ? ' first-optional' : ''}`} title={`${g.name}: ${pct(c)} success chance${branch ? ` · reached by ${branchDisplayName(game, branch)}` : ''}`} role="button" tabIndex={0} onClick={() => openGoal(g.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGoal(g.id); } }}>
              <span class="goal-name">{g.name}{g.optional ? <em class="goal-optional">Bonus</em> : null}</span>
              <span class="goal-bar"><span class={`gb-fill ${cls}`} style={{ width: `${Math.max(2, c * 100)}%` }} /></span>
              <span class={`goal-chance num ${cls}`}>{pct(c)}</span>
            </li>
          );
        })}
      </ul>
      <WeakestParts />
    </section>
  );
}

/**
 * The parts behind the goal chances, least reliable first (a chance is the product of its parts'
 * reliabilities). Science can test a delivered part, which halves its risk; Procurement chooses the supplier.
 */
function WeakestParts() {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const p = new Map<string, number>();
  for (const r of ev.goals) for (const f of r.factors ?? []) p.set(f.partId, f.p);
  if (!p.size) return null;
  const locs = new Map(allParts(game.rocket).map((l) => [l.part.id, l]));
  const tested = new Set(game.contracts.filter((c) => c.tested && c.status !== 'cancelled').map((c) => c.partId));
  const weakest = [...p].filter(([id]) => locs.has(id)).sort((a, b) => a[1] - b[1]).slice(0, 3);
  return (
    <div class="goal-weak">
      <span class="muted">Weakest parts (Science can test delivered parts):</span>
      {weakest.map(([id, rel]) => (
        <button key={id} class="text-btn" title="Show this part in the Rocket panel" onClick={() => highlightPart(id)}>
          {partPlaceName(locs.get(id)!)} <span class="num">{Math.round(rel * 1000) / 10}%</span>{tested.has(id) ? ' tested' : ''}
        </button>
      ))}
    </div>
  );
}

const SEV_ORDER = { error: 0, warning: 1, info: 2 } as const;

/** Readiness lines are summarised in the top row; per-part delivery items are not listed. */
function isDeliveryItem(i: Issue) {
  return i.code === 'delivery';
}

function ReadinessRow() {
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const r = partReadiness(game, ev);
  const soon = useClock((c) => game.plan.launchDay - c.day < 6 * DAYS_PER_MONTH);
  if (r.notDelivered === 0 && r.late === 0) return null;
  const sev: Severity = soon || r.late > 0 ? 'error' : 'warning';
  const parts: string[] = [];
  if (r.draft > 0) parts.push(`${plural(r.draft, 'part')} not ordered — launch will be scrubbed`);
  if (r.ordered > 0) parts.push(`${plural(r.ordered, 'part')} ordered, not delivered yet`);
  if (r.late > 0) parts.push(`${plural(r.late, 'delivery', 'deliveries')} after launch date`);
  return (
    <li class={`issue readiness ${sev} clickable`} title={`${parts.join(' · ')}\nClick to open the Rocket panel (part status and arrival dates)`}
      onClick={() => openTab('rocket')}>
      <SeverityIcon severity={sev} />
      <span class="issue-text">{parts.join(' · ')}</span>
    </li>
  );
}

function IssuesCard() {
  const ev = useEvaluation();
  const emptyPlan = usePlanner((g) => g.plan.branches.every((b) => b.maneuvers.length === 0));
  const [all, setAll] = useState(false);
  useEffect(() => {
    const showIssues = () => setAll(true);
    window.addEventListener('coordination-plan', showIssues);
    return () => window.removeEventListener('coordination-plan', showIssues);
  }, []);
  const list = ev.issues.filter((i) => !isDeliveryItem(i)).sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  const errors = ev.issues.filter((i) => i.severity === 'error').length;
  const warnings = ev.issues.filter((i) => i.severity === 'warning').length;
  const click = (i: Issue) => {
    if (i.partId) highlightPart(i.partId);
    else if (i.maneuverId) openManeuverEdit(i.maneuverId, i.branchId);
  };
  const row = (i: Issue, k: number) => (
    <li key={k} class={`issue ${i.severity}${i.maneuverId || i.partId ? ' clickable' : ''}`} title={i.message} onClick={() => click(i)}>
      <SeverityIcon severity={i.severity} />
      <span class="issue-text">{i.message}</span>
    </li>
  );
  const many = list.length > 3;
  const shown = all ? list : list.slice(0, 3);

  return (
    <div class="issues-slot">
      <section class={`card glass issues-card${all ? ' expanded' : ''}`}>
        <div class="card-top">
          <span class="label">Issues</span>
          <span class={`issue-count num${errors ? ' err-text' : ''}`}>{plural(errors, 'error')}</span>
          <span class={`issue-count num${warnings ? ' warn-text' : ''}`}>{plural(warnings, 'warning')}</span>
          <div class="spacer" />
          {many && <button class="text-btn" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show all ${list.length}`}</button>}
        </div>
        <ul class={`issue-list${all ? ' thin-scroll' : ''}`}>
          <ReadinessRow />
          {shown.map(row)}
          {list.length === 0 && (
            emptyPlan
              ? <li class="issue empty-note muted">Nothing planned yet.</li>
              : <li class="issue empty-note ok-text">No problems found by the live test.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
