import type { BodyId, FlightState, GameState, Maneuver } from '../model/types';
import { BODIES } from '../data/bodies';

const nameOf = (id: BodyId) => BODIES[id]?.name ?? id;

export function stateBody(state: FlightState): BodyId | undefined {
  return state.kind === 'lost' ? undefined : state.body;
}

export function spacecraftNames(game: GameState, ids: string[]): string {
  return ids.map((id) => game.rocket.spacecraft.find((s) => s.id === id)?.name ?? id).join(' + ');
}

/** Human-readable label of a maneuver flown from `before`. */
export function maneuverLabel(game: GameState, m: Maneuver, before: FlightState, ion = false): string {
  const here = stateBody(before);
  const hereName = here ? nameOf(here) : '?';
  switch (m.type) {
    case 'launch': return `Launch to ${Math.round(m.altitudeKm)} km`;
    case 'changeOrbit': return `Change orbit to ${Math.round(m.altitudeKm)} km`;
    case 'transfer': return `Transfer to ${nameOf(m.target)}${ion ? ' (ion)' : ''}`;
    case 'flyby': return `${hereName} flyby to ${nameOf(m.target)}`;
    case 'insertion': return `${hereName} orbit insertion${m.aerocapture ? ' (aerocapture)' : ''}`;
    case 'land': return `Land on ${hereName}`;
    case 'ascent': return `Ascent from ${hereName} to ${Math.round(m.altitudeKm)} km`;
    case 'separate': return `Separate: ${spacecraftNames(game, m.spacecraftIds) || 'nothing'}`;
    case 'entry': return here === 'earth' ? 'Earth entry' : `Atmospheric entry at ${hereName}`;
  }
}

export { nameOf as bodyName };
