// Small builders for hand-authored comms content (D-005). They only shape data:
// option hints are derived from the option's trust effects so the ↑/↓ shown to
// the player always match what happens (|delta| >= 10 → ↑↑/↓↓, else ↑/↓).

import type { Condition, StakeholderHint } from '../../../shared/events/types';
import type { Effect, EventDef, StakeholderId } from '../model/types';

type Option = EventDef['options'][number];
type OfferEffect = Extract<Effect, { kind: 'offer' }>;

// -------------------------------------------- flags raised by comms content

/** A plutonium (RTG) story ran without the agency's side (both missions). */
export const FLAG_RTG_STORY = 'press.rtgStory';
/** A partner ground-station deal completed (used by in-flight events). */
export const FLAG_GROUND_STATION = 'comms.groundStation';
/**
 * Comms promised to keep the launch date (both missions). The rules remember the launch
 * day of that moment (CommsSlice.promisedLaunchDay) and raise FLAG_PROMISE_BROKEN once the
 * launch is later than promised; a follow-up message then calls the promise in
 * (eventsTriggered.ts). Replaces the 'missionConstraint' text the Planner never saw (R1115m-r01-08).
 */
export const FLAG_LAUNCH_PROMISE = 'comms.promise.launchDate';
export const FLAG_PROMISE_BROKEN = 'comms.promise.broken';

// ------------------------------------------------------------------ effects

export const trust = (stakeholder: StakeholderId, delta: number): Effect => ({ kind: 'trust', stakeholder, delta });
export const budget = (deltaM: number): Effect => ({ kind: 'budget', deltaM });
/** Procurement: deliveries slip (negative = arrive earlier). */
export const delay = (months: number, scope: 'all' | 'next' = 'next'): Effect => ({ kind: 'deliveryDelay', months, scope });
/** Procurement: prices change by pct for a while. */
export const price = (pct: number, months: number): Effect => ({ kind: 'priceModifier', pct, months });
/** Science: running research faster/slower by pct for a while. */
export const pace = (pct: number, months: number): Effect => ({ kind: 'researchPace', pct, months });
/** Science + planner: a research limit rises. */
export const limit = (key: string, value: number): Effect => ({ kind: 'researchLimit', key, value });
/** Science + planner: a locked variant becomes available. */
export const unlock = (key: string): Effect => ({ kind: 'unlock', key });
/** Science: block a tech (a running project pauses) or enable it (lifts a block, or grants a required approval). */
export const techAccess = (tech: string, access: 'block' | 'enable', note: string): Effect => ({ kind: 'techAccess', tech, access, note });
/** Planner: a partner service. */
export const service = (s: 'groundStation' | 'launchSlot' | 'testFacility', note: string): Effect => ({ kind: 'service', service: s, note });
/** Planner: a new mission requirement. */
export const constraint = (text: string): Effect => ({ kind: 'missionConstraint', text });
/** State flag other content can trigger on. */
export const setFlag = (flag: string, on = true): Effect => ({ kind: 'flag', flag, on });
/** Comms: odds of events with this tag change for a while. */
export const odds = (tag: string, factor: number, months: number): Effect => ({ kind: 'eventOdds', tag, factor, months });
/** Procurement: a partner's part offer for the planner's task. */
export const offer = (o: Omit<OfferEffect, 'kind'>): Effect => ({ kind: 'offer', ...o });

// --------------------------------------------------------------- conditions

export const hasFlag = (flag: string): Condition => ({ kind: 'flag', flag });
export const lacksFlag = (flag: string): Condition => ({ kind: 'notFlag', flag });
export const trustBelow = (stakeholder: StakeholderId, value: number): Condition => ({ kind: 'trustBelow', stakeholder, value });
export const trustAbove = (stakeholder: StakeholderId, value: number): Condition => ({ kind: 'trustAbove', stakeholder, value });
export const budgetBelow = (valueM: number): Condition => ({ kind: 'budgetBelow', valueM });
/** Holds from this agency-calendar day on (comms stops at launch, so: "still on the ground by then"). */
export const dayAfter = (day: number): Condition => ({ kind: 'dayAfter', day });
export const allOf = (...of: Condition[]): Condition => ({ kind: 'all', of });
export const anyOf = (...of: Condition[]): Condition => ({ kind: 'any', of });

// ------------------------------------------------------------------ options

/** ↑/↓ hints from an effect list: net trust delta per stakeholder; |net| >= 10 → ±2. */
export function hintsFor(effects: Effect[]): StakeholderHint[] {
  const net = new Map<StakeholderId, number>();
  for (const e of effects) if (e.kind === 'trust') net.set(e.stakeholder, (net.get(e.stakeholder) ?? 0) + e.delta);
  const hints: StakeholderHint[] = [];
  for (const [stakeholder, d] of net) {
    if (d === 0) continue;
    const mag = Math.abs(d) >= 10 ? 2 : 1;
    hints.push({ stakeholder, dir: (Math.sign(d) * mag) as StakeholderHint['dir'] });
  }
  return hints;
}

/**
 * A dialogue option. `costM` is money spent at once: it is shown on the option
 * and added as a budget effect (types.ts: "also add a budget effect").
 */
export function option(id: string, text: string, effects: Effect[], outcome: string, costM?: number): Option {
  const all = costM ? [budget(-costM), ...effects] : effects;
  return { id, text, hints: hintsFor(all), ...(costM ? { costM } : {}), effects: all, outcome };
}
