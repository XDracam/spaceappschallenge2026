// comms station game logic: reducers (defineActions('comms', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
// Game rules live in ./state/world.ts (pure functions over the shared GameState).
import { defineActions, onTick } from '../../core/actions';
import type { GameState } from '../../core/state';
import {
  answerEvent, contentOf, deliverEvent, getEventDef, isLaunched, passiveModifiers, resolveLaunch, startProjectIn, stepTo,
  type PassiveModifiers,
} from './state/world';

export { commsInFlightResults, type InFlightResult } from './state/world';

export const commsActions = defineActions('comms', {
  /** Answer an open inbox event with one of its options (costs spend from the shared budget). */
  answer(s, ctx, instanceId: string, optionId: string) {
    answerEvent(s, ctx, instanceId, optionId);
  },
  /** Start a project if a slot is free, trust allows and the budget covers its cost. */
  startProject(s, ctx, defId: string) {
    startProjectIn(s, ctx, defId);
  },
  /** Dev / testing: deliver a specific event now, regardless of its conditions. */
  devFireEvent(s, ctx, eventId: string) {
    if (isLaunched(s)) return;
    const def = getEventDef(eventId, contentOf(s));
    if (def) deliverEvent(s, def, ctx);
  },
});

onTick('comms', (s, ctx, _fromDay, toDay) => {
  if (s.comms.launched) return;
  // Launch: the planner's handler (earlier in the same tick) sets phase 'launched'.
  // Comms keeps working until the phase says so, also past the planned day (a held launch).
  // "Launch now" (planner/launchNow) launches without a tick: then this never runs, and the
  // in-flight events are resolved from the state, which no longer changes after the launch
  // (commsInFlightResults) — the same outcome either way.
  if (s.meta.phase !== 'planning') {
    resolveLaunch(s);
    return;
  }
  stepTo(s, ctx, toDay);
});

/** Passive effects of comms' trust levels (e.g. procurement prices/delivery ±10 % by Industry trust). */
export function commsPassiveModifiers(s: GameState): PassiveModifiers {
  return passiveModifiers(s.comms.trust);
}
