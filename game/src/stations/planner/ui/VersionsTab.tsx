import { useState } from 'preact/hooks';
import { requestConfirmation } from '../../../shared/confirmation';
import type { Goal, GoalKind } from '../model/types';
import { actions, useEvaluation, usePlanner } from '../state/store';
import { formatDay, formatMass, formatMoney } from '../model/units';
import { bodyName, chanceClass, pct } from './common';

function overall(chances: Record<string, number>, goalIds: string[]): number {
  if (goalIds.length === 0) return 0;
  return goalIds.reduce((s, id) => s + (chances[id] ?? 0), 0) / goalIds.length;
}

const KIND_SHORT: Record<GoalKind, string> = {
  orbit: 'Orbit', orbitData: 'Orbit data', land: 'Landing', surfaceData: 'Surface data', return: 'Return',
};

/** Short column names; the body is added only when two goals share a kind. */
function shortGoalNames(goals: Goal[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of goals) {
    const dup = goals.some((o) => o !== g && o.kind === g.kind);
    out[g.id] = dup ? `${KIND_SHORT[g.kind]} ${bodyName(g.body)}` : KIND_SHORT[g.kind];
  }
  return out;
}

export function VersionsTab() {
  const versions = usePlanner((g) => g.versions);
  const goals = usePlanner((g) => g.mission.goals);
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const [name, setName] = useState('');
  const [compare, setCompare] = useState(false);
  const goalIds = goals.map((g) => g.id);
  const short = shortGoalNames(goals);

  const save = () => {
    actions.saveVersion(name.trim() || undefined);
    setName('');
  };

  const current = {
    totalMassT: ev.totalMassT,
    totalCostM: ev.totalCostM,
    goalChances: Object.fromEntries(ev.goals.map((r) => [r.goalId, r.successChance])),
    failed: ev.branches.some((b) => b.failedAtManeuverId !== undefined),
  };
  const breakdown = (ch: Record<string, number>) => goals.map((g) => `${g.name}: ${pct(ch[g.id] ?? 0)}`).join('\n');

  return (
    <div class="versions-tab">
      <div class="save-row">
        <input placeholder="Version name (optional)" value={name} aria-label="Version name"
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && save()} />
        <button class="pill primary small" onClick={save}>Save version</button>
      </div>

      <div class="list-head">
        <span class="label">{versions.length} saved</span>
        <div class="spacer" />
        <button class={`pill small${compare ? ' active' : ''}`} aria-pressed={compare} onClick={() => setCompare(!compare)} disabled={versions.length === 0}
          title="Compare mass, cost and goal chances side by side">
          Compare
        </button>
      </div>

      {compare && versions.length > 0 && (
        <div class="compare-wrap thin-scroll">
          <table class="compare">
            <thead>
              <tr>
                <th>Version</th>
                <th>Mass</th>
                <th>Cost</th>
                {goals.map((g) => <th key={g.id} title={g.name}>{short[g.id]}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr class="current">
                <td>Current design{current.failed && <span class="err-text" title="Plan fails"> ✕</span>}</td>
                <td class="num">{formatMass(current.totalMassT)}</td>
                <td class="num">{formatMoney(current.totalCostM)}</td>
                {goals.map((g) => {
                  const c = current.goalChances[g.id] ?? 0;
                  return <td key={g.id} class={`num ${chanceClass(c)}-text`}>{pct(c)}</td>;
                })}
              </tr>
              {[...versions].reverse().map((v) => (
                <tr key={v.id}>
                  <td>{v.name}{v.summary.failed && <span class="err-text" title="Plan fails"> ✕</span>}</td>
                  <td class="num">{formatMass(v.summary.totalMassT)}</td>
                  <td class="num">{formatMoney(v.summary.totalCostM)}</td>
                  {goals.map((g) => {
                    const c = v.summary.goalChances[g.id] ?? 0;
                    return <td key={g.id} class={`num ${chanceClass(c)}-text`}>{pct(c)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {versions.length === 0 && (
        <div class="empty">Save a version to compare rocket designs. The live test checks the current design.</div>
      )}
      {[...versions].reverse().map((v) => {
        const o = overall(v.summary.goalChances, goalIds);
        return (
          <div class="row pv-row" key={v.id}>
            <div class="pv-main">
              <span class="pv-name">{v.name}</span>
              <span class="pv-meta">
                <span class="num">{formatDay(v.savedDay, startISO)}</span>
                <span class={`num ${chanceClass(o)}-text`} title={`Mean goal success chance\n${breakdown(v.summary.goalChances)}`}>goals avg {pct(o)}</span>
                {v.summary.failed && <span class="pv-fails" title="The flight plan in this version does not complete">plan fails</span>}
              </span>
            </div>
            <div class="pv-actions">
              <button class="pill small" title="Load this version's rocket and plan"
                onClick={async () => { if (await requestConfirmation('Restore this rocket and plan? Ordered parts keep their contracts.', 'Restore version')) actions.restoreVersion(v.id); }}>
                Restore
              </button>
              <button class="pill small ghost danger" title="Delete this saved version"
                onClick={async () => { if (await requestConfirmation(`Delete version “${v.name}”?`, 'Delete version')) actions.deleteVersion(v.id); }}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
