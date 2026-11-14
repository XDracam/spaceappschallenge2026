import { DAYS_PER_MONTH, uiStore, useClock, useComms, useUi } from '../state/store';
import { GearIcon } from './common';
import { formatDay, formatDuration, formatMoney, formatRealTime } from './format';

/** Floating header: wordmark + mission, Today / Budget / Launch chips, Dev pill. */
export function Header() {
  const missionName = useComms((s) => s.missionName);
  const devOpen = useUi((u) => u.devOpen);
  return (
    <header class="header">
      <div class="brand">
        <div class="wordmark">COMMUNICATIONS</div>
        <div class="brand-sub">{missionName}</div>
      </div>
      <div class="spacer" />
      <div class="chips">
        <TodayChip />
        <BudgetChip />
        <LaunchChip />
        <button class={`pill dev-pill${devOpen ? ' active' : ''}`} title="Stand-in controls for the other stations"
          onClick={() => uiStore.update((u) => { u.devOpen = !u.devOpen; })}>
          <GearIcon /> Dev
        </button>
      </div>
    </header>
  );
}

function TodayChip() {
  const startISO = useComms((s) => s.startDateISO);
  const launched = useComms((s) => s.phase === 'launched');
  const day = useClock((c) => Math.floor(c.day));
  const running = useClock((c) => c.running);
  const dps = useClock((c) => c.daysPerSecond);
  const months = +((dps * 60) / DAYS_PER_MONTH).toFixed(1);
  const flowing = running && !launched;
  return (
    <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own' : 'Agency calendar stopped'}>
      <span class={`pulse${flowing ? '' : ' still'}`} />
      <div class="chip-stack">
        <span class="chip-label">Today</span>
        <span class="chip-value num">{formatDay(day, startISO)}</span>
        <span class="chip-sub">{launched ? 'launched' : running ? `1 min = ${months} month${months === 1 ? '' : 's'}` : 'paused'}</span>
      </div>
    </div>
  );
}

function BudgetChip() {
  const left = useComms((s) => s.budgetM);
  const total = useComms((s) => s.budgetTotalM);
  const ratio = total > 0 ? Math.max(0, left) / total : 0;
  const tone = left < 0 ? 'err' : ratio < 0.1 ? 'warn' : '';
  return (
    <div class={`chip-box budget-chip${tone ? ` ${tone}` : ''}`} title="Shared mission budget: remaining of total">
      <div class="chip-stack">
        <span class="chip-label">Budget</span>
        <span class="chip-value num">
          <span class={tone ? `${tone}-text` : ''}>{formatMoney(left)}</span>
          <span class="muted"> of {formatMoney(total)}</span>
        </span>
        <div class="budget-bar"><div class="bb-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
      </div>
    </div>
  );
}

function LaunchChip() {
  const startISO = useComms((s) => s.startDateISO);
  const launchDay = useComms((s) => s.launchDay);
  const launched = useComms((s) => s.phase === 'launched');
  const running = useClock((c) => c.running);
  const now = useClock((c) => Math.floor(c.day));
  const realSec = useClock((c) => Math.ceil(Math.max(0, launchDay - c.day) / Math.max(1e-9, c.daysPerSecond)));
  if (launched) {
    return (
      <div class="chip-box launched-chip">
        <div class="chip-stack">
          <span class="chip-label">Launch</span>
          <span class="chip-value">LAUNCHED</span>
          <span class="chip-sub num">{formatDay(launchDay, startISO)}</span>
        </div>
      </div>
    );
  }
  const soon = running && realSec < 60;
  return (
    <div class={`chip-box${soon ? ' soon' : ''}`} title="Planned launch (set by the planner; dev drawer stand-in)">
      <div class="chip-stack">
        <span class="chip-label">Launch</span>
        <span class="chip-value num">
          {formatDay(launchDay, startISO)}
          <span class={soon ? 'warn-text' : 'muted'}> · {running ? `in ${formatRealTime(realSec)}` : `in ${formatDuration(Math.max(0, launchDay - now))}`}</span>
        </span>
        <span class="chip-sub">{running ? 'real time at current speed' : 'calendar paused'}</span>
      </div>
    </div>
  );
}
