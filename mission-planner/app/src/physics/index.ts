// Public physics API. Map and UI import ONLY from this file.
// Signatures are a contract shared by all modules; implementations live in
// sibling files:
//   ephemeris.ts   body positions/velocities (circular coplanar orbits)
//   kepler.ts      universal-variable propagation, conic sampling
//   lambert.ts     2D prograde Lambert solver (Izzo)
//   transfers.ts   transfer / flyby / Hohmann costs, heat-map grid, slider ranges
//   stack.ts       staging and the rocket equation
//   evaluate.ts    live simulation test (maneuvers, goals, hazards, parts, budget)
//   options.ts     maneuver menu and default maneuvers
//   playthrough.ts final playthrough and spacecraft positions

import type { Evaluation, FlightState } from '../model/types';

export { bodyPosition, bodyPositionAbs, bodyVelocity, orbitalPeriodDays } from './ephemeris';
export { evaluate } from './evaluate';
export { availableManeuvers, createManeuver } from './options';
export { transferGrid, transferRanges, type TransferGrid } from './transfers';
export { playthrough, spacecraftPositionAt } from './playthrough';

// Extra helpers (not part of the original contract, safe to use).
export { siblingsOf, transferRelation, sunDistanceKm, earthDistanceKm } from './ephemeris';
export { hohmannTravelDays } from './transfers';

/** Flight state at the end of a branch (where the next maneuver would start). */
export function branchEndState(evaluation: Evaluation, branchId: string): FlightState | undefined {
  return evaluation.branches.find((b) => b.branchId === branchId)?.finalState;
}
