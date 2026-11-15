// Pure research rules shared by the science reducers (logic.ts) and the UI: labels, dates,
// slice access, request coverage. No UI imports, no randomness.
import type { ResearchRequest, ResearchState } from '../../../core/model';
import type { GameState } from '../../../core/state';
import { MISSION } from '../../../core/mission';
import { partName, statDefs } from '../../planner/data/parts';
import type { PartKind as PlannerPartKind } from '../../planner/model/types';
import type { ScienceSlice } from '../slice';
import { INITIAL_SLOTS } from '../slice';
import { START_TECHS } from '../data/techs';
import type { Grant } from './types';

// ------------------------------------------------------------- dates

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dayToDate(day: number): Date {
  const d = new Date(MISSION.startDateISO + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.floor(day));
  return d;
}
export function formatDate(day: number): string {
  const d = dayToDate(day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function formatMonth(day: number): string {
  const d = dayToDate(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ------------------------------------------------------------- labels

interface KeyInfo { kind: string; variant: string; stat?: string; label: string; unit: string }

/** Human label for a planner research key (`kind.variant.stat` or `kind.variant`). */
export function keyInfo(key: string): KeyInfo {
  const [kind, variant, stat] = key.split('.');
  let name = key;
  try { name = partName(kind as PlannerPartKind, variant); } catch { /* unknown kind */ }
  if (!stat) return { kind, variant, label: name, unit: '' };
  let def;
  try { def = statDefs(kind as PlannerPartKind, variant)?.find((d) => d.key === stat); } catch { def = undefined; }
  return {
    kind, variant, stat,
    label: `${name} ${def ? (def.label === 'Isp' ? 'Isp' : def.label[0].toLowerCase() + def.label.slice(1)) : stat}`,
    unit: def?.unit ?? '',
  };
}

export function formatValue(v: number, unit: string): string {
  const n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : String(+v.toFixed(2));
  return unit ? `${n} ${unit}` : n;
}

/** "Hydrogen / oxygen engine Isp up to 458 s" or "Ion (xenon) engine unlocked". */
export function describeGrant(g: Grant): string {
  if (g.kind === 'unlock') return `${keyInfo(g.key).label} unlocked`;
  const k = keyInfo(g.key);
  return `${k.label} up to ${formatValue(g.value, k.unit)}`;
}

/** What a request asks for, e.g. "Hydrogen / oxygen engine Isp ≥ 462 s". */
export function describeRequest(r: Pick<ResearchRequest, 'key' | 'value'>): string {
  const k = keyInfo(r.key);
  return r.value === undefined ? `${k.label} unlocked` : `${k.label} ≥ ${formatValue(r.value, k.unit)}`;
}

// ------------------------------------------------------------- slice access

/** The science slice with defaults filled in (older saves may lack fields). */
export function sci(s: GameState): ScienceSlice {
  const x = (s.science ?? {}) as Partial<ScienceSlice>;
  return { slots: x.slots ?? INITIAL_SLOTS, researched: x.researched ?? [...START_TECHS], info: x.info ?? {} };
}

export const running = (r: ResearchState) => r.projects.filter((p) => p.status === 'running');

// ------------------------------------------------------------- requests

/** Has this need been met by research (by any route)? */
export function covered(r: Pick<ResearchState, 'limits' | 'unlocked'>, key: string, value?: number): boolean {
  if (value === undefined) return r.unlocked.includes(key);
  const have = r.limits[key];
  return have !== undefined && have >= value - 1e-9;
}

export const requestCovered = (r: Pick<ResearchState, 'limits' | 'unlocked'>, q: Pick<ResearchRequest, 'key' | 'value'>) =>
  covered(r, q.key, q.value);

export const openRequests = (r: ResearchState): ResearchRequest[] => (r.requests ?? []).filter((q) => q.status === 'open');
