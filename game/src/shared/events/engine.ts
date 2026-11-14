// Shared event engine — pure functions over WorldView and authored EventDefs.
// No framework imports; every station can use it. Signatures are a contract.

import type { Condition, Effect, EventDef, InFlightEventDef, StakeholderId, WorldView } from './types';
import { STAKEHOLDERS } from './types';

/** Deterministic PRNG (mulberry32). Returns a function producing [0, 1). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The mulberry32 state after one draw from `rng(seed)`; lets callers persist the sequence. */
export function nextSeed(seed: number): number {
  return (seed + 0x6d2b79f5) >>> 0;
}

export function evalCondition(c: Condition, w: WorldView): boolean {
  switch (c.kind) {
    case 'flag':
      return w.flags.includes(c.flag);
    case 'notFlag':
      return !w.flags.includes(c.flag);
    case 'trustBelow':
      return w.trust[c.stakeholder] < c.value;
    case 'trustAbove':
      return w.trust[c.stakeholder] > c.value;
    case 'budgetBelow':
      return w.budgetM < c.valueM;
    case 'dayAfter':
      return w.day >= c.day;
    case 'all':
      return c.of.every((x) => evalCondition(x, w));
    case 'any':
      return c.of.some((x) => evalCondition(x, w));
  }
}

/**
 * Events that become due at `world.day`: timeline events whose day has come,
 * trigger/player events whose condition holds — each at most once (`fired`).
 * Timeline events come first, ordered by their day.
 */
export function dueEvents(defs: EventDef[], world: WorldView, fired: ReadonlySet<string>): EventDef[] {
  const timeline = defs
    .filter((d) => d.source === 'timeline' && !fired.has(d.id) && d.at !== undefined && d.at <= world.day)
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const triggered = defs.filter(
    (d) => (d.source === 'trigger' || d.source === 'player') && !fired.has(d.id) && d.when !== undefined && evalCondition(d.when, world),
  );
  return [...timeline, ...triggered];
}

/**
 * Relative draw weight of a pool event: `weight` × trust scaling × event-odds
 * modifiers. For every tag that names a stakeholder: strained → 'bad' ×2,
 * 'opportunity' ×0.5; strong → 'bad' ×0.5, 'opportunity' ×2. Then × oddsByTag[tag]
 * for each tag.
 */
export function poolWeight(def: EventDef, world: WorldView, oddsByTag: Record<string, number>): number {
  let w = def.weight ?? 1;
  const bad = def.tags.includes('bad');
  const opp = def.tags.includes('opportunity');
  for (const tag of def.tags) {
    if (!(STAKEHOLDERS as string[]).includes(tag)) continue;
    const band = trustBand(world.trust[tag as StakeholderId]);
    if (band === 'strained') {
      if (bad) w *= 2;
      if (opp) w *= 0.5;
    } else if (band === 'strong') {
      if (bad) w *= 0.5;
      if (opp) w *= 2;
    }
  }
  for (const tag of def.tags) w *= oddsByTag[tag] ?? 1;
  return Math.max(0, w);
}

/**
 * Pick one pool event, weighted by `weight`, scaled by trust (strained trust makes
 * that stakeholder's 'bad' events likelier, strong trust its 'opportunity' events)
 * and by event-odds modifiers per tag. Returns null if none eligible.
 */
export function drawPoolEvent(
  defs: EventDef[], world: WorldView, fired: ReadonlySet<string>,
  oddsByTag: Record<string, number>, random: () => number,
): EventDef | null {
  const candidates = defs.filter(
    (d) => d.source === 'pool' && !fired.has(d.id) && (d.eligible === undefined || evalCondition(d.eligible, world)),
  );
  const weights = candidates.map((d) => poolWeight(d, world, oddsByTag));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  // Floating-point edge: return the last candidate with positive weight.
  for (let i = candidates.length - 1; i >= 0; i--) if (weights[i] > 0) return candidates[i];
  return null;
}

/** Stakeholder the event's character belongs to is looked up by the caller; helper for trust thresholds. */
export function trustBand(value: number): 'strained' | 'neutral' | 'strong' {
  return value < 30 ? 'strained' : value > 70 ? 'strong' : 'neutral';
}

/** Apply trust effects to a trust record (clamped 0..100); returns a new record. Non-trust effects are ignored. */
export function applyTrust(trust: Record<StakeholderId, number>, effects: Effect[]): Record<StakeholderId, number> {
  const next = { ...trust };
  for (const e of effects) {
    if (e.kind !== 'trust') continue;
    next[e.stakeholder] = Math.min(100, Math.max(0, next[e.stakeholder] + e.delta));
  }
  return next;
}

/** Resolve in-flight events from the state at launch. */
export function resolveInFlight(defs: InFlightEventDef[], world: WorldView): { eventId: string; good: boolean }[] {
  return defs.map((d) => ({ eventId: d.id, good: evalCondition(d.goodIf, world) }));
}
