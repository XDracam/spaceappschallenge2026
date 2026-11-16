// Mission result for every station after launch (the planner shows its own
// animated playthrough; this card is for procurement, science and comms).
// Same result on every browser: computeMissionResult is deterministic.
import { ResultRecoveryActions } from './ResultRecoveryActions';
import { useRef, useState } from 'preact/hooks';
import { useDialog } from '../shared/useDialog';
import { MISSION } from '../core/mission';
import { getState, useGame } from '../core/store';
import { computeMissionResult, goalFailureReasons, missionScore } from '../stations/planner/result';
import { formatDay } from '../stations/planner/model/units';
import { cachedPlannerGame, evaluationOf } from '../stations/planner/derive';

export function ResultOverlay() {
  const phase = useGame((s) => s.meta.phase);
  const inFlight = useGame((s) => s.comms.inFlight);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDialog({ open: phase !== 'planning' && phase !== 'lobby' && !hidden, root, onClose: () => setHidden(true) });
  if (phase === 'planning' || phase === 'lobby') return null;
  // Re-evaluates when phase / in-flight results change; memoised inside.
  void inFlight;
  const s = getState();
  const result = computeMissionResult(s);
  const score = missionScore(result);
  // Why a goal was never reachable (the planner's live test of the plan at launch).
  const game = cachedPlannerGame(s);
  const reasons = goalFailureReasons(game, evaluationOf(game), result);
  const budget = s.budget;
  const delivered = s.market.contracts.filter((c) => c.status === 'delivered').length;
  const research = s.research.projects.filter((p) => p.status === 'succeeded' && p.techId).length;

  if (hidden) {
    return (
      <button class="shell-result-chip" onClick={() => setHidden(false)}>
        Mission result: {score.scrubbed ? 'launch scrubbed' : `${score.achieved} / ${score.total} goals`}
      </button>
    );
  }

  const failures = result.events.filter((e) => e.kind === 'failure');
  const notes = result.events.filter((e) => e.kind === 'info' && e.branchId === '');
  return (
    <div ref={root} class="shell-overlay shell-result" role="dialog" aria-modal="true" aria-label="Mission result">
      <div class="shell-result-card">
        <div class="shell-label">Mission result · {MISSION.name}</div>
        <h2 class="shell-result-title">
          {score.scrubbed ? 'Launch scrubbed' : `${score.achieved} of ${score.total} goals achieved`}
          {!score.scrubbed && score.optionalTotal > 0 && <small class="shell-result-bonus"> · {score.optionalAchieved} of {score.optionalTotal} optional</small>}
        </h2>
        <ul class="shell-result-goals">
          {result.goalOutcomes.map((o) => {
            const goal = MISSION.goals.find((g) => g.id === o.goalId);
            const why = !o.success && !score.scrubbed ? reasons.get(o.goalId) : undefined;
            return (
              <li key={o.goalId} class={o.success ? 'is-ok' : 'is-fail'}>
                <span aria-hidden="true">{o.success ? '✓' : goal?.optional ? '–' : '✗'}</span> {goal?.name ?? o.goalId}{goal?.optional ? <em class="shell-goal-optional">Bonus</em> : null}
                {why && <div class="shell-result-why">{why}</div>}
              </li>
            );
          })}
        </ul>
        {(failures.length > 0 || notes.length > 0) && (
          <ul class="shell-result-events">
            {[...failures, ...notes].map((e, i) => (
              <li key={i} class={e.kind === 'failure' ? 'is-fail' : ''}>{e.text}</li>
            ))}
          </ul>
        )}
        <details class="shell-result-evidence">
          <summary>Full flight log · {result.events.length} events</summary>
          <ol>{result.events.map((event, index) => <li key={index}>
            <time class="shell-num">{formatDay(event.day, MISSION.startDateISO)}</time> · {event.text}
          </li>)}</ol>
        </details>
        <div class="shell-result-stats">
          <span>Spent <b>{Math.round(budget.spentM + budget.committedM)} M</b> of {budget.fundingTotalM} M</span>
          <span><b>{delivered}</b> deliveries</span>
          <span><b>{research}</b> research successes</span>
        </div>
        <div class="shell-result-foot">
          <ResultRecoveryActions />
          <button class="shell-btn" onClick={() => setHidden(true)}>Close</button>
        </div>
      </div>
    </div>
  );
}
