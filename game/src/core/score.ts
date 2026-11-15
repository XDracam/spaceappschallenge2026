// Mission score (pure, deterministic, no side effects): the same points on every
// browser for the same state. Used by core/recordAttempt and by the result screen.
// The goal outcome comes from the mission result (stations/planner/result.ts
// missionScore(computeMissionResult(s))); everything else is read from the state.
import type { AttemptOutcome, AttemptScore, ScorePartId, StationId } from './model';
import { missionById } from './mission';
import type { GameState } from './state';

/**
 * Maximum points per part (hand-authored). Goals dominate. Budget and time are
 * efficiency: they count in proportion to the share of goals achieved, so a
 * scrub or a lost flight earns nothing for money or days left unused.
 */
export const SCORE_WEIGHTS: Record<ScorePartId, number> = {
  goals: 600,       // goals achieved / goals of the mission
  budget: 150,      // share of the funding left (funding − spent − committed), × goal share
  time: 100,        // share of the calendar left between launch day and the completion deadline, × goal share
  deliveries: 50,   // share of the rocket's contracts delivered by launch day (Procurement)
  research: 50,     // share of finished research projects and part tests that succeeded (Science)
  trust: 50,        // mean stakeholder trust, 0..100 (Comms)
  bonus: 100,       // weight of the optional goals achieved / weight of all (missions with optional goals only)
};
/** Highest possible score of a mission: the bonus part only exists where the mission has optional goals. */
export function scoreMax(missionId: string): number {
  const hasBonus = missionById(missionId).goals.some((g) => g.optional);
  return Object.entries(SCORE_WEIGHTS).reduce((a, [id, w]) => a + (id === 'bonus' && !hasBonus ? 0 : w), 0);
}
/** Order in which the parts are listed. */
export const SCORE_PARTS: ScorePartId[] = ['goals', 'budget', 'time', 'deliveries', 'research', 'trust', 'bonus'];

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/** 0..1 per part, before weighting (exported for the debrief: "why these points"). */
export function scoreFractions(s: GameState, outcome: AttemptOutcome): Record<ScorePartId, number> {
  const goalShare = outcome.scrubbed || outcome.total <= 0 ? 0 : clamp01(outcome.achieved / outcome.total);

  const b = s.budget;
  const budgetLeft = b.fundingTotalM > 0 ? clamp01(1 - (b.spentM + b.committedM) / b.fundingTotalM) : 0;

  const deadline = missionById(s.meta.missionId).completionDeadlineDay;
  const launchDay = s.planner.plan.launchDay;
  const timeLeft = deadline > 0 ? clamp01((deadline - launchDay) / deadline) : 0;

  // Contracts that supply a planner Task (rocket parts), excluding cancelled ones.
  const plannerTasks = new Set(s.market.tasks.filter((t) => t.authorRole === 'planner').map((t) => t.id));
  const rocketContracts = new Set(
    s.market.allocations.filter((a) => a.status !== 'released' && plannerTasks.has(a.taskId)).map((a) => a.contractId),
  );
  const contracts = s.market.contracts.filter((c) => rocketContracts.has(c.id) && c.status !== 'cancelled');
  const onTime = contracts.filter((c) => c.status === 'delivered' && (c.deliveredAt ?? Infinity) <= launchDay).length;
  const deliveries = contracts.length ? onTime / contracts.length : 0;

  const ended = s.research.projects.filter((p) => p.status !== 'running');
  const research = ended.length ? ended.filter((p) => p.status === 'succeeded').length / ended.length : 0;

  const trustValues = Object.values(s.comms.trust ?? {}) as number[];
  const trust = trustValues.length ? clamp01(trustValues.reduce((a, v) => a + v, 0) / trustValues.length / 100) : 0;

  return {
    goals: goalShare,
    budget: budgetLeft * goalShare,
    time: timeLeft * goalShare,
    deliveries: clamp01(deliveries),
    research: clamp01(research),
    trust,
    bonus: outcome.scrubbed || !outcome.bonusTotal ? 0 : clamp01((outcome.bonusEarned ?? 0) / outcome.bonusTotal),
  };
}

/** Score of the state with this flight outcome. Integer points; total = sum of parts. */
export function scoreAttempt(s: GameState, outcome: AttemptOutcome): AttemptScore {
  const f = scoreFractions(s, outcome);
  const parts = {} as Record<ScorePartId, number>;
  let total = 0;
  for (const id of SCORE_PARTS) {
    parts[id] = Math.round(f[id] * SCORE_WEIGHTS[id]);
    total += parts[id];
  }
  return { total, parts };
}

/** Which station each non-goal part credits (for the debrief). */
export const SCORE_PART_STATION: Partial<Record<ScorePartId, StationId>> = {
  deliveries: 'procurement',
  research: 'science',
  trust: 'comms',
};
