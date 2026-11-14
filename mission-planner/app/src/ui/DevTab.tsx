import { useState } from 'preact/hooks';
import type { ProcurementTask } from '../model/types';
import {
  actions, cancellationRefundM, clockActions, clockStore, devActions, gameStore, useClock, useGame,
} from '../state/store';
import { PART_KIND_LABEL, VARIANTS, estimatedCostM, makePart, statDefs, unlockKey, variantLabel } from '../data/parts';
import { findPart } from '../model/rocketUtils';
import { DAYS_PER_MONTH, DEFAULT_DAYS_PER_SECOND, formatDay, formatMoney } from '../model/units';
import { PauseIcon, PlayIcon, fmtNum, pct } from './common';
import { MinimumsTable } from './TasksTab';
import type { PartKind } from '../model/types';

const SUPPLIERS = ['Orbital Works', 'Kestrel Aerospace', 'Novaline Systems', 'Helios Dynamics', 'Meridian Space'];

export const SPEED_PRESETS = [
  { label: '1 min = 1 mo', dps: DEFAULT_DAYS_PER_SECOND },
  { label: '×4', dps: DEFAULT_DAYS_PER_SECOND * 4 },
  { label: '×16', dps: DEFAULT_DAYS_PER_SECOND * 16 },
];

export function DevTab() {
  const phase = useGame((g) => g.phase);
  return (
    <div class="dev-tab">
      <fieldset disabled={phase !== 'planning'} class="plain">
        <CalendarSection />
        <ProcurementSection />
        <ScienceSection />
      </fieldset>
      <section>
        <h3>Game</h3>
        <button class="btn danger" onClick={() => confirm('Reset the whole game? All progress is lost.') && actions.resetGame()}>
          Reset game
        </button>
      </section>
    </div>
  );
}

function CalendarSection() {
  const running = useClock((c) => c.running);
  const dps = useClock((c) => c.daysPerSecond);
  const day = useClock((c) => Math.floor(c.day));
  const launchDay = useGame((g) => g.plan.launchDay);
  const startISO = useGame((g) => g.mission.startDateISO);
  return (
    <section>
      <h3>Calendar</h3>
      <div class="muted small">Today {formatDay(day, startISO)} · launch {formatDay(launchDay, startISO)}</div>
      <div class="inline wrap">
        <button class="btn small" onClick={() => clockActions.setRunning(!running)}>
          {running ? <PauseIcon /> : <PlayIcon />} {running ? 'Pause' : 'Play'}
        </button>
        {SPEED_PRESETS.map((s) => (
          <button class={`btn small${Math.abs(dps - s.dps) < 1e-9 ? ' active' : ''}`} onClick={() => clockActions.setSpeed(s.dps)}>{s.label}</button>
        ))}
      </div>
      <div class="inline wrap">
        <button class="btn small" onClick={() => clockActions.advance(DAYS_PER_MONTH)}>+1 month</button>
        <button class="btn small" onClick={() => clockActions.advance(DAYS_PER_MONTH * 6)}>+6 months</button>
        <button class="btn small warn" onClick={() => confirm('Jump to the launch date? The playthrough starts.') && clockActions.advance(launchDay - clockStore.get().day)}>
          Jump to launch
        </button>
      </div>
    </section>
  );
}

function ProcurementSection() {
  const tasks = useGame((g) => g.tasks);
  const contracts = useGame((g) => g.contracts);
  const parts = useGame((g) => g.rocket);
  const day = useClock((c) => Math.floor(c.day));
  const startISO = useGame((g) => g.mission.startDateISO);
  const open = tasks.filter((t) => t.status === 'open' || t.status === 'changed');
  const running = contracts.filter((c) => c.status === 'running');
  return (
    <section>
      <h3>Procurement</h3>
      {open.length === 0 && <p class="empty">No open tasks.</p>}
      {open.map((t) => <ContractForm key={t.id} task={t} />)}
      <h4>Running contracts</h4>
      {running.length === 0 && <p class="empty">No running contracts.</p>}
      {running.map((c) => {
        const refund = cancellationRefundM(c, day);
        const name = findPart(parts, c.partId)?.part.name ?? c.partSnapshot.name;
        return (
          <div class="card dev-card" key={c.id}>
            <div class="card-head"><b>{name}</b><span class="muted small">{c.supplier}</span></div>
            <div class="muted small num">{formatMoney(c.priceM)} · delivery {formatDay(c.deliveryDay, startISO)} · rel. {pct(c.reliability)}</div>
            <div class="inline">
              <button class="btn small" onClick={() => devActions.deliverContract(c.id)}>Deliver now</button>
              <button class="btn small danger" onClick={() => confirm(`Cancel the contract? Refund ${formatMoney(refund)} of ${formatMoney(c.priceM)}.`) && devActions.cancelContract(c.id)}>
                Cancel (refund {formatMoney(refund)})
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function ContractForm({ task }: { task: ProcurementTask }) {
  const estimate = (() => {
    const loc = findPart(gameStore.get().rocket, task.partId);
    const p = loc ? loc.part : makePart(task.partId, task.partKind, task.variant);
    return estimatedCostM({ ...p, stats: { ...task.minimums } });
  })();
  const [supplier, setSupplier] = useState(SUPPLIERS[task.id.length % SUPPLIERS.length]);
  const [price, setPrice] = useState(Math.round(estimate * 10) / 10);
  const [months, setMonths] = useState(12);
  const [rel, setRel] = useState(task.beyondResearch.length > 0 ? 0.85 : 0.97);
  const [bonus, setBonus] = useState(0);
  const [massDelta, setMassDelta] = useState(0);
  const num = (set: (v: number) => void) => (e: Event) => {
    const v = Number((e.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(v)) set(v);
  };

  return (
    <div class="card dev-card">
      <div class="card-head">
        <span class={`chip t-${task.status}`}>{task.status}</span>
        <b>{task.partName}</b>
        {task.beyondResearch.length > 0 && <span class="badge beyond">beyond research</span>}
      </div>
      <MinimumsTable task={task} />
      <div class="form-grid">
        <label>Supplier<input value={supplier} onInput={(e) => setSupplier((e.currentTarget as HTMLInputElement).value)} /></label>
        <label>Price (M)<input type="number" step="0.1" value={price} onInput={num(setPrice)} /></label>
        <label>Delivery (months)<input type="number" step="1" min="0" value={months} onInput={num(setMonths)} /></label>
        <label>Reliability (0–1)<input type="number" step="0.01" min="0" max="1" value={rel} onInput={num(setRel)} /></label>
        <label>Stat bonus %<input type="number" step="1" value={bonus} onInput={num(setBonus)} /></label>
        <label>Mass delta %<input type="number" step="1" value={massDelta} onInput={num(setMassDelta)} /></label>
      </div>
      <div class="inline">
        <span class="muted small">Estimate {formatMoney(estimate)}</span>
        <div class="spacer" />
        <button class="btn small primary" onClick={() => devActions.contractTask(task.id, {
          supplier: supplier || 'Supplier', priceM: price, deliveryMonths: months,
          reliability: Math.min(1, Math.max(0, rel)), statBonusPct: bonus, massDeltaPct: massDelta,
        })}>Sign contract</button>
      </div>
    </div>
  );
}

const ALL_RESEARCH_KEYS: { key: string; label: string; unit: string; factor: number }[] = (() => {
  const out: { key: string; label: string; unit: string; factor: number }[] = [];
  for (const kind of Object.keys(VARIANTS) as PartKind[]) {
    if (kind === 'tank') continue;
    for (const v of VARIANTS[kind]) {
      for (const d of statDefs(kind, v)) {
        out.push({
          key: `${kind}.${v}.${d.key}`,
          label: `${kind === 'engine' ? variantLabel(kind, v) + ' engine' : variantLabel(kind, v)} · ${d.label}`,
          unit: d.displayUnit ?? d.unit,
          factor: d.displayFactor ?? 1,
        });
      }
    }
  }
  return out;
})();

function ScienceSection() {
  const research = useGame((g) => g.research);
  const unlocked = useGame((g) => g.unlocked);
  const extra = Object.keys(research).filter((k) => !ALL_RESEARCH_KEYS.some((r) => r.key === k));
  return (
    <section>
      <h3>Science: research limits</h3>
      <p class="hint">Empty = no limit. Values in display units.</p>
      <table class="mini-table research-table">
        <tbody>
          {ALL_RESEARCH_KEYS.map((r) => (
            <tr key={r.key}>
              <td title={r.key}>{r.label}</td>
              <td>
                <input type="number" class="num-input" placeholder="none"
                  value={research[r.key] !== undefined ? Number((research[r.key] * r.factor).toPrecision(6)) : ''}
                  onChange={(e) => {
                    const raw = (e.currentTarget as HTMLInputElement).value;
                    const v = Number(raw);
                    if (raw === '') devActions.clearResearchLimit(r.key);
                    else if (Number.isFinite(v)) devActions.setResearchLimit(r.key, v / r.factor);
                  }} />
              </td>
              <td class="muted">{r.unit}</td>
            </tr>
          ))}
          {extra.map((k) => (
            <tr key={k}><td>{k}</td><td class="num">{fmtNum(research[k])}</td><td /></tr>
          ))}
        </tbody>
      </table>
      <h3>Science: unlocks</h3>
      <div class="unlock-grid">
        {(Object.keys(VARIANTS) as PartKind[]).flatMap((kind) => VARIANTS[kind].map((v) => {
          const key = unlockKey(kind, v);
          return (
            <label class="check" key={key} title={key}>
              <input type="checkbox" checked={unlocked.includes(key)} onChange={(e) => devActions.setUnlocked(key, (e.currentTarget as HTMLInputElement).checked)} />
              {PART_KIND_LABEL[kind]}{VARIANTS[kind].length > 1 ? ` · ${variantLabel(kind, v)}` : ''}
            </label>
          );
        }))}
      </div>
    </section>
  );
}
