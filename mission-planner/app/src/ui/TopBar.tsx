import { useRef, useState } from 'preact/hooks';
import {
  actions, budgetSpentM, useClock, useEvaluation, useGame, useUi,
} from '../state/store';
import { formatDay, formatDuration, formatMoney } from '../model/units';
import { GearIcon, localUi, toggleTab, useLocalUi, useOutsideClose } from './common';
import { Slider } from './Slider';

const NAV: { id: 'rocket' | 'tasks' | 'versions'; label: string }[] = [
  { id: 'rocket', label: 'Rocket' },
  { id: 'tasks', label: 'Procurement' },
  { id: 'versions', label: 'Versions' },
];

/** Floating header: wordmark, pill navigation, status chips. */
export function TopBar() {
  const mission = useGame((g) => g.mission);
  const devOpen = useLocalUi((s) => s.devOpen);
  return (
    <header class="topbar">
      <div class="brand" title={mission.briefing}>
        <div class="wordmark">MISSION PLANNER</div>
        <div class="brand-sub">{mission.name}</div>
      </div>
      <NavPills />
      <div class="tb-right">
        <CalendarChip />
        <BudgetChip />
        <LaunchChip />
        <button class={`round-btn${devOpen ? ' active' : ''}`} title="Dev controls (stand-in for procurement, science, comms)"
          onClick={() => localUi.update((s) => { s.devOpen = !s.devOpen; })}>
          <GearIcon />
        </button>
      </div>
    </header>
  );
}

function NavPills() {
  const tab = useUi((u) => u.sideTab);
  const open = useLocalUi((s) => s.panelOpen);
  const taskCount = useGame((g) => g.tasks.filter((t) => t.status === 'open' || t.status === 'changed').length);
  return (
    <nav class="nav-pills">
      {NAV.map((n) => {
        const active = open && tab === n.id;
        return (
          <button key={n.id} class={`nav-pill${active ? ' active' : ''}`}
            title={active ? 'Close panel' : `Open ${n.label}`} onClick={() => toggleTab(n.id)}>
            {n.label}
            {n.id === 'tasks' && taskCount > 0 && <span class="nav-count">{taskCount}</span>}
          </button>
        );
      })}
    </nav>
  );
}

function CalendarChip() {
  const startISO = useGame((g) => g.mission.startDateISO);
  const day = useClock((c) => Math.floor(c.day));
  const running = useClock((c) => c.running);
  const planning = useGame((g) => g.phase === 'planning');
  const flowing = running && planning;
  return (
    <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own' : 'Agency calendar paused'}>
      <span class={`pulse${flowing ? '' : ' still'}`} />
      <div class="chip-stack">
        <span class="chip-label">Agency date</span>
        <span class="chip-value num">{formatDay(day, startISO)}</span>
      </div>
    </div>
  );
}

function BudgetChip() {
  const budget = useGame((g) => g.mission.budgetM);
  const spent = useGame(budgetSpentM);
  const ev = useEvaluation();
  const over = ev.totalCostM > budget;
  return (
    <div class="chip-box budget-chip"
      title={`Committed ${formatMoney(spent)} (contracts minus refunds) · estimated total ${formatMoney(ev.totalCostM)} · budget ${formatMoney(budget)}`}>
      <div class="chip-stack">
        <span class="chip-label">Budget</span>
        <span class="chip-value num">
          <span class={over ? 'err-text' : ''}>{formatMoney(spent)}</span>
          <span class="muted"> / {formatMoney(budget)}</span>
        </span>
        <div class={`hairline${over ? ' over' : ''}`}>
          <div class="hl-est" style={{ width: `${Math.min(100, (ev.totalCostM / budget) * 100)}%` }} />
          <div class="hl-fill" style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function LaunchChip() {
  const mission = useGame((g) => g.mission);
  const phase = useGame((g) => g.phase);
  const launchDay = useGame((g) => g.plan.launchDay);
  const lateCount = useGame((g) => g.contracts.filter((c) => c.status === 'running' && c.deliveryDay > g.plan.launchDay).length);
  const today = useClock((c) => Math.ceil(c.day));
  const now = useClock((c) => Math.floor(c.day));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  const planning = phase === 'planning';
  const startISO = mission.startDateISO;
  const deadline = mission.completionDeadlineDay;
  const sliderMin = Math.min(today, deadline);
  const late = lateCount > 0;

  return (
    <div class="launch-wrap" ref={ref}>
      <button class={`chip-box chip-btn-box${late ? ' late' : ''}${open ? ' active' : ''}`}
        title={late ? `${lateCount} contract(s) deliver after the launch date` : 'Launch date'}
        onClick={() => setOpen(!open)}>
        <div class="chip-stack">
          <span class="chip-label">Launch{late ? ` · ${lateCount} late` : ''}</span>
          <span class="chip-value num">
            {formatDay(launchDay, startISO)}
            <span class="muted"> · in {formatDuration(Math.max(0, launchDay - now))}</span>
          </span>
        </div>
      </button>
      {open && (
        <div class="popover glass strong launch-pop">
          <div class="pop-row">
            <span class="label">Launch date</span>
            <span class={`big-num num${late ? ' err-text' : ''}`}>{formatDay(launchDay, startISO)}</span>
          </div>
          <div class="launch-slider">
            <button class="round-btn small" disabled={!planning || launchDay <= today} title="One day earlier"
              onClick={() => actions.setLaunchDay(launchDay - 1)}>−</button>
            <Slider min={sliderMin} max={Math.max(sliderMin + 1, deadline)} step={1} scale="linear"
              value={launchDay} disabled={!planning} onChange={(v) => actions.setLaunchDay(v)} />
            <button class="round-btn small" disabled={!planning || launchDay >= deadline} title="One day later"
              onClick={() => actions.setLaunchDay(launchDay + 1)}>+</button>
          </div>
          {late && <div class="err-line">{lateCount} contract{lateCount > 1 ? 's deliver' : ' delivers'} after this date</div>}
          <div class="deadline">
            <span>Mission deadline <b class="num">{formatDay(deadline, startISO)}</b></span>
            <span class="muted tiny">Goals reached after this date don't count. Launching later needs faster transfers.</span>
          </div>
          <button class="pill primary launch-now" disabled={!planning}
            onClick={() => {
              if (!confirm('Launch now? The final playthrough starts and planning ends.')) return;
              setOpen(false);
              actions.launchNow();
            }}>
            Launch now
          </button>
        </div>
      )}
    </div>
  );
}
