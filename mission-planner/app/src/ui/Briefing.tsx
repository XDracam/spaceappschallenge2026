import { createStore, useStore } from '../state/createStore';
import { clockActions, gameStore, useClock, useGame } from '../state/store';
import { formatDay } from '../model/units';
import { fmtMoneyShort, useLocalUi } from './common';

// One-time mission briefing, centred over the free map area.

const SEEN_KEY = 'mission-planner.briefing.seen';

function seenBefore(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

const briefingStore = createStore({ open: !seenBefore() });
// The agency calendar waits while the briefing is open.
if (briefingStore.get().open) clockActions.setRunning(false);

export function openBriefing() {
  briefingStore.set({ open: true });
  clockActions.setRunning(false);
}

function closeBriefing() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage unavailable: the briefing shows again next load */
  }
  briefingStore.set({ open: false });
  if (gameStore.get().phase === 'planning') clockActions.setRunning(true);
}

export function Briefing() {
  const open = useStore(briefingStore, (s) => s.open);
  const mission = useGame((g) => g.mission);
  const phase = useGame((g) => g.phase);
  const launchDay = useGame((g) => g.plan.launchDay);
  const insets = useLocalUi((s) => s.insets);
  const minutes = useClock((c) => Math.max(0, Math.round((launchDay - c.day) / c.daysPerSecond / 60)));
  if (!open || phase !== 'planning') return null;
  const start = mission.startDateISO;
  return (
    <div class="briefing-wrap" style={{ top: `${insets.top}px`, right: `${insets.right}px`, bottom: `${insets.bottom}px`, left: `${insets.left}px` }}
      onKeyDown={(e) => { if (e.key === 'Escape') closeBriefing(); }}>
      <section class="briefing glass strong" role="dialog" aria-labelledby="briefing-title">
        <div class="tb-label">Mission briefing</div>
        <h2 id="briefing-title" class="briefing-title">Mission: {mission.name}</h2>
        <p>
          All goals must be done by <b class="num">{formatDay(mission.completionDeadlineDay, start)}</b>.
          Budget <b class="num">{fmtMoneyShort(mission.budgetM)}</b>. Each goal scores separately:
        </p>
        <ul class="briefing-goals">
          {mission.goals.map((g) => <li key={g.id}>{g.name}</li>)}
        </ul>
        <ol class="briefing-steps">
          <li>Plan the route on the map.</li>
          <li>Fix problems until the Issues card is clear.</li>
          <li>Order every part before launch (Rocket → Order all parts).</li>
          <li>At the launch date the mission flies once — watch what happens.</li>
        </ol>
        <p class="briefing-clock">
          The game clock runs in real time: <b>1 real minute = 1 month</b>. Launch is set
          to <b class="num">{formatDay(launchDay, start)}</b> (≈ {minutes} minute{minutes === 1 ? '' : 's'} from now).
        </p>
        <div class="briefing-foot">
          <button class="pill primary" autoFocus onClick={closeBriefing}>Start planning</button>
        </div>
      </section>
    </div>
  );
}
