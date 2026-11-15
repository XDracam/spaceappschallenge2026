// Mission result for every station after launch (the planner shows its own
// animated playthrough; this card is for procurement, science and comms).
// Same result on every browser: computeMissionResult is deterministic.
import { ResultRecoveryActions } from './ResultRecoveryActions';
import { useState } from 'preact/hooks';
import { MISSION } from '../core/mission';
import { getState, useGame } from '../core/store';
import { computeMissionResult, missionScore } from '../stations/planner/result';
import { cachedPlannerGame, evaluationOf } from '../stations/planner/derive';

export function ResultOverlay() {
  const phase = useGame((s) => s.meta.phase);
  const inFlight = useGame((s) => s.comms.inFlight);
  const [hidden, setHidden] = useState(false);
  if (phase === 'planning' || phase === 'lobby') return null;
  // Re-evaluates when phase / in-flight results change; memoised inside.
  void inFlight;
  const s = getState();
  const result = computeMissionResult(s);
  const score = missionScore(result);
  // Why a goal was never reachable (the planner's live test of the plan at launch).
  const planned = evaluationOf(cachedPlannerGame(s)).goals;
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
    <div class="shell-overlay shell-result" role="dialog" aria-label="Mission result">
      <div class="shell-result-card">
        <div class="shell-label">Mission result</div>
        <h2 class="shell-result-title">
          {score.scrubbed ? 'Launch scrubbed' : `${score.achieved} of ${score.total} goals achieved`}
        </h2>
        <ul class="shell-result-goals">
          {result.goalOutcomes.map((o) => {
            const goal = MISSION.goals.find((g) => g.id === o.goalId);
            const why = !o.success && !score.scrubbed ? planned.find((g) => g.goalId === o.goalId) : undefined;
            return (
              <li key={o.goalId} class={o.success ? 'is-ok' : 'is-fail'}>
                <span aria-hidden="true">{o.success ? '✓' : '✗'}</span> {goal?.name ?? o.goalId}
                {why && !why.achievable && why.reason && <div class="shell-result-why">{why.reason}</div>}
              </li>
            );
          })}
        </ul>
        {(failures.length > 0 || notes.length > 0) && (
          <ul class="shell-result-events">
            {[...failures, ...notes].slice(0, 8).map((e, i) => (
              <li key={i} class={e.kind === 'failure' ? 'is-fail' : ''}>{e.text}</li>
            ))}
          </ul>
        )}
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
