// Comms' part of the shared GameState. Owned by the comms station.
// Budget (s.budget), launch day (s.planner.plan.launchDay), flags (s.events.flags)
// and news (s.events.news) live in the shared state; effects on other stations go
// straight into s.market / s.research (see state/world.ts).
import type { ActiveModifier, ActiveProject, EventInstance, StakeholderId } from './model/types';
import { MISSION } from './data/mission';

export interface CommsSlice {
  trust: Record<StakeholderId, number>;
  inbox: EventInstance[];
  projects: ActiveProject[];
  /** Comms-only timed modifiers (eventOdds); price/pace modifiers go to market/research. */
  modifiers: ActiveModifier[];
  /** Event ids already fired (timeline/trigger/player fire once). */
  fired: string[];
  /** Day the next pool draw is due. */
  nextPoolDay: number;
  /** True once the in-flight events were resolved (at launch). */
  launched: boolean;
  /** In-flight events resolved at launch. */
  inFlight: { eventId: string; good: boolean }[];
}

export function initialCommsSlice(): CommsSlice {
  return {
    trust: { ...MISSION.startTrust },
    inbox: [], projects: [], modifiers: [], fired: [],
    nextPoolDay: 20, launched: false, inFlight: [],
  };
}
