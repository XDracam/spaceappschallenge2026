import { useEffect, useRef } from 'preact/hooks';
import { useDialog } from '../../../shared/useDialog';
import { createStore, useStore } from '../../../core/createStore';
import { useClock, usePlanner } from '../state/store';
import { DAYS_PER_MONTH, formatDay } from '../model/units';
import { fmtMoneyShort, useLocalUi } from './common';

// One-time mission briefing, centred over the free map area.

// Seen once per mission: a new mission shows its own briefing.
const SEEN_KEY = 'mission-planner.briefing.seen';
const seenKey = (missionId: string) => `${SEEN_KEY}.${missionId}`;

function seenBefore(missionId: string): boolean {
  try {
    return localStorage.getItem(seenKey(missionId)) === '1';
  } catch {
    return false;
  }
}

// The shared calendar keeps running while it is open (other stations are playing).
const briefingStore = createStore({ open: false, missionId: '' });

export function openBriefing() {
  briefingStore.set({ ...briefingStore.get(), open: true });
}

function closeBriefing() {
  const { missionId } = briefingStore.get();
  try {
    localStorage.setItem(seenKey(missionId), '1');
  } catch {
    /* storage unavailable: the briefing shows again next load */
  }
  briefingStore.set({ open: false, missionId });
}

export function Briefing() {
  const open = useStore(briefingStore, (s) => s.open);
  const mission = usePlanner((g) => g.mission);
  useEffect(() => {
    if (briefingStore.get().missionId !== mission.id) briefingStore.set({ open: !seenBefore(mission.id), missionId: mission.id });
  }, [mission.id]);
  const phase = usePlanner((g) => g.phase);
  const launchDay = usePlanner((g) => g.plan.launchDay);
  const insets = useLocalUi((s) => s.insets);
  const hasRoute = usePlanner(g => g.plan.branches.some(branch => branch.maneuvers.length > 0));
  const budgetM = usePlanner((g) => g.budget.totalM);
  const root = useRef<HTMLElement>(null);
  const clockRunning = useClock(c => c.running);
  const monthsPerMinute = useClock(c => Number((c.daysPerSecond * 60 / DAYS_PER_MONTH).toFixed(1)));
  useDialog({ open: open && phase === 'planning', root, modal: false, onClose: closeBriefing });
  const minutes = useClock((c) => (c.daysPerSecond > 0 ? Math.max(0, Math.round((launchDay - c.day) / c.daysPerSecond / 60)) : 0));
  if (!open || phase !== 'planning') return null;
  const start = mission.startDateISO;
  return (
    <div class="briefing-wrap" style={{ top: `${insets.top}px`, right: `${insets.right}px`, bottom: `${insets.bottom}px`, left: `${insets.left}px` }}>
      <section ref={root} tabIndex={-1} class="briefing glass strong" role="dialog" aria-labelledby="briefing-title">
        <h2 id="briefing-title" class="briefing-title">Mission: {mission.name}</h2>
        <p>{mission.briefing}</p>
        <p>
          Deadline <b class="num">{formatDay(mission.completionDeadlineDay, start)}</b>.
          Budget <b class="num">{fmtMoneyShort(budgetM)}</b>. Each goal scores separately.
        </p>
        <div class="briefing-subhead">Mission-critical</div>
        <ul class="briefing-goals">
          {mission.goals.filter((g) => !g.optional).map((g) => <li key={g.id}>{g.name}</li>)}
        </ul>
        <p><b>{hasRoute ? 'First action: review the route and Issues card.' : 'First action: add Launch from Earth to your route.'}</b> You can revise the route and rocket in any order.</p>
        <details class="briefing-details">
          <summary>Optional goals, mission details &amp; how to play</summary>
        {mission.goals.some((g) => g.optional) && (
          <>
            <div class="briefing-subhead">Optional · bonus points</div>
            <p>The mission is complete without these, and the budget is tight for all of them together.</p>
            <ul class="briefing-goals optional">
              {mission.goals.filter((g) => g.optional).map((g) => <li key={g.id}>{g.name}</li>)}
            </ul>
          </>
        )}
        {mission.ideas?.length ? (
          <>
            <h3 class="briefing-subhead">New in this mission</h3>
            <ul class="briefing-ideas">
              {mission.ideas.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </>
        ) : null}
        <ol class="briefing-steps">
          <li>Plan the route on the map.</li>
          <li>Fix problems until the Issues card is clear.</li>
          <li>Order every part before launch (Rocket → Order parts).</li>
          <li>At the launch date the mission flies once — watch what happens.</li>
        </ol>
        </details>
        <p class="briefing-clock">
          {clockRunning ? <>The game clock runs in real time: <b>1 real minute = {monthsPerMinute} month{monthsPerMinute === 1 ? '' : 's'}</b>.</> : <>The agency calendar is paused.</>} Launch is set
          to <b class="num">{formatDay(launchDay, start)}</b>{clockRunning ? ` (≈ ${minutes} minute${minutes === 1 ? '' : 's'} from now).` : '. The countdown resumes when the host starts the calendar.'}
        </p>
        <div class="briefing-foot">
          <button class="pill primary" autoFocus onClick={closeBriefing}>Plan route</button>
        </div>
      </section>
    </div>
  );
}
