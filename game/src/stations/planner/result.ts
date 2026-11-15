// Mission result (pure, no UI imports): the final playthrough for the state at
// launch. Deterministic: the reliability rolls use planner.playthroughSeed, which
// the launch draws from the game's seeded rng (meta.seed). Parts that are not
// delivered at launch scrub the launch.
//
// In-flight events (I-044, docs/design/events.md): resolved from the state at launch
// (comms' trust levels and flags). They are few and mild: their goalChanceDelta can
// rescue a physically achievable goal lost to reliability (+) or lose one that just succeeded (−), each with
// that probability, rolled from the same seed. They need a spacecraft that is still
// flying: a scrubbed launch or a flight that lost every goal gets none and no rescue.
import type { GameState } from '../../core/state';
import { MISSION } from '../../core/mission';
import { rng } from '../../shared/events/engine';
import { commsInFlightResults, type InFlightResult } from '../comms/logic';
import type { Evaluation, PlaythroughResult } from './model/types';
import { cachedPlannerGame, evaluationOf } from './derive';
import { playthrough } from './physics';

let last: { game: unknown; inFlight: unknown; result: PlaythroughResult; flying: boolean } | null = null;

function compute(state: GameState): NonNullable<typeof last> {
  const game = cachedPlannerGame(state);
  if (last && last.game === game && last.inFlight === state.comms.inFlight) return last;
  const evaluation = evaluationOf(game);
  const base = playthrough(game, evaluation, game.playthroughSeed);
  // Scrubbed, or every goal lost to failures: nothing is flying when the in-flight events would happen.
  const flying = base.goalOutcomes.some((o) => o.success);
  const result = flying ? applyInFlight(base, evaluation, commsInFlightResults(state), game.playthroughSeed) : base;
  last = { game, inFlight: state.comms.inFlight, result, flying };
  return last;
}

/** The PlaythroughResult for the state at launch, incl. in-flight events (memoised). */
export function computeMissionResult(state: GameState): PlaythroughResult {
  return compute(state).result;
}

/** Whether the in-flight events took place: false for a scrub and for a flight that lost every goal before them. */
export function inFlightCounted(state: GameState): boolean {
  return compute(state).flying;
}

function applyInFlight(base: PlaythroughResult, evaluation: Evaluation, inFlight: InFlightResult[], seed: number): PlaythroughResult {
  if (!inFlight.length) return base;
  const delta = inFlight.reduce((sum, e) => sum + e.goalChanceDelta, 0);
  const roll = rng((seed ^ 0x5bd1e995) >>> 0);
  const day = Math.round(base.endDay - 10);
  const events = [...base.events];
  // An achievable goal on a non-scrubbed flight can fail only its seeded part
  // reliability rolls. Never rescue absent routes/instruments, inadequate data
  // links, fuel/equipment errors or missed deadlines, all rejected by evaluate.
  const rescueEligible = new Set(evaluation.goals
    .filter((g) => g.achievable && g.factors?.some((f) => f.p < 1))
    .map((g) => g.goalId));
  const goalOutcomes = base.goalOutcomes.map((o) => {
    const r = roll();
    if (delta === 0) return o;
    if (o.success && delta < 0 && r < -delta) return { ...o, success: false };
    if (!o.success && rescueEligible.has(o.goalId) && delta > 0 && r < delta) return { ...o, success: true };
    return o;
  });
  for (const e of inFlight) {
    events.push({ day, branchId: '', kind: e.good ? 'info' : 'failure', text: `${e.title}: ${e.text}` });
  }
  goalOutcomes.forEach((o, i) => {
    if (o.success !== base.goalOutcomes[i].success) {
      events.push({
        day, branchId: '', kind: o.success ? 'goal' : 'failure',
        text: o.success ? `Saved in flight: "${goalName(o.goalId)}" achieved after all` : `Lost in flight: "${goalName(o.goalId)}" slipped away`,
      });
    }
  });
  events.sort((a, b) => a.day - b.day);
  return { ...base, events, goalOutcomes };
}

function goalName(id: string): string {
  return MISSION.goals.find((g) => g.id === id)?.name ?? id;
}

export function isScrubbed(result: PlaythroughResult): boolean {
  return result.events.some((e) => e.kind === 'failure' && e.text.startsWith('Launch scrubbed'));
}

/**
 * Required goals achieved / total, for a compact result line, plus the optional goals' bonus
 * (weights from Goal.bonusPoints, default 1). Optional goals never count in achieved / total.
 */
export function missionScore(result: PlaythroughResult): {
  achieved: number; total: number; scrubbed: boolean;
  optionalAchieved: number; optionalTotal: number; bonusEarned: number; bonusTotal: number;
} {
  const optional = (id: string) => MISSION.goals.find((g) => g.id === id)?.optional === true;
  const weight = (id: string) => MISSION.goals.find((g) => g.id === id)?.bonusPoints ?? 1;
  const required = result.goalOutcomes.filter((o) => !optional(o.goalId));
  const extra = result.goalOutcomes.filter((o) => optional(o.goalId));
  const scrubbed = isScrubbed(result);
  return {
    achieved: required.filter((o) => o.success).length,
    total: required.length,
    scrubbed,
    optionalAchieved: extra.filter((o) => o.success).length,
    optionalTotal: extra.length,
    bonusEarned: scrubbed ? 0 : extra.filter((o) => o.success).reduce((a, o) => a + weight(o.goalId), 0),
    bonusTotal: extra.reduce((a, o) => a + weight(o.goalId), 0),
  };
}
