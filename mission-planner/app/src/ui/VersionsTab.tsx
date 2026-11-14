import { useState } from 'preact/hooks';
import { actions, useEvaluation, useGame } from '../state/store';
import { formatDay, formatMass, formatMoney } from '../model/units';
import { chanceClass, pct } from './common';

export function VersionsTab() {
  const versions = useGame((g) => g.versions);
  const goals = useGame((g) => g.mission.goals);
  const startISO = useGame((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const [name, setName] = useState('');
  const [compare, setCompare] = useState(false);

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

  return (
    <div class="tab-pad">
      <div class="inline save-row">
        <input placeholder="Version name (optional)" value={name}
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && save()} />
        <button class="btn primary small" onClick={save}>Save version</button>
      </div>
      <div class="inline">
        <button class={`btn small${compare ? ' active' : ''}`} onClick={() => setCompare(!compare)} disabled={versions.length === 0}>
          {compare ? 'Hide comparison' : 'Compare versions'}
        </button>
      </div>

      {compare && (
        <div class="compare-wrap">
          <table class="compare">
            <thead>
              <tr>
                <th>Version</th>
                <th>Mass</th>
                <th>Cost</th>
                {goals.map((g) => <th title={g.name}>{g.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr class="current">
                <td>Working design{current.failed && <span class="err-text"> ✕</span>}</td>
                <td class="num">{formatMass(current.totalMassT)}</td>
                <td class="num">{formatMoney(current.totalCostM)}</td>
                {goals.map((g) => {
                  const c = current.goalChances[g.id] ?? 0;
                  return <td class={`num ${chanceClass(c)}-text`}>{pct(c)}</td>;
                })}
              </tr>
              {[...versions].reverse().map((v) => (
                <tr>
                  <td>{v.name}{v.summary.failed && <span class="err-text" title="Plan fails"> ✕</span>}</td>
                  <td class="num">{formatMass(v.summary.totalMassT)}</td>
                  <td class="num">{formatMoney(v.summary.totalCostM)}</td>
                  {goals.map((g) => {
                    const c = v.summary.goalChances[g.id] ?? 0;
                    return <td class={`num ${chanceClass(c)}-text`}>{pct(c)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {versions.length === 0 && <p class="empty">No saved versions. Sending a part to procurement also saves one.</p>}
      {[...versions].reverse().map((v) => (
        <div class="card version-card" key={v.id}>
          <div class="card-head">
            <b>{v.name}</b>
            {v.summary.failed && <span class="chip t-cancelled">plan fails</span>}
            <div class="spacer" />
            <span class="muted small">{formatDay(v.savedDay, startISO)}</span>
          </div>
          <div class="derived">
            <span>Mass <b class="num">{formatMass(v.summary.totalMassT)}</b></span>
            <span>Cost <b class="num">{formatMoney(v.summary.totalCostM)}</b></span>
          </div>
          <div class="goal-chips">
            {goals.map((g) => {
              const c = v.summary.goalChances[g.id] ?? 0;
              return <span class={`mini-chip ${chanceClass(c)}`} title={g.name}>{g.name}: {pct(c)}</span>;
            })}
          </div>
          <div class="inline">
            <button class="btn small" onClick={() => confirm(`Restore “${v.name}”? The working design is replaced (save it first to keep it).`) && actions.restoreVersion(v.id)}>
              Restore
            </button>
            <button class="btn small danger ghost" onClick={() => confirm(`Delete version “${v.name}”?`) && actions.deleteVersion(v.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
