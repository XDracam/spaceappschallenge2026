import { useState } from 'preact/hooks';
import { actions, useEvaluation, useGame } from '../state/store';
import { formatDay, formatMass, formatMoney } from '../model/units';
import { RestoreIcon, TrashIcon, chanceClass, pct } from './common';

function overall(chances: Record<string, number>, goalIds: string[]): number {
  if (goalIds.length === 0) return 0;
  return goalIds.reduce((s, id) => s + (chances[id] ?? 0), 0) / goalIds.length;
}

export function VersionsTab() {
  const versions = useGame((g) => g.versions);
  const goals = useGame((g) => g.mission.goals);
  const startISO = useGame((g) => g.mission.startDateISO);
  const ev = useEvaluation();
  const [name, setName] = useState('');
  const [compare, setCompare] = useState(false);
  const goalIds = goals.map((g) => g.id);

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
        <input placeholder="Version name (optional)" value={name}
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && save()} />
        <button class="pill primary small" onClick={save}>Save version</button>
      </div>

      <div class="list-head">
        <span class="label">{versions.length} saved</span>
        <div class="spacer" />
        <button class={`pill small${compare ? ' active' : ''}`} onClick={() => setCompare(!compare)} disabled={versions.length === 0}
          title="Compare mass, cost and goal chances">
          Compare
        </button>
      </div>

      {compare && (
        <div class="compare-wrap thin-scroll">
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
                  <td title={v.name}>{v.name}{v.summary.failed && <span class="err-text" title="Plan fails"> ✕</span>}</td>
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

      {versions.length === 0 && <div class="empty" title="Sending a part to procurement also saves a version">No saved versions.</div>}
      {[...versions].reverse().map((v) => {
        const o = overall(v.summary.goalChances, goalIds);
        return (
          <div class="row version-row" key={v.id} title={`Cost ${formatMoney(v.summary.totalCostM)}\n${breakdown(v.summary.goalChances)}`}>
            <div class="row-name">
              {v.name}
              <span class="row-sub num">{formatDay(v.savedDay, startISO)} · {formatMass(v.summary.totalMassT)}</span>
            </div>
            {v.summary.failed && <span class="err-mark" title="Plan fails">!</span>}
            <span class={`row-num num big-pct ${chanceClass(o)}-text`} title="Mean goal success chance">{pct(o)}</span>
            <button class="round-btn small" title="Restore this version"
              onClick={() => confirm(`Restore “${v.name}”? The working design is replaced (save it first to keep it).`) && actions.restoreVersion(v.id)}>
              <RestoreIcon />
            </button>
            <button class="round-btn small danger" title="Delete version"
              onClick={() => confirm(`Delete version “${v.name}”?`) && actions.deleteVersion(v.id)}>
              <TrashIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
