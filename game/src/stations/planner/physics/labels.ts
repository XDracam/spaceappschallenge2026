import type { BodyId, FlightState, PlannerGame, Maneuver } from '../model/types';
import { BODIES } from '../data/bodies';

const nameOf = (id: BodyId) => BODIES[id]?.name ?? id;

export function stateBody(state: FlightState): BodyId | undefined {
  return state.kind === 'lost' ? undefined : state.body;
}

export function spacecraftNames(game: PlannerGame, ids: string[]): string {
  return ids.map((id) => game.rocket.spacecraft.find((s) => s.id === id)?.name ?? id).join(' + ');
}

/** Human-readable label of a maneuver flown from `before`. */
export function maneuverLabel(game: PlannerGame, m: Maneuver, before: FlightState, ion = false): string {
  const here = stateBody(before);
  const hereName = here ? nameOf(here) : '?';
  switch (m.type) {
    case 'launch': return `Launch to ${Math.round(m.altitudeKm)} km`;
    case 'changeOrbit': return `Change orbit to ${Math.round(m.altitudeKm)} km`;
    case 'transfer': return `Transfer to ${nameOf(m.target)}${ion ? ' (ion)' : ''}`;
    case 'flyby': return `Swing past ${hereName}`;
    case 'insertion': return `Enter ${hereName} orbit${m.aerocapture ? ' (aerobraking)' : ''}`;
    case 'land': return `Land on ${hereName}`;
    case 'ascent': return `Lift off from ${hereName} to ${Math.round(m.altitudeKm)} km`;
    case 'separate': return `Release ${spacecraftNames(game, m.spacecraftIds) || 'nothing'}`;
    case 'entry': return here === 'earth' ? 'Splash down on Earth' : `Land directly on ${hereName}`;
  }
}

export { nameOf as bodyName };
