import type { BodyId, Goal, MissionDef } from '../model/types';

// Goal orbit windows: orbit / orbitData goals may require a specific altitude
// (e.g. geostationary orbit). Shared by evaluate (goal checks), the maneuver
// menu and the planner's hints.

export const DEFAULT_ALTITUDE_TOLERANCE_KM = 1000;

export function hasAltitudeWindow(goal: Goal): goal is Goal & { altitudeKm: number } {
  return (goal.kind === 'orbit' || goal.kind === 'orbitData') && goal.altitudeKm !== undefined;
}

export function altitudeTolerance(goal: Goal): number {
  return goal.altitudeToleranceKm ?? DEFAULT_ALTITUDE_TOLERANCE_KM;
}

/** True if a circular orbit at `altKm` satisfies the goal's altitude window (or the goal has none). */
export function altitudeOk(goal: Goal, altKm: number): boolean {
  if (!hasAltitudeWindow(goal)) return true;
  return Math.abs(altKm - goal.altitudeKm) <= altitudeTolerance(goal) + 1e-9;
}

/** Goals at `body` that need a specific orbit altitude (in mission order). */
export function altitudeGoalsAt(mission: MissionDef, body: BodyId): (Goal & { altitudeKm: number })[] {
  return mission.goals.filter((g): g is Goal & { altitudeKm: number } => g.body === body && hasAltitudeWindow(g));
}

const fmtKm = (v: number) => `${Math.round(v).toLocaleString('en-US')} km`;

/** "geostationary orbit (35,786 km)" or "a 35,786 km orbit". */
export function goalOrbitText(goal: Goal & { altitudeKm: number }): string {
  return goal.orbitName ? `${goal.orbitName} (${fmtKm(goal.altitudeKm)})` : `a ${fmtKm(goal.altitudeKm)} orbit`;
}

/** Menu label for the one-click orbit change toward a goal orbit. */
export function goalOrbitChangeLabel(goal: Goal & { altitudeKm: number }, fromAltKm: number): string {
  return `${fromAltKm < goal.altitudeKm ? 'Raise' : 'Lower'} to ${goalOrbitText(goal)}`;
}

/**
 * Why an orbit misses the goal's window, e.g. "The plan does not reach geostationary orbit: orbit at 200 km,
 * needs 35,786 ± 2,000 km". Starts like the other "not planned yet" reasons (BottomStrip relies on it).
 */
export function altitudeMissText(goal: Goal & { altitudeKm: number }, altKm: number): string {
  const need = `${Math.round(goal.altitudeKm).toLocaleString('en-US')} ± ${fmtKm(altitudeTolerance(goal))}`;
  return `The plan does not reach ${goal.orbitName ?? 'the goal orbit'}: orbit at ${fmtKm(altKm)}, needs ${need}`;
}
