import { formatMoneyM } from '../../../shared/format';
import { useEffect, useRef, useState } from 'preact/hooks';
import { requestConfirmation } from '../../../shared/confirmation';
import { actions, getClock, getPlanner, getEvaluation, useClock, useEvaluation, usePlanner, useUi } from '../state/store';
import { DAYS_PER_MONTH, formatDay, formatDuration } from '../model/units';
import {
  fmtMoneyShort, formatRealTime, openTab, partReadiness, plural, useLocalUi, useOutsideClose,
} from './common';
import { Slider } from './Slider';
import { openBriefing } from './Briefing';
import { useAdvanced } from './advanced';
import { isScrubbed } from '../result';

/** The launch was scrubbed (a part was missing): nothing flew. */
const useScrubbed = () => useUi((u) => !!u.playthrough && isScrubbed(u.playthrough.result));

// The planner station has no Procurement panel (D-006: procurement is another station's job).
const NAV: { id: 'rocket' | 'versions'; label: string }[] = [
  { id: 'rocket', label: 'Rocket' },
  { id: 'versions', label: 'Versions' },
];

/** Floating header: wordmark, pill navigation, status chips. */
export function TopBar() {
  const mission = usePlanner((g) => g.mission);
  const launched = usePlanner((g) => g.phase !== 'planning');
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
      </div>
    </header>
  );
}

function NavPills() {
  const tab = useUi((u) => u.sideTab);
  const open = useLocalUi((s) => s.panelOpen);
  // Versions is an advanced tool (Rocket panel → Advanced switch).
  const advanced = useAdvanced();
  return (
    <nav class="nav-pills">
      {NAV.filter((n) => advanced || n.id !== 'versions').map((n) => {
        const active = open && (tab === 'versions' && advanced ? 'versions' : 'rocket') === n.id;
        return (
          <button key={n.id} class={`nav-pill${active ? ' active' : ''}`} aria-expanded={active} aria-controls="planner-side-panel"
            title={active ? `${n.label} is open (× on the panel closes it)` : `Open ${n.label}`} onClick={() => openTab(n.id)}>
            {n.label}
          </button>
        );
      })}
    </nav>
  );
}

function CalendarChip() {
  const startISO = usePlanner((g) => g.mission.startDateISO);
  const day = useClock((c) => Math.floor(c.day));
  const running = useClock((c) => c.running);
  const dps = useClock((c) => c.daysPerSecond);
  const planning = usePlanner((g) => g.phase === 'planning');
  const scrubbed = useScrubbed();
  const flowing = running && planning;
  const months = +((dps * 60) / DAYS_PER_MONTH).toFixed(1);
  const rate = `1 min = ${months} month${months === 1 ? '' : 's'}`;
  return (
    <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own, in real time' : 'Agency calendar paused'}>
      <span class={`pulse${flowing ? '' : ' still'}`} />
      <div class="chip-stack">
        <span class="chip-label">Today</span>
        <span class="chip-value num">{formatDay(day, startISO)}</span>
        <span class="chip-sub">{!planning ? (scrubbed ? 'launch scrubbed' : 'launched') : running ? rate : 'paused'}</span>
      </div>
    </div>
  );
}

function BudgetChip() {
  const budget = usePlanner((g) => g.budget);
  const ev = useEvaluation();
  // Shared agency budget: available = funding − spent − committed (all stations).
  const avail = budget.availableM;
  const toBuy = ev.uncontractedCostM;
  const used = budget.spentM + budget.committedM;
  const total = Math.max(1, budget.totalM);
  const ratio = avail > 0 ? toBuy / avail : toBuy > 0 ? 2 : 0;
  const tone = avail < 0 || ratio > 1 ? 'err' : ratio > 0.9 ? 'warn' : '';
  return (
    <div class={`chip-box budget-chip${tone ? ` ${tone}` : ''}`}
      title={`Agency budget ${formatMoneyM(budget.totalM)}: ${formatMoneyM(budget.spentM)} spent, ${formatMoneyM(budget.committedM)} committed to contracts, ${formatMoneyM(avail)} available. Parts not contracted yet cost about ${formatMoneyM(toBuy)}.`}>
      <div class="chip-stack">
        <span class="chip-label">Budget</span>
        <span class="chip-value num">
          <span class={tone ? `${tone}-text` : ''}>{fmtMoneyShort(avail)}</span>
          <span class="muted"> available</span>
        </span>
        <div class="budget-sub">
          <div class={`budget-bar${tone ? ` ${tone}` : ''}`}>
            <div class="bb-est" style={{ width: `${Math.min(100, ((used + toBuy) / total) * 100)}%` }} />
            <div class="bb-fill" style={{ width: `${Math.min(100, (used / total) * 100)}%` }} />
          </div>
          <span class="chip-sub num">≈ {fmtMoneyShort(toBuy)} to buy</span>
        </div>
      </div>
    </div>
  );
}

function LaunchedChip() {
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const tDays = useUi((u) => (u.playthrough ? Math.max(0, Math.floor(u.playthrough.day - launchDay)) : 0));
  const scrubbed = useScrubbed();
  return (
    <div class={`chip-box launched-chip${scrubbed ? ' scrubbed' : ''}`}>
      <div class="chip-stack">
        <span class="chip-value num">{scrubbed ? 'LAUNCH SCRUBBED' : `LAUNCHED · T+${tDays} d`}</span>
      </div>
    </div>
  );
}

function LaunchChip() {
  const mission = usePlanner((g) => g.mission);
  const phase = usePlanner((g) => g.phase);
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const game = usePlanner((g) => g);
  const ev = useEvaluation();
  const ready = partReadiness(game, ev);
  const running = useClock((c) => c.running);
  const today = useClock((c) => Math.ceil(c.day));
  const now = useClock((c) => Math.floor(c.day));
  const realSec = useClock((c) => (c.daysPerSecond > 0 ? Math.ceil(Math.max(0, launchDay - c.day) / c.daysPerSecond) : Infinity));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  useEffect(() => {
    const showLaunch = () => setOpen(true);
    window.addEventListener('coordination-launch', showLaunch);
    return () => window.removeEventListener('coordination-launch', showLaunch);
  }, []);
  const planning = phase === 'planning';
  const startISO = mission.startDateISO;
  const deadline = mission.completionDeadlineDay;
  const sliderMin = Math.min(today, deadline);
  const problem = ready.draft > 0 ? `${plural(ready.draft, 'part')} not ordered`
    : ready.late > 0 ? `${plural(ready.late, 'delivery', 'deliveries')} late` : '';
  const soon = running && realSec < 60;
  const timed = running && Number.isFinite(realSec);
  const countdown = timed ? `in ${formatRealTime(realSec)}` : `in ${formatDuration(Math.max(0, launchDay - now))} (paused)`;
  const realMin = timed ? Math.max(0, Math.round(realSec / 60)) : 0;

  const launchNow = async () => {
    const g = getPlanner();
    const r = partReadiness(g, getEvaluation());
    const todayStr = formatDay(Math.ceil(getClock().day), startISO);
    const lines = [`Launch today (${todayStr}) instead of ${formatDay(g.plan.launchDay, startISO)}?`];
    if (r.notDelivered > 0) lines.push(`${plural(r.notDelivered, 'part')} ${r.notDelivered === 1 ? 'is' : 'are'} not delivered — the launch will be scrubbed.`);
    lines.push('This ends planning.');
    if (!await requestConfirmation(lines.join('\n\n'), 'Launch now')) return;
    setOpen(false);
    actions.launchNow();
  };

  return (
    <div class="launch-wrap" ref={ref}>
      <button class={`chip-box chip-btn-box${problem ? ' late' : ''}${open ? ' active' : ''}`}
        title="Launch date: click to change it" onClick={() => setOpen(!open)}>
        <div class="chip-stack">
          <span class="chip-label">Launch · <span class="chip-change">change ▾</span></span>
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
            <span class="muted small">{timed ? `≈ ${realMin} real minute${realMin === 1 ? '' : 's'} from now` : 'calendar paused'}</span>
          </div>
          <div class="launch-slider">
            <Slider label="Launch date" valueText={formatDay(launchDay, startISO)} min={sliderMin} max={Math.max(sliderMin + 1, deadline)} step={7} scale="linear"
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
