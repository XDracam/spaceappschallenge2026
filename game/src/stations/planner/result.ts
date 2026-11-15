// Mission result (pure, no UI imports): the final playthrough for the state at
// launch. Deterministic: the reliability rolls use planner.playthroughSeed, which
// the launch draws from the game's seeded rng (meta.seed). Parts that are not
// delivered at launch scrub the launch.
//
// In-flight events (I-044, docs/design/events.md): resolved from the state at launch
// (comms' trust levels and flags). They are few and mild: their goalChanceDelta can
// rescue a goal that just failed (+) or lose one that just succeeded (−), each with
// that probability, rolled from the same seed. A scrubbed launch is never rescued.
import type { GameState } from '../../core/state';
import { MISSION } from '../../core/mission';
import { rng } from '../../shared/events/engine';
import { commsInFlightResults, type InFlightResult } from '../comms/logic';
import type { PlaythroughResult } from './model/types';
import { cachedPlannerGame, evaluationOf } from './derive';
import { playthrough } from './physics';

let last: { game: unknown; inFlight: unknown; result: PlaythroughResult } | null = null;

/** The PlaythroughResult for the state at launch, incl. in-flight events (memoised). */
export function computeMissionResult(state: GameState): PlaythroughResult {
  const game = cachedPlannerGame(state);
  if (last && last.game === game && last.inFlight === state.comms.inFlight) return last.result;
  const base = playthrough(game, evaluationOf(game), game.playthroughSeed);
  const result = applyInFlight(base, commsInFlightResults(state), game.playthroughSeed);
  last = { game, inFlight: state.comms.inFlight, result };
  return result;
}

function applyInFlight(base: PlaythroughResult, inFlight: InFlightResult[], seed: number): PlaythroughResult {
  // A scrubbed launch never flew: no in-flight events.
  if (!inFlight.length || isScrubbed(base)) return base;
  const delta = inFlight.reduce((sum, e) => sum + e.goalChanceDelta, 0);
  const roll = rng((seed ^ 0x5bd1e995) >>> 0);
  const day = Math.round(base.endDay - 10);
  const events = [...base.events];
  const goalOutcomes = base.goalOutcomes.map((o) => {
    const r = roll();
    if (delta === 0) return o;
    if (o.success && delta < 0 && r < -delta) return { ...o, success: false };
    if (!o.success && delta > 0 && r < delta) return { ...o, success: true };
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

/** Goals achieved / total, for a compact result line. */
export function missionScore(result: PlaythroughResult): { achieved: number; total: number; scrubbed: boolean } {
  return {
    achieved: result.goalOutcomes.filter((o) => o.success).length,
    total: result.goalOutcomes.length,
    scrubbed: isScrubbed(result),
  };
}
