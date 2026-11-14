// Planner's part of the shared GameState. Owned by the planner station.
// Part states are not stored here (every part stays 'draft'); they are derived
// from the shared market by stations/planner/derive.ts.
import type { MissionPlan, Rocket, SavedVersion } from './model/types';
import { MISSION } from '../../core/mission';

export interface PlannerSlice {
  rocket: Rocket;
  plan: MissionPlan;            // plan.launchDay is the shared planned launch day
  versions: SavedVersion[];
  /** Seed of the final playthrough's reliability rolls (drawn from the game rng at launch). */
  playthroughSeed: number;
}

export function initialPlannerSlice(): PlannerSlice {
  return {
    rocket: structuredClone(MISSION.initialRocket),
    plan: structuredClone(MISSION.initialPlan),
    versions: [],
    playthroughSeed: 1,
  };
}
