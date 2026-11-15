// Pure research rules shared by the science reducers (logic.ts) and the UI: labels, dates,
// slice access, request coverage. No UI imports, no randomness.
import type { ResearchProject, ResearchState } from '../../../core/model';
import type { GameState } from '../../../core/state';
import { MISSION } from '../../../core/mission';
import { beyondResearch, partName, statDefs } from '../../planner/data/parts';
import { partStatus } from '../../planner/derive';
import { allParts } from '../../planner/model/rocketUtils';
import type { Part, PartKind as PlannerPartKind } from '../../planner/model/types';
import { CATALOGUE_OFFERS } from '../../procurement/data/catalogue';
import { deliveryShiftDays, leadTimeDays } from '../../procurement/rules';
import type { ScienceSlice } from '../slice';
import { INITIAL_SLOTS } from '../slice';
import { activeTeams } from '../../../core/facilities';
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

/** What the design needs, e.g. "Hydrogen / oxygen engine Isp ≥ 462 s". */
export function describeNeed(r: Pick<Need, 'key' | 'value'>): string {
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

/** Research teams at work today: the agency's own plus the ones Procurement hired (core/facilities.ts). */
export function teamCapacity(s: GameState): number {
  return sci(s).slots + activeTeams(s.research, s.clock.day).length;
}

// ------------------------------------------------------------- what the design needs

/**
 * Something the planner's design needs that research does not cover yet. Never stored: it is read
 * from the planner's rocket, so science sees it from the first second and it follows every slider change.
 */
export interface Need {
  /** Planner research key: `kind.variant.stat` (a limit) or `kind.variant` (an unlock). */
  key: string;
  /** Needed value for a limit key; undefined for an unlock key. */
  value?: number;
  /**
   * Last day research can finish so that the part still arrives for launch (fastest standard
   * catalogue delivery). Undefined when no catalogue part would fit even after research.
   */
  researchBy?: number;
  /** Days that delivery takes (the lead time behind researchBy). */
  leadDays?: number;
}

/** Has this need been met by research (by any route)? */
export function covered(r: Pick<ResearchState, 'limits' | 'unlocked'>, key: string, value?: number): boolean {
  if (value === undefined) return r.unlocked.includes(key);
  const have = r.limits[key];
  return have !== undefined && have >= value - 1e-9;
}

/** Fastest standard catalogue delivery (days) of a part that meets these sliders, whatever research says today. */
function fastestLeadDays(s: GameState, part: Part): number | undefined {
  const leads = CATALOGUE_OFFERS
    .filter((o) => o.resource.partKind === part.kind && o.resource.variant === part.variant
      && Object.entries(part.stats).every(([k, min]) => (o.resource.stats[k] ?? 0) >= min - 1e-9))
    .map((o) => leadTimeDays(s, o) + deliveryShiftDays(s));
  return leads.length ? Math.min(...leads) : undefined;
}

/**
 * What the design needs beyond research: every part that is not under contract yet (a contracted part
 * was bought some other way) and exceeds a research limit or uses a locked part type. One entry per key.
 */
export function designNeeds(s: GameState): Need[] {
  const out = new Map<string, Need>();
  for (const { part } of allParts(s.planner.rocket)) {
    const keys = beyondResearch(part, s.research.limits, s.research.unlocked);
    if (!keys.length) continue;
    const st = partStatus(s, part.id);
    if (st !== 'draft' && st !== 'ordered') continue;
    const lead = fastestLeadDays(s, part);
    const by = lead === undefined ? undefined : Math.floor(s.planner.plan.launchDay - lead);
    for (const key of keys) {
      const stat = key.split('.')[2];
      const value = stat ? part.stats[stat] : undefined;
      const prev = out.get(key);
      if (!prev) { out.set(key, { key, value, researchBy: by, leadDays: lead }); continue; }
      if (value !== undefined && (prev.value ?? -Infinity) < value) prev.value = value;
      if (by !== undefined && (prev.researchBy === undefined || by < prev.researchBy)) { prev.researchBy = by; prev.leadDays = lead; }
    }
  }
  return [...out.values()];
}

/** Half the remaining project cost, rounded exactly as the cancellation reducer. */
export function cancellationRefund(p: ResearchProject, day: number): number {
  const total = Math.max(1, p.endsAt - p.startedAt);
  const left = Math.min(1, Math.max(0, (p.endsAt - day) / total));
  return Math.round(p.costM * left * 0.5 * 10) / 10;
}
