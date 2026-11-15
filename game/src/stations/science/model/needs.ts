// What a tech needs from Procurement (D-031): facilities held on the day. Pure; shared by the reducers and the UI.
import { FACILITY_BY_ID, facilityActive, facilityComing, facilityCoveredUntil, type Facility } from '../../../core/facilities';
import type { GameState } from '../../../core/state';
import { TECH_NEEDS } from '../data/needs';

export const techFacilities = (techId: string): Facility[] => (TECH_NEEDS[techId] ?? []).map((id) => FACILITY_BY_ID[id]).filter(Boolean);

export type FacilityState =
  | { kind: 'active'; untilDay?: number }   // in use; untilDay undefined = bought
  | { kind: 'coming'; fromDay: number }     // signed, not usable yet
  | { kind: 'missing' };

export function facilityState(s: GameState, facilityId: string): FacilityState {
  const day = s.clock.day;
  if (facilityActive(s.research, facilityId, day)) {
    const until = facilityCoveredUntil(s.research, facilityId, day);
    return { kind: 'active', ...(until !== undefined && Number.isFinite(until) ? { untilDay: until } : {}) };
  }
  const from = facilityComing(s.research, facilityId, day);
  return from !== undefined ? { kind: 'coming', fromDay: from } : { kind: 'missing' };
}

/** Facilities a tech needs that are not usable today. */
export const missingFacilities = (s: GameState, techId: string, day = s.clock.day): Facility[] =>
  techFacilities(techId).filter((f) => !facilityActive(s.research, f.id, day));
