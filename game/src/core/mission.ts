// Missions the host can pick in the lobby (hand-authored, D-005). The active mission
// is a live binding: `MISSION` always refers to the mission of the current game.
// Every browser sets it from the game state it adopts (core/store.ts), so modules
// that read `MISSION` at call time see the right mission.
import type { MissionDef } from '../stations/planner/model/types';
import { WEATHER_GEO } from '../stations/planner/data/missions/weatherGeo';
import { MARS_ORBITER_LANDER } from '../stations/planner/data/missions/marsOrbiterLander';

/** In lobby order: the first is the default. */
export const MISSIONS: MissionDef[] = [WEATHER_GEO, MARS_ORBITER_LANDER];
export const DEFAULT_MISSION_ID = WEATHER_GEO.id;

export function missionById(id: string | undefined): MissionDef {
  return MISSIONS.find((m) => m.id === id) ?? MARS_ORBITER_LANDER;
}

// eslint-disable-next-line import/no-mutable-exports
export let MISSION: MissionDef = WEATHER_GEO;

/** Switch the active mission (called when a game is created or a state is adopted). */
export function setActiveMission(id: string | undefined): void {
  MISSION = missionById(id);
}
