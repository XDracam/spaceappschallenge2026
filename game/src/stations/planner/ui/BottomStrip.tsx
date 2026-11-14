import { useState } from 'preact/hooks';
import type { Issue, ManeuverType, Severity } from '../model/types';
import { uiStore, useClock, useEvaluation, usePlanner, useUi } from '../state/store';
import { DAYS_PER_MONTH, formatDv } from '../model/units';
import {
  SeverityIcon, branchColor, branchDisplayName, chanceClass, highlightPart, openManeuverEdit, openTab, partReadiness, pct, plural,
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

function GoalsCard() {
  const goals = usePlanner((g) => g.mission.goals);
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  return (
    <section class="card glass goals-card">
      <div class="card-top"><span class="label">Goals</span></div>
      <ul class="goal-list thin-scroll">
        {goals.map((g) => {
          const r = ev.goals.find((x) => x.goalId === g.id);
          const c = r?.successChance ?? 0;
          const na = !r || !r.achievable || c <= 0;
          const reason = r?.reason ?? 'Not reached by the plan';
          const notPlanned = na && /^The plan does not/.test(reason);
          const branch = game.plan.branches.find((b) => b.id === r?.branchId);
          if (na) {
            return (
              <li key={g.id} class={`goal na ${notPlanned ? 'not-planned' : 'blocked'}`} title={`${g.name}: ${reason}`}>
                <span class="goal-name">{g.name}</span>
                <span class="goal-status">{notPlanned ? 'Not planned' : 'Blocked'}</span>
                <span class="goal-reason">{reason}</span>
              </li>
            );
          }
          const cls = chanceClass(c);
          return (
            <li key={g.id} class="goal" title={`${g.name}: ${pct(c)} success chance${branch ? ` · reached by ${branchDisplayName(game, branch)}` : ''}`}>
              <span class="goal-name">{g.name}</span>
              <span class="goal-bar"><span class={`gb-fill ${cls}`} style={{ width: `${Math.max(2, c * 100)}%` }} /></span>
              <span class={`goal-chance num ${cls}`}>{pct(c)}</span>
            </li>
          );
        })}
      </ul>
    </section>
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
