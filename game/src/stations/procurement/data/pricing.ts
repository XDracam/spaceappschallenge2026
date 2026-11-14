// Authored pricing rules shared by the catalogue and Call responses. Prices sit on
// the planner's estimated-cost scale (planner data/parts.ts estimatedCostM), so the
// planner's cost estimate and procurement's prices agree. Placeholders for balancing.
import type { PartKind } from '../../../core/model';
import type { Part } from '../../planner/model/types';
import { derivedMassT, estimatedCostM, defaultStats } from '../../planner/data/parts';
import { PROPULSION } from '../../planner/data/propulsion';
import type { PropulsionId } from '../../planner/model/types';

export const DAYS_PER_MONTH = 30.44;

function asPart(kind: PartKind, variant: string, stats: Record<string, number>): Part {
  return { id: 'proc', kind, variant, name: '', stats: { ...defaultStats(kind, variant), ...stats }, state: 'draft' };
}

/** Planner's estimated cost (M per unit) for a part with these stats. */
export function estimateCostM(kind: PartKind, variant: string, stats: Record<string, number>): number {
  return estimatedCostM(asPart(kind, variant, stats));
}

/** Planner's derived dry mass (t per unit). */
export function estimateMassT(kind: PartKind, variant: string, stats: Record<string, number>): number {
  return derivedMassT(asPart(kind, variant, stats));
}

/** Typical reliability of one unit (as the planner assumes before contracting). */
export function kindReliability(kind: PartKind, variant: string): number {
  if (kind === 'engine') return PROPULSION[variant as PropulsionId]?.baseReliability ?? 0.97;
  if (kind === 'tank') return 0.993;
  if (kind === 'instrument') return 0.97;
  if (kind === 'heatShield' || kind === 'legs') return 0.98;
  return 0.985;
}

/** Base lead time in months before the supplier's own delta. */
export function baseLeadMonths(kind: PartKind, variant: string, stats: Record<string, number>): number {
  switch (kind) {
    case 'engine': return 5 + ((stats.thrustKN ?? 0) > 500 ? 1 : 0) + (variant === 'ion' ? 1 : 0);
    case 'tank': return 3 + ((stats.fuelT ?? 0) > 100 ? 1 : 0);
    case 'instrument': return variant === 'surfaceLab' || variant === 'radar' ? 6 : 5;
    case 'power': return variant === 'rtg' ? 7 : 3;
    case 'heatShield': return 4;
    default: return 3;
  }
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const round1 = (v: number) => Math.round(v * 10) / 10;
export const round3 = (v: number) => Math.round(v * 1000) / 1000;
