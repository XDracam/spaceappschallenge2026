// Equipment and teams Procurement can supply to Science (D-031). Pure hand-authored data (D-005) and
// small helpers; no randomness, no UI. Techs from tier 2 on need one or two facilities (science/data/needs.ts).
import type { FacilityLease, ResearchState, ResearchTeam } from './model';

export type FacilityKind = 'lab' | 'machine' | 'equipment';

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  blurb: string;
  /** Rent per month (M). */
  rentPerMonthM: number;
  /** One-off purchase price (M); undefined = rent only. */
  buyM?: number;
  /** Days from signing until it is usable (purchases take twice as long). */
  leadDays: number;
}

export const KIND_LABEL: Record<FacilityKind, string> = { lab: 'Lab', machine: 'Machine time', equipment: 'Equipment' };

export const FACILITIES: Facility[] = [
  { id: 'test-stand', name: 'Engine test stand', kind: 'machine', blurb: 'Static-fire stand for engine hardware. Booked by the hour, usually by the month.', rentPerMonthM: 2.5, buyM: 28, leadDays: 20 },
  { id: 'cryo-plant', name: 'Cryogenic plant', kind: 'machine', blurb: 'Makes and handles liquid hydrogen and oxygen for test campaigns.', rentPerMonthM: 2, buyM: 22, leadDays: 25 },
  { id: 'vacuum-chamber', name: 'Large vacuum chamber', kind: 'lab', blurb: 'Space-like vacuum for thrusters and electric propulsion.', rentPerMonthM: 3, buyM: 30, leadDays: 30 },
  { id: 'solar-simulator', name: 'Solar simulator', kind: 'equipment', blurb: 'Lamp array that shines like the Sun on panels and cells.', rentPerMonthM: 1.5, buyM: 16, leadDays: 15 },
  { id: 'hot-cell', name: 'Radiochemistry hot cell', kind: 'lab', blurb: 'Shielded lab for handling radioactive heat-source material.', rentPerMonthM: 4, buyM: 45, leadDays: 40 },
  { id: 'clean-room', name: 'Clean room', kind: 'lab', blurb: 'Dust-free assembly room for sensors and optics.', rentPerMonthM: 1.5, buyM: 18, leadDays: 15 },
  { id: 'optical-bench', name: 'Optical test bench', kind: 'equipment', blurb: 'Vibration-free bench with calibrated light sources.', rentPerMonthM: 1.2, buyM: 14, leadDays: 15 },
  { id: 'radar-range', name: 'Radar test range', kind: 'machine', blurb: 'Open range with targets and a measuring tower.', rentPerMonthM: 2, buyM: 24, leadDays: 25 },
  { id: 'rf-chamber', name: 'Radio test chamber', kind: 'lab', blurb: 'Echo-free room for antennas and transmitters.', rentPerMonthM: 1.5, buyM: 17, leadDays: 15 },
  { id: 'ground-dish', name: 'Ground dish time', kind: 'machine', blurb: 'Hours on a big ground antenna for link tests. Not for sale: only rented.', rentPerMonthM: 3, leadDays: 20 },
  { id: 'irradiation', name: 'Irradiation facility', kind: 'lab', blurb: 'Particle beams for radiation tests of shielding and electronics.', rentPerMonthM: 2.5, buyM: 26, leadDays: 30 },
  { id: 'arc-jet', name: 'Arc-jet tunnel', kind: 'machine', blurb: 'Hot plasma wind tunnel for heat shield samples.', rentPerMonthM: 3, buyM: 30, leadDays: 30 },
];
export const FACILITY_BY_ID: Record<string, Facility> = Object.fromEntries(FACILITIES.map((f) => [f.id, f]));

/** Rental lengths on offer (months). */
export const RENT_MONTHS = [3, 6, 12];

export interface TeamOffer {
  id: string;
  label: string;
  blurb: string;
  /** Months of the contract; undefined = permanent. */
  months?: number;
  feeM: number;
  leadDays: number;
}

export const TEAM_OFFERS: TeamOffer[] = [
  { id: 'team-6', label: 'Contract team, 6 months', blurb: 'A university group on a short contract.', months: 6, feeM: 8, leadDays: 14 },
  { id: 'team-12', label: 'Contract team, 12 months', blurb: 'The same group for a year, a little cheaper per month.', months: 12, feeM: 14, leadDays: 14 },
  { id: 'team-perm', label: 'Permanent team', blurb: 'New staff on the agency payroll. Slower to hire.', feeM: 30, leadDays: 30 },
];
export const TEAM_OFFER_BY_ID: Record<string, TeamOffer> = Object.fromEntries(TEAM_OFFERS.map((o) => [o.id, o]));

/** Most hired teams at one time, counting those still being staffed. */
export const MAX_HIRED_TEAMS = 3;

type Timed = Pick<FacilityLease | ResearchTeam, 'from' | 'until'>;

/** Is it in use on this day? Starts on `from`; a rental ends before `until`. */
export const inUse = (x: Timed, day: number): boolean => x.from <= day && (x.until === undefined || day < x.until);
/** Is it signed and still to come, or in use (not expired)? */
export const heldOrComing = (x: Timed, day: number): boolean => x.until === undefined || day < x.until;

type Held = Pick<ResearchState, 'facilities' | 'teams'>;

export const facilityActive = (r: Held, id: string, day: number): boolean =>
  (r.facilities ?? []).some((l) => l.facilityId === id && inUse(l, day));

/** Signed but not usable yet: the earliest day it will be, or undefined. */
export function facilityComing(r: Held, id: string, day: number): number | undefined {
  const days = (r.facilities ?? []).filter((l) => l.facilityId === id && l.from > day && heldOrComing(l, day)).map((l) => l.from);
  return days.length ? Math.min(...days) : undefined;
}

/** Last day (exclusive) a facility is covered, Infinity when bought; undefined when not held or coming. */
export function facilityCoveredUntil(r: Held, id: string, day: number): number | undefined {
  const ls = (r.facilities ?? []).filter((l) => l.facilityId === id && heldOrComing(l, day));
  if (!ls.length) return undefined;
  return Math.max(...ls.map((l) => l.until ?? Infinity));
}

export const activeTeams = (r: Held, day: number): ResearchTeam[] => (r.teams ?? []).filter((t) => inUse(t, day));
/** Hired teams active or still being staffed. */
export const hiredTeams = (r: Held, day: number): ResearchTeam[] => (r.teams ?? []).filter((t) => heldOrComing(t, day));
