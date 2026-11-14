import { useState } from 'preact/hooks';
import type { Issue } from '../model/types';
import { uiStore, useEvaluation, useGame, useUi } from '../state/store';
import { formatDv } from '../model/units';
import { SeverityIcon, branchColor, chanceClass, highlightPart, openManeuverEdit, pct } from './common';

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

function DvCard() {
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
    <section class="card glass dv-card">
      <div class="card-top">
        <span class="label">Δv budget</span>
        {branches.length > 1 && (
          <div class="branch-chips">
            {branches.map((b, i) => (
              <button class={`mini-pill${b.id === branch?.id ? ' active' : ''}`} key={b.id} title={b.name}
                onClick={() => uiStore.update((u) => { u.selectedBranchId = b.id; })}>
                <span class="dot" style={{ background: branchColor(i) }} />{b.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div class="big-line" title={`Required ${formatDv(required)} · available ${formatDv(available)}${short ? ' — not enough Δv' : ''}`}>
        <span class={`big-num num${short ? ' err-text' : ''}`}>{km(required)}</span>
        <span class="big-sep num"> / {km(available)}</span>
        <span class="unit">km/s</span>
        <span class="muted tiny big-note">required / available</span>
      </div>
      {!br || (br.maneuvers.length === 0 && br.stageBands.length === 0) ? (
        <div class="muted small">No results yet for this branch.</div>
      ) : (
        <div class="seg-bars">
          <div class="seg-bar">
            {br.maneuvers.map((m) => {
              const w = (m.dvRequiredMs / scale) * 100;
              return (
                <button key={m.maneuverId}
                  class={`seg${m.ok ? '' : ' bad'}${m.maneuverId === selManeuver ? ' selected' : ''}${w < 0.6 ? ' zero' : ''}`}
                  style={{ width: w < 0.6 ? undefined : `${w}%`, '--seg': branchColor(idx) }}
                  title={`${m.label}: ${formatDv(m.dvRequiredMs)}${m.ok ? '' : ' — fails here'}`}
                  onClick={() => openManeuverEdit(m.maneuverId, m.branchId)} />
              );
            })}
          </div>
          <div class="seg-bar stages">
            {br.stageBands.map((s) => {
              const w = (s.dvTotalMs / scale) * 100;
              const used = s.dvTotalMs > 0 ? Math.min(1, s.dvUsedMs / s.dvTotalMs) : 0;
              return (
                <div key={s.stageId} class="band" style={{ width: `${w}%` }}
                  title={`${s.ownerName} · ${s.stageName}: ${formatDv(s.dvTotalMs)} (used ${formatDv(s.dvUsedMs)})`}>
                  <div class="band-fill" style={{ width: `${used * 100}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function GoalsCard() {
  const goals = useGame((g) => g.mission.goals);
  const branches = useGame((g) => g.plan.branches);
  const ev = useEvaluation();
  return (
    <section class="card glass goals-card">
      <div class="card-top"><span class="label">Goals</span></div>
      <ul class="goal-list thin-scroll">
        {goals.map((g) => {
          const r = ev.goals.find((x) => x.goalId === g.id);
          const c = r?.successChance ?? 0;
          const na = !r || !r.achievable;
          const bi = branches.findIndex((b) => b.id === r?.branchId);
          const cls = na ? 'err' : chanceClass(c);
          const tip = na
            ? r?.reason ?? 'Not reached by the plan'
            : `${pct(c)} success chance${bi >= 0 ? ` · reached on ${branches[bi].name}` : ''}`;
          return (
            <li key={g.id} title={`${g.name}: ${tip}`}>
              <span class="goal-name">{g.name}</span>
              <span class="goal-bar"><span class={`gb-fill ${cls}`} style={{ width: na ? '0%' : `${Math.max(2, c * 100)}%` }} /></span>
              <span class={`goal-chance num ${cls}`}>{na ? '—' : pct(c)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SEV_ORDER = { error: 0, warning: 1, info: 2 } as const;

function isNotProcured(i: Issue) {
  return i.severity === 'info' && i.code === 'delivery' && /not procured yet$/.test(i.message);
}

function IssuesCard() {
  const ev = useEvaluation();
  const [all, setAll] = useState(false);
  const [showNp, setShowNp] = useState(false);
  const issues = [...ev.issues].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  const notProcured = issues.filter(isNotProcured);
  const main = issues.filter((i) => !isNotProcured(i));
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const click = (i: Issue) => {
    if (i.maneuverId) openManeuverEdit(i.maneuverId, i.branchId);
    else if (i.partId) highlightPart(i.partId);
  };
  const row = (i: Issue, k: number) => (
    <li key={k} class={`issue ${i.severity}${i.maneuverId || i.partId ? ' clickable' : ''}`} title={i.message} onClick={() => click(i)}>
      <SeverityIcon severity={i.severity} />
      <span class="issue-text">{i.message}</span>
    </li>
  );
  const shown = all ? main : main.slice(0, 3);

  return (
    <div class="issues-slot">
      <section class={`card glass issues-card${all ? ' expanded' : ''}`}>
        <div class="card-top">
          <span class="label">Issues</span>
          <div class="spacer" />
          {(main.length > 3 || notProcured.length > 0) && (
            <button class="text-btn" onClick={() => setAll(!all)}>{all ? 'Show less' : 'Show all'}</button>
          )}
        </div>
        <div class="issue-counts">
          <span class={`big-num num${errors ? ' err-text' : ''}`}>{errors}</span>
          <span class="muted small">errors</span>
          <span class={`big-num num small-big${warnings ? ' warn-text' : ''}`}>{warnings}</span>
          <span class="muted small">warnings</span>
        </div>
        {main.length === 0 && !all ? (
          <div class="ok-text small">No problems found by the live test.</div>
        ) : (
          <ul class={`issue-list${all ? ' thin-scroll' : ''}`}>
            {shown.map(row)}
            {all && notProcured.length > 0 && (
              <>
                <li class="issue info clickable np-head" onClick={() => setShowNp(!showNp)}>
                  <SeverityIcon severity="info" />
                  <span class="issue-text">{notProcured.length} parts not procured</span>
                  <span class="muted tiny">{showNp ? 'hide' : 'show'}</span>
                </li>
                {showNp && notProcured.map((i, k) => row(i, 1000 + k))}
              </>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
