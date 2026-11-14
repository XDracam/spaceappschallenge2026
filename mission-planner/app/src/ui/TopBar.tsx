import {
  actions, budgetSpentM, clockActions, clockStore, useClock, useEvaluation, useGame,
} from '../state/store';
import { DAYS_PER_MONTH, formatDay, formatDuration, formatMoney } from '../model/units';
import { PauseIcon, PlayIcon, WarnIcon } from './common';
import { SPEED_PRESETS } from './DevTab';

function speedLabel(dps: number): string {
  const monthsPerMin = (dps * 60) / DAYS_PER_MONTH;
  const whole = Math.abs(monthsPerMin - Math.round(monthsPerMin)) < 0.01;
  return `1 min = ${whole || monthsPerMin >= 10 ? Math.round(monthsPerMin) : monthsPerMin.toFixed(1)} mo`;
}

export function TopBar() {
  const mission = useGame((g) => g.mission);
  const phase = useGame((g) => g.phase);
  const launchDay = useGame((g) => g.plan.launchDay);
  const spent = useGame(budgetSpentM);
  const lateCount = useGame((g) => g.contracts.filter((c) => c.status === 'running' && c.deliveryDay > g.plan.launchDay).length);
  const ev = useEvaluation();
  const day = useClock((c) => Math.floor(c.day));
  const running = useClock((c) => c.running);
  const dps = useClock((c) => c.daysPerSecond);
  const planning = phase === 'planning';
  const today = useClock((c) => Math.ceil(c.day));
  const sliderMin = Math.min(today, mission.launchDeadlineDay);
  const overBudget = ev.totalCostM > mission.budgetM;

  const cycleSpeed = () => {
    const i = SPEED_PRESETS.findIndex((s) => Math.abs(s.dps - dps) < 1e-9);
    clockActions.setSpeed(SPEED_PRESETS[(i + 1) % SPEED_PRESETS.length].dps);
  };

  return (
    <header class="topbar">
      <div class="tb-mission" title={mission.briefing}>
        <div class="tb-label">Mission</div>
        <div class="tb-title">{mission.name}</div>
      </div>

      <div class="tb-group">
        <div class="tb-label">Agency calendar</div>
        <div class="inline">
          <button class="btn icon-btn" disabled={!planning} title={running ? 'Pause calendar' : 'Run calendar'}
            onClick={() => clockActions.setRunning(!running)}>
            {running ? <PauseIcon /> : <PlayIcon />}
          </button>
          <span class="tb-date num">{formatDay(day, mission.startDateISO)}</span>
          <button class="btn small ghost" title="Change calendar speed" disabled={!planning} onClick={cycleSpeed}>{speedLabel(dps)}</button>
        </div>
      </div>

      <div class="tb-group tb-launch">
        <div class="tb-label">
          Launch date
          {lateCount > 0 && (
            <span class="err-text" title={`${lateCount} contract(s) deliver after the launch date`}> <WarnIcon /> {lateCount} late</span>
          )}
        </div>
        <div class="inline">
          <input type="range" class="plain-range" min={sliderMin} max={mission.launchDeadlineDay} step={1}
            value={launchDay} disabled={!planning}
            onInput={(e) => actions.setLaunchDay(Number((e.currentTarget as HTMLInputElement).value))} />
          <button class="btn icon-btn" disabled={!planning || launchDay <= today} title="One day earlier" onClick={() => actions.setLaunchDay(launchDay - 1)}>−</button>
          <button class="btn icon-btn" disabled={!planning || launchDay >= mission.launchDeadlineDay} title="One day later" onClick={() => actions.setLaunchDay(launchDay + 1)}>+</button>
          <span class={`tb-date num${lateCount > 0 ? ' err-text' : ''}`}>{formatDay(launchDay, mission.startDateISO)}</span>
          <span class="muted small num nowrap">in {formatDuration(launchDay - clockStore.get().day)}</span>
          <button class="btn small warn" disabled={!planning}
            onClick={() => {
              if (!confirm('Launch now? The final playthrough starts and planning ends.')) return;
              actions.launchNow();
            }}>
            Launch now
          </button>
        </div>
        <div class="muted tiny">Deadline {formatDay(mission.launchDeadlineDay, mission.startDateISO)}</div>
      </div>

      <div class="tb-group tb-budget">
        <div class="tb-label">Budget</div>
        <div class="num">
          <span title="Committed: contract prices minus refunds">{formatMoney(spent)}</span>
          <span class="muted"> committed · </span>
          <span class={overBudget ? 'err-text' : ''} title="Estimated total cost of the design">{formatMoney(ev.totalCostM)}</span>
          <span class="muted"> est. / </span>
          <b>{formatMoney(mission.budgetM)}</b>
        </div>
        <div class="budget-bar" title="Committed and estimated cost against the mission budget">
          <div class="bb-est" style={{ width: `${Math.min(100, (ev.totalCostM / mission.budgetM) * 100)}%` }} />
          <div class="bb-spent" style={{ width: `${Math.min(100, (spent / mission.budgetM) * 100)}%` }} />
        </div>
      </div>
    </header>
  );
}
