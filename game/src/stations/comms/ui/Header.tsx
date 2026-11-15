import { useGame } from '../../../core/store';
import { DAYS_PER_MONTH, uiStore, useBudgetLeft, useFlightLost, useGoalsAchieved, useLaunched, useMission, useScrubbed, useStartISO, useToday, useUi } from './store';
import { GearIcon } from './common';
import { formatDay, formatDuration, formatMoney, formatRealTime } from './format';

/** Floating header: wordmark + mission, Today / Budget / Launch chips (shared state), Dev pill. */
export function Header() {
  const devOpen = useUi((u) => u.devOpen);
  const mission = useMission();
  return (
    <header class="header">
      <div class="brand">
        <div class="wordmark">COMMUNICATIONS</div>
        <div class="brand-sub">{mission.name}</div>
      </div>
      <div class="spacer" />
      <div class="chips">
        <TodayChip />
        <BudgetChip />
        <LaunchChip />
        {import.meta.env.DEV && (
          <button class={`pill dev-pill${devOpen ? ' active' : ''}`} title="Debug: fire events, inspect flags and news"
            onClick={() => uiStore.update((u) => { u.devOpen = !u.devOpen; })}>
            <GearIcon /> Dev
          </button>
        )}
      </div>
    </header>
  );
}

/** After the launch: what happened, in one word (a scrub or a lost flight is not "launched"). */
function useLaunchWord(): string {
  const scrubbed = useScrubbed();
  const lost = useFlightLost();
  return scrubbed ? 'scrubbed' : lost ? 'flight lost' : 'launched';
}

function TodayChip() {
  const launched = useLaunched();
  const word = useLaunchWord();
  const day = useToday();
  const running = useGame((s) => s.clock.running);
  const startISO = useStartISO();
  const dps = useGame((s) => s.clock.daysPerSecond);
  const months = +((dps * 60) / DAYS_PER_MONTH).toFixed(1);
  const flowing = running && !launched;
  return (
    <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own' : 'Agency calendar stopped'}>
      <span class={`pulse${flowing ? '' : ' still'}`} />
      <div class="chip-stack">
        <span class="chip-label">Today</span>
        <span class="chip-value num">{formatDay(day, startISO)}</span>
        <span class="chip-sub">{launched ? (word === 'scrubbed' ? 'launch scrubbed' : word) : running ? `1 min = ${months} month${months === 1 ? '' : 's'}` : 'calendar stopped'}</span>
      </div>
    </div>
  );
}

function BudgetChip() {
  const left = useBudgetLeft();
  const total = useGame((s) => s.budget.fundingTotalM);
  const ratio = total > 0 ? Math.max(0, left) / total : 0;
  const tone = left < 0 ? 'err' : ratio < 0.1 ? 'warn' : '';
  return (
    <div class={`chip-box budget-chip${tone ? ` ${tone}` : ''}`} title="Shared mission budget: available (after spending and signed contracts) of total funding">
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
  const launchDay = useGame((s) => s.planner.plan.launchDay);
  const launched = useLaunched();
  const word = useLaunchWord();
  const goals = useGoalsAchieved();
  const running = useGame((s) => s.clock.running);
  const now = useToday();
  const startISO = useStartISO();
  const realSec = useGame((s) => Math.ceil(Math.max(0, launchDay - s.clock.day) / Math.max(1e-9, s.clock.daysPerSecond)));
  if (launched) {
    return (
      <div class={`chip-box launched-chip${word !== 'launched' ? ' scrubbed' : ''}`}>
        <div class="chip-stack">
          <span class="chip-label">Launch</span>
          <span class="chip-value">{word.toUpperCase()}</span>
          <span class="chip-sub num">{formatDay(launchDay, startISO)}{goals && word !== 'scrubbed' ? ` · ${goals} goals` : ''}</span>
        </div>
      </div>
    );
  }
  const soon = running && realSec < 60;
  return (
    <div class={`chip-box${soon ? ' soon' : ''}`} title="Planned launch (set by the mission planner)">
      <div class="chip-stack">
        <span class="chip-label">Launch</span>
        <span class="chip-value num">
          {formatDay(launchDay, startISO)}
          <span class={soon ? 'warn-text' : 'muted'}> · {running ? `in ${formatRealTime(realSec)}` : `in ${formatDuration(Math.max(0, launchDay - now))}`}</span>
        </span>
        <span class="chip-sub">{running ? 'real time at current speed' : 'calendar stopped'}</span>
      </div>
    </div>
  );
}
