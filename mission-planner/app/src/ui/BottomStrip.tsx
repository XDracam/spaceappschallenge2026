import type { Issue } from '../model/types';
import { uiStore, useEvaluation, useGame, useUi } from '../state/store';
import { formatDv } from '../model/units';
import { SeverityIcon, branchColor, chanceClass, highlightPart, openManeuverEdit, pct } from './common';

export function BottomStrip() {
  return (
    <div class="bottom-strip">
      <DvBar />
      <Goals />
      <Issues />
    </div>
  );
}

function DvBar() {
  const branches = useGame((g) => g.plan.branches);
  const selected = useUi((u) => u.selectedBranchId);
  const selManeuver = useUi((u) => u.selectedManeuverId);
  const ev = useEvaluation();
  const idx = Math.max(0, branches.findIndex((b) => b.id === selected));
  const branch = branches[idx];
  const br = ev.branches.find((b) => b.branchId === branch?.id);
  const required = br?.dvRequiredTotalMs ?? 0;
  const available = br?.dvAvailableTotalMs ?? 0;
  const scale = Math.max(required, available, 1);
  const short = required > available + 0.5;

  return (
    <section class="strip-section dv-section">
      <div class="strip-head">
        <h4>Δv budget</h4>
        {branches.length > 1 && (
          <div class="chips">
            {branches.map((b, i) => (
              <button class={`chip-btn${b.id === branch?.id ? ' active' : ''}`} key={b.id}
                onClick={() => uiStore.update((u) => { u.selectedBranchId = b.id; })}>
                <span class="dot" style={{ background: branchColor(i) }} />{b.name}
              </button>
            ))}
          </div>
        )}
        <div class="spacer" />
        <span class={`num small${short ? ' err-text' : ''}`}>
          required <b>{formatDv(required)}</b> / available <b>{formatDv(available)}</b>
        </span>
      </div>
      {!br || (br.maneuvers.length === 0 && br.stageBands.length === 0) ? (
        <p class="empty">No results yet for this branch.</p>
      ) : (
        <div class="dv-bar">
          <div class="dv-row-label">Maneuvers</div>
          <div class="dv-row">
            {br.maneuvers.map((m) => {
              const w = (m.dvRequiredMs / scale) * 100;
              return (
                <button key={m.maneuverId}
                  class={`dv-seg${m.ok ? '' : ' bad'}${m.maneuverId === selManeuver ? ' selected' : ''}${w < 0.5 ? ' zero' : ''}`}
                  style={{ width: w < 0.5 ? undefined : `${w}%`, borderColor: branchColor(idx) }}
                  title={`${m.label}: ${formatDv(m.dvRequiredMs)}${m.ok ? '' : ' — fails here'}`}
                  onClick={() => openManeuverEdit(m.maneuverId, m.branchId)}>
                  <span class="seg-label">{m.label}</span>
                  <span class="seg-dv num">{formatDv(m.dvRequiredMs)}</span>
                </button>
              );
            })}
          </div>
          <div class="dv-row-label">Stages</div>
          <div class="dv-row">
            {br.stageBands.map((s) => {
              const w = (s.dvTotalMs / scale) * 100;
              const used = s.dvTotalMs > 0 ? Math.min(1, s.dvUsedMs / s.dvTotalMs) : 0;
              return (
                <div key={s.stageId} class="dv-band" style={{ width: `${w}%` }}
                  title={`${s.ownerName} · ${s.stageName}: ${formatDv(s.dvTotalMs)} (used ${formatDv(s.dvUsedMs)})`}>
                  <div class="band-fill" style={{ width: `${used * 100}%` }} />
                  <span class="seg-label">{s.stageName}</span>
                  <span class="seg-dv num">{formatDv(s.dvTotalMs)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Goals() {
  const goals = useGame((g) => g.mission.goals);
  const branches = useGame((g) => g.plan.branches);
  const ev = useEvaluation();
  return (
    <section class="strip-section goals-section">
      <div class="strip-head"><h4>Goals</h4></div>
      <ul class="goal-list">
        {goals.map((g) => {
          const r = ev.goals.find((x) => x.goalId === g.id);
          const c = r?.successChance ?? 0;
          const bi = branches.findIndex((b) => b.id === r?.branchId);
          return (
            <li key={g.id} title={r && !r.achievable ? r.reason ?? 'Not reached by the plan' : r?.branchId ? `Reached on ${branches[bi]?.name ?? r.branchId}` : undefined}>
              {bi >= 0 ? <span class="dot" style={{ background: branchColor(bi) }} /> : <span class="dot hollow" />}
              <span class="goal-name">{g.name}</span>
              <span class={`goal-chance num ${chanceClass(c)}`}>{r && !r.achievable ? '—' : pct(c)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SEV_ORDER = { error: 0, warning: 1, info: 2 } as const;

function Issues() {
  const ev = useEvaluation();
  const issues = [...ev.issues].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  const click = (i: Issue) => {
    if (i.maneuverId) openManeuverEdit(i.maneuverId, i.branchId);
    else if (i.partId) highlightPart(i.partId);
  };
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  return (
    <section class="strip-section issues-section">
      <div class="strip-head">
        <h4>Issues</h4>
        <span class="muted small">{errors} errors · {warnings} warnings</span>
      </div>
      {issues.length === 0 ? (
        <p class="empty ok-text">No issues found by the live test.</p>
      ) : (
        <ul class="issue-list">
          {issues.map((i, k) => (
            <li key={k} class={`issue ${i.severity}${i.maneuverId || i.partId ? ' clickable' : ''}`} onClick={() => click(i)}>
              <SeverityIcon severity={i.severity} />
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
