// Comms game rules over a mutable CommsState draft. No framework imports, so the
// store (and throwaway simulations) can drive it. Uses the shared event engine.

import {
  drawPoolEvent, dueEvents, nextSeed, resolveInFlight, rng, trustBand, applyTrust,
} from '../../../../shared/events/engine';
import { affectedStations, STAKEHOLDERS } from '../../../../shared/events/types';
import type { EventOption, WorldView } from '../../../../shared/events/types';
import type {
  ActiveModifier, Character, CommsState, Effect, EventDef, EventInstance, InFlightEventDef,
  ProjectDef, StakeholderId, StationId,
} from '../model/types';
import { CHARACTERS, EVENTS, IN_FLIGHT, PROJECTS } from '../data/content';
import { BASE_PROJECT_SLOTS, MAX_PROJECT_SLOTS, POOL_INTERVAL_DAYS, TRUST_STRONG } from '../data/mission';
import { describeEffect, STAKEHOLDER_LABEL } from './format';

export const DAYS_PER_MONTH = 30.44;
/** Pool draws are jittered by up to ± this fraction of POOL_INTERVAL_DAYS. */
export const POOL_JITTER = 0.25;
/**
 * After a timeline/trigger/player event arrives, the next pool draw waits at least
 * this long: the pool fills quiet stretches, so the total stays near one event per
 * game month (= one per real minute) instead of pool + scripted on top of each other.
 */
export const POOL_QUIET_DAYS = POOL_INTERVAL_DAYS * (1 - POOL_JITTER);
/** Keep the news feed bounded. */
const MAX_NEWS = 200;
const OTHER_STATIONS: StationId[] = ['planner', 'procurement', 'science'];

export interface Content {
  characters: Character[];
  events: EventDef[];
  projects: ProjectDef[];
  inFlight: InFlightEventDef[];
}
export const CONTENT: Content = { characters: CHARACTERS, events: EVENTS, projects: PROJECTS, inFlight: IN_FLIGHT };

// ------------------------------------------------------------------ lookups

export function getEventDef(id: string, content: Content = CONTENT): EventDef | undefined {
  return content.events.find((e) => e.id === id);
}
export function getProjectDef(id: string, content: Content = CONTENT): ProjectDef | undefined {
  return content.projects.find((p) => p.id === id);
}
export function getCharacter(id: string, content: Content = CONTENT): Character | undefined {
  return content.characters.find((c) => c.id === id);
}
/** Stakeholder an event belongs to (via its character). */
export function eventStakeholder(def: EventDef, content: Content = CONTENT): StakeholderId | undefined {
  return getCharacter(def.characterId, content)?.stakeholder;
}

/** Effects an option really applies: its effects plus the implicit budget cost (costM without an explicit budget effect). */
export function optionEffects(option: EventOption): Effect[] {
  const hasBudget = option.effects.some((e) => e.kind === 'budget');
  return option.costM && !hasBudget ? [{ kind: 'budget', deltaM: -option.costM }, ...option.effects] : option.effects;
}
/** Marker for the UI: does this option affect other stations, and which. */
export function optionAffects(option: EventOption): { internal: boolean; affects: StationId[] } {
  const affects = affectedStations(optionEffects(option));
  return { internal: affects.length > 0, affects };
}

// -------------------------------------------------------------- world view

export function buildWorld(s: CommsState, day: number): WorldView {
  return {
    day,
    launchDay: s.launchDay,
    budgetM: s.budgetM,
    budgetTotalM: s.budgetTotalM,
    trust: { ...s.trust },
    flags: [...s.flags],
  };
}

/** Product of active 'eventOdds' factors per tag. */
export function oddsByTag(s: CommsState): Record<string, number> {
  const odds: Record<string, number> = {};
  for (const m of s.modifiers) {
    if (m.effect.kind !== 'eventOdds') continue;
    odds[m.effect.tag] = (odds[m.effect.tag] ?? 1) * m.effect.factor;
  }
  return odds;
}

export interface PassiveModifiers {
  /** Procurement prices, % change (strong Industry −10, strained +10). */
  procurementPricePct: number;
  /** Procurement delivery times, % change (strong Industry −10, strained +10). */
  procurementDeliveryPct: number;
  /** Share of event budget cuts absorbed (strong Public 50). */
  budgetCutShieldPct: number;
  /** Multiplier on partner 'opportunity' pool odds (strong 2, strained 0.5, else 1; applied by the engine's tag scaling). */
  partnerDealsBonus: number;
  /** Multiplier on government 'opportunity' pool odds, e.g. favourable budget reviews (applied by the engine's tag scaling). */
  governmentFundingBonus: number;
}

/** Passive effects of the current trust levels (proposal baseline). */
export function passiveModifiers(trust: Record<StakeholderId, number>): PassiveModifiers {
  const ind = trustBand(trust.industry);
  const bandFactor = (v: number) => {
    const b = trustBand(v);
    return b === 'strong' ? 2 : b === 'strained' ? 0.5 : 1;
  };
  return {
    procurementPricePct: ind === 'strong' ? -10 : ind === 'strained' ? 10 : 0,
    procurementDeliveryPct: ind === 'strong' ? -10 : ind === 'strained' ? 10 : 0,
    budgetCutShieldPct: trustBand(trust.public) === 'strong' ? 50 : 0,
    partnerDealsBonus: bandFactor(trust.partners),
    governmentFundingBonus: bandFactor(trust.government),
  };
}

/** Concurrent project slots: BASE, or MAX when any stakeholder is strong. */
export function projectSlotsFor(trust: Record<StakeholderId, number>): number {
  return STAKEHOLDERS.some((k) => trust[k] > TRUST_STRONG) ? MAX_PROJECT_SLOTS : BASE_PROJECT_SLOTS;
}

export type ProjectBlock = 'unknown' | 'launched' | 'running' | 'noSlot' | 'trust' | 'budget';

/** Whether a project can start now, and why not. */
export function canStartProject(s: CommsState, defId: string, content: Content = CONTENT): { ok: boolean; reason?: ProjectBlock } {
  const def = getProjectDef(defId, content);
  if (!def) return { ok: false, reason: 'unknown' };
  if (s.phase !== 'planning') return { ok: false, reason: 'launched' };
  if (s.projects.some((p) => p.defId === defId)) return { ok: false, reason: 'running' };
  if (s.projects.length >= projectSlotsFor(s.trust)) return { ok: false, reason: 'noSlot' };
  if (def.requires && s.trust[def.requires.stakeholder] < def.requires.min) return { ok: false, reason: 'trust' };
  if (s.budgetM < def.costM) return { ok: false, reason: 'budget' };
  return { ok: true };
}

// ----------------------------------------------------------------- effects

function id(s: CommsState, prefix: string): string {
  return `${prefix}${s.nextId++}`;
}

export function addNews(s: CommsState, day: number, text: string, affects: StationId[], internal: boolean): void {
  s.news.push({ id: id(s, 'n'), day, from: 'comms', text, affects, internal });
  if (s.news.length > MAX_NEWS) s.news.splice(0, s.news.length - MAX_NEWS);
}

export interface EffectContext {
  day: number;
  /** Event or project name (outbox source, news prefix). */
  source: string;
  /** Negative budget effects are event cuts (softened by strong Public), not costs the player chose to pay. */
  shield: boolean;
}

/** Result of applying effects: news lines for the internal ones and the stations they touch. */
export interface Applied { lines: string[]; affects: StationId[] }

function withBudget(s: CommsState, deltaM: number): void {
  s.budgetM = Math.round((s.budgetM + deltaM) * 100) / 100;
}

/**
 * Apply one effect to the draft. Trust clamps, budget changes, flags set/clear,
 * timed effects become ActiveModifiers, internal effects go to the outbox.
 * Returns the news line for an internal effect, or null for an external one.
 */
export function applyEffect(s: CommsState, effect: Effect, ctx: EffectContext): string | null {
  let e = effect;
  let note = '';
  if (e.kind === 'budget' && e.deltaM < 0 && ctx.shield) {
    const pct = passiveModifiers(s.trust).budgetCutShieldPct;
    if (pct > 0) {
      e = { kind: 'budget', deltaM: Math.round(e.deltaM * (1 - pct / 100) * 100) / 100 };
      note = ', softened by public support';
    }
  }

  switch (e.kind) {
    case 'trust': {
      const before = passiveModifiers(s.trust);
      s.trust = applyTrust(s.trust, [e]);
      const after = passiveModifiers(s.trust);
      if (before.procurementPricePct !== after.procurementPricePct) {
        const p = after.procurementPricePct;
        const text = p === 0
          ? 'Industry relations back to normal: procurement prices and delivery times standard'
          : `Industry relations ${p < 0 ? 'strong' : 'strained'}: procurement prices and delivery times ${p < 0 ? '−' : '+'}${Math.abs(p)} %`;
        addNews(s, ctx.day, text, ['procurement'], true);
      }
      break;
    }
    case 'budget':
      withBudget(s, e.deltaM);
      break;
    case 'flag':
      if (e.on && !s.flags.includes(e.flag)) s.flags.push(e.flag);
      if (!e.on) s.flags = s.flags.filter((f) => f !== e.flag);
      break;
    case 'priceModifier':
    case 'researchPace':
    case 'eventOdds': {
      const mod: ActiveModifier = { effect: e, untilDay: ctx.day + e.months * DAYS_PER_MONTH };
      s.modifiers.push(mod);
      break;
    }
    default:
      // deliveryDelay, offer, researchLimit, unlock, service, missionConstraint:
      // one-shot effects owned by other stations; they only travel via the outbox.
      break;
  }

  const to = affectedStations([e]);
  if (to.length === 0) return null;
  s.outbox.push({ id: id(s, 'o'), day: ctx.day, to, effect: e, source: ctx.source });
  return describeEffect(e) + note;
}

export function applyEffects(s: CommsState, effects: Effect[], ctx: EffectContext): Applied {
  const lines: string[] = [];
  const affects = new Set<StationId>();
  for (const e of effects) {
    const line = applyEffect(s, e, ctx);
    if (line) {
      lines.push(line);
      affectedStations([e]).forEach((st) => affects.add(st));
    }
  }
  return { lines, affects: [...affects] };
}

// ------------------------------------------------------------------ events

export function deliverEvent(s: CommsState, def: EventDef, day: number): EventInstance {
  const inst: EventInstance = {
    instanceId: id(s, 'ev'),
    eventId: def.id,
    arrivedDay: day,
    deadlineDay: day + def.deadlineDays,
    status: 'open',
  };
  s.inbox.push(inst);
  if (!s.fired.includes(def.id)) s.fired.push(def.id);
  return inst;
}

/** Answer an open event. Returns the outcome text, or null if not possible. */
export function answerEvent(
  s: CommsState, instanceId: string, optionId: string, day: number, content: Content = CONTENT,
): string | null {
  const inst = s.inbox.find((i) => i.instanceId === instanceId);
  if (!inst || inst.status !== 'open') return null;
  const def = getEventDef(inst.eventId, content);
  const option = def?.options.find((o) => o.id === optionId);
  if (!def || !option) return null;

  inst.status = 'answered';
  inst.chosenOptionId = optionId;
  const ctx: EffectContext = { day, source: def.title, shield: false };
  const lines: string[] = [];
  const affects = new Set<StationId>();
  const collect = (a: Applied) => {
    lines.push(...a.lines);
    a.affects.forEach((st) => affects.add(st));
  };
  const hasBudget = option.effects.some((e) => e.kind === 'budget');
  if (option.costM && !hasBudget) collect(applyEffects(s, [{ kind: 'budget', deltaM: -option.costM }], ctx));
  // With a cost, an explicit budget effect is that cost (not shielded); without one, a negative budget effect is a cut.
  collect(applyEffects(s, option.effects, { ...ctx, shield: !option.costM }));
  if (lines.length) addNews(s, day, `${def.title}: ${lines.join('; ')}`, [...affects], true);
  return option.outcome;
}

function expire(s: CommsState, inst: EventInstance, day: number, content: Content): void {
  inst.status = 'expired';
  const def = getEventDef(inst.eventId, content);
  if (!def) return;
  const a = applyEffects(s, def.ignored.effects, { day, source: def.title, shield: true });
  const tail = a.lines.length ? ` (${a.lines.join('; ')})` : '';
  addNews(s, day, `No reply — ${def.title}: ${def.ignored.outcome}${tail}`, a.affects, a.lines.length > 0);
}

// ---------------------------------------------------------------- projects

/** Start a project if allowed. Returns true when started. */
export function startProjectIn(s: CommsState, defId: string, day: number, content: Content = CONTENT): boolean {
  if (!canStartProject(s, defId, content).ok) return false;
  const def = getProjectDef(defId, content)!;
  const ctx: EffectContext = { day, source: def.name, shield: false };
  const effects: Effect[] = [
    ...(def.costM ? [{ kind: 'budget', deltaM: -def.costM } as Effect] : []),
    ...def.startTrust.map((t): Effect => ({ kind: 'trust', stakeholder: t.stakeholder, delta: t.delta })),
  ];
  const a = applyEffects(s, effects, ctx);
  s.projects.push({ instanceId: id(s, 'p'), defId, startDay: day, endDay: day + def.months * DAYS_PER_MONTH });
  if (a.lines.length) addNews(s, day, `Project started — ${def.name}: ${a.lines.join('; ')}`, a.affects, true);
  return true;
}

function finishProject(s: CommsState, defId: string, day: number, content: Content): void {
  const def = getProjectDef(defId, content);
  if (!def) return;
  const a = applyEffects(s, def.effects, { day, source: def.name, shield: false });
  const tail = a.lines.length ? ` (${a.lines.join('; ')})` : '';
  addNews(s, day, `${def.name} finished: ${def.result}${tail}`, a.affects, a.lines.length > 0);
}

// -------------------------------------------------------------------- step

/** Random number from the persisted seed (advances it). */
export function nextRandom(s: CommsState): number {
  const v = rng(s.seed)();
  s.seed = nextSeed(s.seed);
  return v;
}

/**
 * Advance the draft to `day` (one step; callers step at most one day at a time).
 * Returns true when the state changed.
 */
export function stepTo(s: CommsState, day: number, content: Content = CONTENT): boolean {
  if (s.phase !== 'planning') return false;
  let changed = false;

  // 1. Timeline / trigger / player events.
  const fired = new Set(s.fired);
  for (const def of dueEvents(content.events, buildWorld(s, day), fired)) {
    deliverEvent(s, def, day);
    fired.add(def.id);
    s.nextPoolDay = Math.max(s.nextPoolDay, day + POOL_QUIET_DAYS);
    changed = true;
  }

  // 2. Pool draw.
  if (day >= s.nextPoolDay) {
    const def = drawPoolEvent(content.events, buildWorld(s, day), fired, oddsByTag(s), () => nextRandom(s));
    if (def) deliverEvent(s, def, day);
    const jitter = 1 + (nextRandom(s) * 2 - 1) * POOL_JITTER;
    s.nextPoolDay = Math.max(s.nextPoolDay, day) + POOL_INTERVAL_DAYS * jitter;
    changed = true;
  }

  // 3. Expire open events past their deadline.
  for (const inst of s.inbox) {
    if (inst.status === 'open' && day >= inst.deadlineDay) {
      expire(s, inst, day, content);
      changed = true;
    }
  }

  // 4. Finish projects.
  const done = s.projects.filter((p) => p.endDay <= day);
  if (done.length) {
    s.projects = s.projects.filter((p) => p.endDay > day);
    for (const p of done) finishProject(s, p.defId, day, content);
    changed = true;
  }

  // 5. Drop expired modifiers.
  const kept = s.modifiers.filter((m) => m.untilDay > day);
  if (kept.length !== s.modifiers.length) {
    s.modifiers = kept;
    changed = true;
  }

  // 6. Launch.
  if (day >= s.launchDay) {
    s.phase = 'launched';
    s.inFlight = resolveInFlight(content.inFlight, buildWorld(s, day));
    addNews(s, day, `Launched: ${s.missionName} is on its way`, OTHER_STATIONS, true);
    changed = true;
  }
  return changed;
}

/** Display name of a stakeholder (re-exported for convenience). */
export const stakeholderLabel = (k: StakeholderId): string => STAKEHOLDER_LABEL[k];
