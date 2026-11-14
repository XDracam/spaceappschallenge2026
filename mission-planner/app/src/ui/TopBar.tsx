import { useRef, useState } from 'preact/hooks';
import {
  actions, budgetSpentM, clockStore, gameStore, getEvaluation, useClock, useEvaluation, useGame, useUi,
} from '../state/store';
import { DAYS_PER_MONTH, formatDay, formatDuration } from '../model/units';
import {
  GearIcon, fmtMoneyShort, formatRealTime, localUi, openTab, partReadiness, plural, useLocalUi, useOutsideClose,
} from './common';
import { Slider } from './Slider';
import { openBriefing } from './Briefing';

// The planner station has no Procurement panel (D-006: procurement is another station's job).
const NAV: { id: 'rocket' | 'versions'; label: string }[] = [
  { id: 'rocket', label: 'Rocket' },
  { id: 'versions', label: 'Versions' },
];

/** Floating header: wordmark, pill navigation, status chips. */
export function TopBar() {
  const mission = useGame((g) => g.mission);
  const devOpen = useLocalUi((s) => s.devOpen);
  const launched = useGame((g) => g.phase !== 'planning');
  return (
    <header class="topbar">
      <button class="brand" title="Show the mission briefing" onClick={openBriefing}>
        <div class="wordmark">MISSION PLANNER</div>
        <div class="brand-sub">{mission.name}</div>
      </button>
      <NavPills />
      <div class="tb-right">
        <CalendarChip />
        {!launched && <BudgetChip />}
        {launched ? <LaunchedChip /> : <LaunchChip />}
        <button class={`pill dev-pill${devOpen ? ' active' : ''}`} title="Stand-in controls for other roles"
          onClick={() => localUi.update((s) => { s.devOpen = !s.devOpen; })}>
          <GearIcon /> Dev
        </button>
      </div>
    </header>
  );
}

function NavPills() {
  const tab = useUi((u) => u.sideTab);
  const open = useLocalUi((s) => s.panelOpen);
  return (
    <nav class="nav-pills">
      {NAV.map((n) => {
        const active = open && (tab === 'versions' ? 'versions' : 'rocket') === n.id;
        return (
          <button key={n.id} class={`nav-pill${active ? ' active' : ''}`}
            title={active ? `${n.label} is open (× on the panel closes it)` : `Open ${n.label}`} onClick={() => openTab(n.id)}>
            {n.label}
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
  const dps = useClock((c) => c.daysPerSecond);
  const planning = useGame((g) => g.phase === 'planning');
  const flowing = running && planning;
  const months = +((dps * 60) / DAYS_PER_MONTH).toFixed(1);
  const rate = `1 min = ${months} month${months === 1 ? '' : 's'}`;
  return (
    <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own, in real time' : 'Agency calendar paused'}>
      <span class={`pulse${flowing ? '' : ' still'}`} />
      <div class="chip-stack">
        <span class="chip-label">Today</span>
        <span class="chip-value num">{formatDay(day, startISO)}</span>
        <span class="chip-sub">{!planning ? 'launched' : running ? rate : 'paused'}</span>
      </div>
    </div>
  );
}

function BudgetChip() {
  const budget = useGame((g) => g.mission.budgetM);
  const spent = useGame(budgetSpentM);
  const ev = useEvaluation();
  const cost = ev.totalCostM;
  const ratio = cost / budget;
  const tone = ratio > 1 ? 'err' : ratio > 0.9 ? 'warn' : '';
  return (
    <div class={`chip-box budget-chip${tone ? ` ${tone}` : ''}`}
      title={`Estimated total cost ${fmtMoneyShort(cost)} of the ${fmtMoneyShort(budget)} budget. Signed contracts so far: ${fmtMoneyShort(spent)}.`}>
      <div class="chip-stack">
        <span class="chip-label">Budget</span>
        <span class="chip-value num">
          <span class={tone ? `${tone}-text` : ''}>{fmtMoneyShort(cost)}</span>
          <span class="muted"> of {fmtMoneyShort(budget)}</span>
        </span>
        <div class="budget-sub">
          <div class={`budget-bar${tone ? ` ${tone}` : ''}`}>
            <div class="bb-est" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
            <div class="bb-fill" style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
          </div>
          <span class="chip-sub num">{fmtMoneyShort(spent)} signed</span>
        </div>
      </div>
    </div>
  );
}

function LaunchedChip() {
  const launchDay = useGame((g) => g.plan.launchDay);
  const tDays = useUi((u) => (u.playthrough ? Math.max(0, Math.floor(u.playthrough.day - launchDay)) : 0));
  return (
    <div class="chip-box launched-chip">
      <div class="chip-stack">
        <span class="chip-value num">LAUNCHED · T+{tDays} d</span>
      </div>
    </div>
  );
}

function LaunchChip() {
  const mission = useGame((g) => g.mission);
  const phase = useGame((g) => g.phase);
  const launchDay = useGame((g) => g.plan.launchDay);
  const game = useGame((g) => g);
  const ev = useEvaluation();
  const ready = partReadiness(game, ev);
  const running = useClock((c) => c.running);
  const today = useClock((c) => Math.ceil(c.day));
  const now = useClock((c) => Math.floor(c.day));
  const realSec = useClock((c) => Math.ceil(Math.max(0, launchDay - c.day) / c.daysPerSecond));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  const planning = phase === 'planning';
  const startISO = mission.startDateISO;
  const deadline = mission.completionDeadlineDay;
  const sliderMin = Math.min(today, deadline);
  const problem = ready.draft > 0 ? `${plural(ready.draft, 'part')} not ordered`
    : ready.late > 0 ? `${plural(ready.late, 'delivery', 'deliveries')} after launch` : '';
  const soon = running && realSec < 60;
  const countdown = running ? `in ${formatRealTime(realSec)}` : `in ${formatDuration(Math.max(0, launchDay - now))} (paused)`;
  const realMin = Math.max(0, Math.round(realSec / 60));

  const launchNow = () => {
    const g = gameStore.get();
    const r = partReadiness(g, getEvaluation());
    const todayStr = formatDay(Math.ceil(clockStore.get().day), startISO);
    const lines = [`Launch today (${todayStr}) instead of ${formatDay(g.plan.launchDay, startISO)}?`];
    if (r.notDelivered > 0) lines.push(`${plural(r.notDelivered, 'part')} ${r.notDelivered === 1 ? 'is' : 'are'} not delivered — the launch will be scrubbed.`);
    lines.push('This ends planning.');
    if (!confirm(lines.join('\n\n'))) return;
    setOpen(false);
    actions.launchNow();
  };

  return (
    <div class="launch-wrap" ref={ref}>
      <button class={`chip-box chip-btn-box${problem ? ' late' : ''}${open ? ' active' : ''}`}
        title="Launch date: click to change it" onClick={() => setOpen(!open)}>
        <div class="chip-stack">
          <span class="chip-label">Launch</span>
          <span class="chip-value num">
            {formatDay(launchDay, startISO)}
            <span class={soon ? 'warn-text' : 'muted'}> · {countdown}</span>
          </span>
          {problem
            ? <span class="chip-sub err-text">{problem}</span>
            : <span class="chip-sub">{ready.ordered > 0 ? `${plural(ready.ordered, 'delivery', 'deliveries')} pending` : 'all parts delivered'}</span>}
        </div>
      </button>
      {open && (
        <div class="popover glass strong launch-pop">
          <div class="pop-row">
            <span class="label">Launch date</span>
            <span class={`big-num num${problem ? ' err-text' : ''}`}>{formatDay(launchDay, startISO)}</span>
            <span class="muted small">≈ {realMin} real minute{realMin === 1 ? '' : 's'} from now{running ? '' : ' (clock paused)'}</span>
          </div>
          <div class="launch-slider">
            <Slider min={sliderMin} max={Math.max(sliderMin + 1, deadline)} step={7} scale="linear"
              value={launchDay} disabled={!planning} onChange={(v) => actions.setLaunchDay(v)} />
            <div class="ls-deadline-mark" title={`Mission deadline ${formatDay(deadline, startISO)}`} />
            <div class="ls-ends muted tiny">
              <span>Today</span>
              <span class="ls-deadline">Deadline {formatDay(deadline, startISO)}</span>
            </div>
          </div>
          {problem && <div class="err-line">{problem}{ready.draft > 0 ? ' — the launch will be scrubbed' : ''}</div>}
          <div class="deadline">
            <span>All goals must be done by <b class="num">{formatDay(deadline, startISO)}</b>.</span>
            <span class="muted tiny">Launching later needs faster transfers.</span>
          </div>
          <button class="btn launch-now" disabled={!planning} onClick={launchNow}>Launch now</button>
        </div>
      )}
    </div>
  );
}
