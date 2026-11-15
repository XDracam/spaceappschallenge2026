// Comms game rules over a mutable GameState draft (the shared state). Pure and
// deterministic: randomness and ids come from the reducer ctx (ctx.rng / ctx.newId).
// No framework imports; used by ../logic.ts (reducers + tick handler) and read by the UI.

import { applyTrust, drawPoolEvent, dueEvents, resolveInFlight, trustBand } from '../../../shared/events/engine';
import { affectedStations } from '../../../shared/events/types';
import type { EventOption, WorldView } from '../../../shared/events/types';
import type { ActionCtx } from '../../../core/actions';
import { pushNews, setFlag } from '../../../core/coreActions';
import type { Contract, Offer, PartKind } from '../../../core/model';
import { budgetAvailableM, DAYS_PER_MONTH, type GameState } from '../../../core/state';
import { MISSION, missionById } from '../../../core/mission';
import type {
  Character, Effect, EventDef, EventInstance, ProjectDef, StakeholderId, StationId,
} from '../model/types';
import type { CommsSlice } from '../slice';
import { contentFor, type Content } from '../data/content';
import { POOL_INTERVAL_DAYS, PROJECT_SLOTS, TEAM_DEADLINE_DAYS } from '../data/mission';
import { FLAG_LAUNCH_PROMISE, FLAG_PROMISE_BROKEN } from '../data/helpers';
import { describeEffect, formatDay, STAKEHOLDER_LABEL } from './format';

export { DAYS_PER_MONTH };
/** Pool draws are jittered by up to ± this fraction of POOL_INTERVAL_DAYS. */
export const POOL_JITTER = 0.25;
/**
 * After a timeline/trigger/player event arrives, the next pool draw waits at least
 * this long: the pool fills quiet stretches, so the total stays near one event per
 * game month (= one per real minute) instead of pool + scripted on top of each other.
 */
export const POOL_QUIET_DAYS = POOL_INTERVAL_DAYS * (1 - POOL_JITTER);
/** Share of the price a comms-negotiated offer keeps on cancellation. */
const OFFER_CANCELLATION_PCT = 0.5;

/** Randomness + ids for rules (the reducer ctx). */
export type RulesCtx = Pick<ActionCtx, 'rng' | 'newId'>;

export type { Content };

/**
 * Comms content of the game's mission (s.meta.missionId). Rules take it from the
 * state, so every browser picks the same set for the same state (deterministic).
 */
export function contentOf(s: GameState): Content {
  return contentFor(s.meta.missionId);
}
/** Comms content of the active mission (core/mission.ts MISSION, live), for lookups without a state at hand. */
export function currentContent(): Content {
  return contentFor(MISSION.id);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ------------------------------------------------------------------ lookups

export function getEventDef(id: string, content: Content = currentContent()): EventDef | undefined {
  return content.events.find((e) => e.id === id);
}
export function getProjectDef(id: string, content: Content = currentContent()): ProjectDef | undefined {
  return content.projects.find((p) => p.id === id);
}
export function getCharacter(id: string, content: Content = currentContent()): Character | undefined {
  return content.characters.find((c) => c.id === id);
}
/** Stakeholder an event belongs to (via its character). */
export function eventStakeholder(def: EventDef, content: Content = currentContent()): StakeholderId | undefined {
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

/** What event conditions see: the shared state at `day` (default: today). */
export function buildWorld(s: GameState, day: number = s.clock.day): WorldView {
  return {
    day,
    launchDay: s.planner.plan.launchDay,
    budgetM: budgetAvailableM(s.budget),
    budgetTotalM: s.budget.fundingTotalM,
    trust: { ...s.comms.trust },
    flags: [...s.events.flags],
  };
}

/** Product of active 'eventOdds' factors per tag. */
export function oddsByTag(c: CommsSlice): Record<string, number> {
  const odds: Record<string, number> = {};
  for (const m of c.modifiers) {
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

/** Concurrent project slots (fixed). */
export function projectSlots(): number {
  return PROJECT_SLOTS;
}

/**
 * A project that can only be done once: a licence, a negotiation, lobbying, or one that
 * brings money, parts, research or a service. Galas and campaigns that only move trust
 * (or event odds) can be repeated.
 */
export function isOneOff(def: ProjectDef): boolean {
  if (def.kind === 'negotiation' || def.kind === 'lobbying') return true;
  return def.effects.some((e) => e.kind !== 'trust' && e.kind !== 'eventOdds' && e.kind !== 'flag');
}

/** One-off projects already finished in this game. */
export function doneProjects(c: CommsSlice): string[] {
  return c.done ?? [];
}

/** Comms stops (no new events, no answers, no projects) once the mission launched. */
export function isLaunched(s: GameState): boolean {
  return s.comms.launched || s.meta.phase === 'launched' || s.meta.phase === 'finished';
}

export type ProjectBlock = 'unknown' | 'launched' | 'running' | 'done' | 'noSlot' | 'trust' | 'budget';

/** Whether a project can start now, and why not. */
export function canStartProject(s: GameState, defId: string, content: Content = contentOf(s)): { ok: boolean; reason?: ProjectBlock } {
  const def = getProjectDef(defId, content);
  const c = s.comms;
  if (!def) return { ok: false, reason: 'unknown' };
  if (isLaunched(s)) return { ok: false, reason: 'launched' };
  if (c.projects.some((p) => p.defId === defId)) return { ok: false, reason: 'running' };
  if (doneProjects(c).includes(defId)) return { ok: false, reason: 'done' };
  if (c.projects.length >= projectSlots()) return { ok: false, reason: 'noSlot' };
  if (def.requires && c.trust[def.requires.stakeholder] < def.requires.min) return { ok: false, reason: 'trust' };
  if (budgetAvailableM(s.budget) < def.costM) return { ok: false, reason: 'budget' };
  return { ok: true };
}

// ----------------------------------------------------------------- effects

export interface EffectContext {
  rules: RulesCtx;
  /** Event or project name (offer notes). */
  source: string;
  /** Negative budget effects are event cuts (softened by strong Public), not costs the player chose to pay. */
  shield: boolean;
}

/** Result of applying effects: news lines for the internal ones and the stations they touch. */
export interface Applied { lines: string[]; affects: StationId[] }

function news(s: GameState, rules: RulesCtx, text: string, affects: StationId[]): void {
  pushNews(s, { from: 'comms', text, affects, internal: true }, rules.newId);
}

// --------------------------------------------------------- delivery targets

/** Calendar date of a game day in the game's mission ("14 Mar 2030"). */
export function dateOf(s: GameState, day: number): string {
  return formatDay(day, missionById(s.meta.missionId).startDateISO);
}

/** Day the part under this contract is needed: the earliest open task it serves, else the launch day. */
export function contractNeededAt(s: GameState, k: Contract): number {
  const days = s.market.allocations
    .filter((a) => a.contractId === k.id && a.status !== 'released')
    .flatMap((a) => s.market.tasks.filter((t) => t.id === a.taskId && t.status === 'open').map((t) => t.neededAt));
  return days.length ? Math.min(...days) : s.planner.plan.launchDay;
}

/** One delivery a deliveryDelay effect moves, with its arrival before and after. */
export interface DeliveryMove {
  contractId: string;
  part: string;
  supplier: string;
  from: number;
  to: number;
  neededAt: number;
}

/**
 * The deliveries a deliveryDelay effect moves, decided from the state now (the same rule
 * the effect applies, so the preview on an option is what happens):
 * - scope 'all': every active contract;
 * - scope 'next', sooner (months < 0): the delivery that is most late against its need date,
 *   or, when none is late, the one that arrives last (R1115m-r01-10: the expediting bonus
 *   used to speed up the earliest delivery, never the late one);
 * - scope 'next', later (months > 0): the delivery that arrives next.
 */
export function deliveryMoves(s: GameState, e: Extract<Effect, { kind: 'deliveryDelay' }>): DeliveryMove[] {
  const day = s.clock.day;
  const active = s.market.contracts.filter((c) => c.status === 'active');
  let targets: Contract[];
  if (e.scope === 'all') targets = active;
  else if (e.months < 0) {
    const late = (k: Contract) => k.expectedAt - contractNeededAt(s, k);
    targets = [...active].sort((a, b) => late(b) - late(a) || b.expectedAt - a.expectedAt).slice(0, 1);
  } else targets = [...active].sort((a, b) => a.expectedAt - b.expectedAt).slice(0, 1);
  return targets.map((k) => ({
    contractId: k.id,
    part: k.offerSnapshot.resource.name,
    supplier: k.offerSnapshot.supplierName,
    from: k.expectedAt,
    to: Math.max(Math.ceil(day), k.expectedAt + e.months * DAYS_PER_MONTH),
    neededAt: contractNeededAt(s, k),
  }));
}

/** A budget effect as it will apply: an event cut (shield) is halved by strong Public trust. */
export function shieldedBudget(s: GameState, deltaM: number, shield: boolean): { deltaM: number; softened: boolean } {
  if (deltaM >= 0 || !shield) return { deltaM, softened: false };
  const pct = passiveModifiers(s.comms.trust).budgetCutShieldPct;
  return pct > 0 ? { deltaM: round2(deltaM * (1 - pct / 100)), softened: true } : { deltaM, softened: false };
}

/** Money the agency spends directly (option and project costs). */
function spend(s: GameState, costM: number): void {
  s.budget.spentM = round2(s.budget.spentM + costM);
}

/** Rough dry mass for an offered part without an authored massT. */
const MASS_ESTIMATE_T: Record<string, number> = {
  'engine.ion': 0.05, engine: 0.4, tank: 0.2, instrument: 0.03, 'power.rtg': 0.3, power: 0.05,
  antenna: 0.03, legs: 0.1, heatShield: 0.3, radShield: 0.05, heatProtection: 0.1,
};

function offerFromEffect(e: Extract<Effect, { kind: 'offer' }>, rules: RulesCtx): Offer {
  const slug = e.supplier.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const label = `${e.variant} ${e.partKind}`;
  return {
    id: rules.newId('offer'),
    revision: 1,
    supplierId: `comms-${slug}`,
    supplierName: e.supplier,
    resource: {
      name: label.charAt(0).toUpperCase() + label.slice(1),
      partKind: e.partKind as PartKind,
      variant: e.variant,
      stats: { ...(e.stats ?? {}) },
      massT: e.massT ?? MASS_ESTIMATE_T[`${e.partKind}.${e.variant}`] ?? MASS_ESTIMATE_T[e.partKind] ?? 0.1,
    },
    quantity: 1,
    priceM: e.priceM,
    leadTimeDays: Math.round(e.deliveryMonths * DAYS_PER_MONTH),
    reliability: e.reliability,
    cancellationPct: OFFER_CANCELLATION_PCT,
    source: 'comms',
    status: 'available',
  };
}

/**
 * Apply one effect to the shared state. Trust clamps; budget changes the shared
 * funding; deliveries, prices and offers go to the market; research effects to
 * research; flags/services/constraints to the shared flags.
 * Returns the news line for an internal effect, or null for an external one.
 */
export function applyEffect(s: GameState, effect: Effect, ctx: EffectContext): string | null {
  const day = s.clock.day;
  let e = effect;
  let note = '';
  let text: string | null = null;
  if (e.kind === 'budget') {
    const b = shieldedBudget(s, e.deltaM, ctx.shield);
    if (b.softened) {
      e = { kind: 'budget', deltaM: b.deltaM };
      note = ', softened by public support';
    }
  }

  switch (e.kind) {
    case 'trust': {
      const before = passiveModifiers(s.comms.trust);
      s.comms.trust = applyTrust(s.comms.trust, [e]);
      const after = passiveModifiers(s.comms.trust);
      if (before.procurementPricePct !== after.procurementPricePct) {
        const p = after.procurementPricePct;
        const text = p === 0
          ? 'Industry relations back to normal: procurement prices and delivery times standard'
          : `Industry relations ${p < 0 ? 'strong' : 'strained'}: procurement prices and delivery times ${p < 0 ? '−' : '+'}${Math.abs(p)} %`;
        news(s, ctx.rules, text, ['procurement']);
      }
      break;
    }
    case 'budget':
      s.budget.fundingTotalM = round2(s.budget.fundingTotalM + e.deltaM);
      break;
    case 'deliveryDelay': {
      const moves = deliveryMoves(s, e);
      for (const m of moves) {
        const c = s.market.contracts.find((k) => k.id === m.contractId)!;
        c.expectedAt = m.to;
        c.revision++;
      }
      // The news names the part and the dates, so Procurement sees which delivery moved.
      const mo = (n: number) => `${Math.abs(n)} month${Math.abs(n) === 1 ? '' : 's'}`;
      if (!moves.length) text = `${describeEffect(e)}: no delivery under contract, nothing moved`;
      else if (e.scope === 'next') {
        const m = moves[0];
        text = `${m.part} (${m.supplier}) now arrives ${dateOf(s, m.to)} instead of ${dateOf(s, m.from)}`;
      } else text = `${moves.length} deliveries ${mo(e.months)} ${e.months < 0 ? 'earlier' : 'later'}`;
      break;
    }
    case 'priceModifier':
      s.market.modifiers.push({ effect: e, untilDay: day + e.months * DAYS_PER_MONTH });
      break;
    case 'offer':
      s.market.offers.push(offerFromEffect(e, ctx.rules));
      break;
    case 'researchPace':
      s.research.modifiers.push({ effect: e, untilDay: day + e.months * DAYS_PER_MONTH });
      break;
    case 'techAccess':
      (s.research.access ??= {})[e.tech] = e.access === 'block' ? 'blocked' : 'enabled';
      break;
    case 'researchLimit':
      s.research.limits[e.key] = Math.max(s.research.limits[e.key] ?? 0, e.value);
      break;
    case 'unlock':
      if (!s.research.unlocked.includes(e.key)) s.research.unlocked.push(e.key);
      break;
    case 'service':
      setFlag(s, `service.${e.service}`, true);
      break;
    case 'missionConstraint':
      setFlag(s, missionConstraintFlag(e.text), true);
      (s.coordination ??= []).push({ id: ctx.rules.newId('coord'), revision: 1, origin: 'effect', sourceText: e.text, title: `Mission constraint · ${ctx.source}`.slice(0, 120), description: `${e.text} This direction is not automatically verified by the simulation; mark complete after the team has addressed it.`, authorRole: 'comms', assignee: 'planner', status: 'open', createdAt: day, updatedAt: day });
      break;
    case 'flag':
      setFlag(s, e.flag, e.on);
      if (e.flag === FLAG_LAUNCH_PROMISE && e.on) s.comms.promisedLaunchDay = s.planner.plan.launchDay;
      break;
    case 'eventOdds':
      s.comms.modifiers.push({ effect: e, untilDay: day + e.months * DAYS_PER_MONTH });
      break;
  }

  const to = affectedStations([e]);
  if (to.length === 0) return null;
  return (text ?? describeEffect(e)) + note;
}

/** Shared flag raised by a missionConstraint effect: 'constraint.<slug of the text>'. */
export function missionConstraintFlag(text: string): string {
  return `constraint.${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}`;
}

export function applyEffects(s: GameState, effects: Effect[], ctx: EffectContext): Applied {
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

export function deliverEvent(s: GameState, def: EventDef, rules: RulesCtx): EventInstance {
  const day = s.clock.day;
  const inst: EventInstance = {
    instanceId: rules.newId('ev'),
    eventId: def.id,
    arrivedDay: day,
    deadlineDay: day + deadlineDaysOf(def),
    status: 'open',
  };
  s.comms.inbox.push(inst);
  if (!s.comms.fired.includes(def.id)) s.comms.fired.push(def.id);
  return inst;
}

/**
 * Does answering (or ignoring) this event change a teammate's own work (deliveries, prices,
 * offers, research)? Money alone does not count: the shared budget is visible to everyone.
 */
export function needsTeammate(def: EventDef): boolean {
  const touches = (fx: Effect[]) => affectedStations(fx.filter((e) => e.kind !== 'budget')).length > 0;
  return def.options.some((o) => touches(o.effects)) || touches(def.ignored.effects);
}

/** Days to answer: the authored deadline, at least TEAM_DEADLINE_DAYS when a teammate is affected. */
export function deadlineDaysOf(def: EventDef): number {
  return needsTeammate(def) ? Math.max(def.deadlineDays, TEAM_DEADLINE_DAYS) : def.deadlineDays;
}

/** Whether an open event can be answered with this option right now (budget for its cost). */
export function canAnswer(s: GameState, instanceId: string, optionId: string, content: Content = contentOf(s)): boolean {
  if (isLaunched(s)) return false;
  const inst = s.comms.inbox.find((i) => i.instanceId === instanceId);
  if (!inst || inst.status !== 'open') return false;
  const option = getEventDef(inst.eventId, content)?.options.find((o) => o.id === optionId);
  if (!option) return false;
  return !option.costM || option.costM <= budgetAvailableM(s.budget);
}

/** Answer an open event. Returns the outcome text, or null if not possible. */
export function answerEvent(
  s: GameState, rules: RulesCtx, instanceId: string, optionId: string, content: Content = contentOf(s),
): string | null {
  if (!canAnswer(s, instanceId, optionId, content)) return null;
  const inst = s.comms.inbox.find((i) => i.instanceId === instanceId)!;
  const def = getEventDef(inst.eventId, content)!;
  const option = def.options.find((o) => o.id === optionId)!;

  inst.status = 'answered';
  inst.chosenOptionId = optionId;
  const lines: string[] = [];
  const affects = new Set<StationId>();
  const collect = (a: Applied) => {
    lines.push(...a.lines);
    a.affects.forEach((st) => affects.add(st));
  };
  let effects = option.effects;
  if (option.costM) {
    // The cost is money spent (not a funding cut): one matching budget effect is that cost.
    const i = effects.findIndex((e) => e.kind === 'budget' && e.deltaM === -option.costM!);
    if (i >= 0) effects = effects.filter((_, j) => j !== i);
    spend(s, option.costM);
    const cost: Effect = { kind: 'budget', deltaM: -option.costM };
    lines.push(describeEffect(cost));
    affectedStations([cost]).forEach((st) => affects.add(st));
  }
  // With a cost, other budget effects are not shielded; without one, a negative budget effect is a cut.
  collect(applyEffects(s, effects, { rules, source: def.title, shield: !option.costM }));
  if (lines.length) news(s, rules, `${def.title}: ${lines.join('; ')}`, [...affects]);
  return option.outcome;
}

function expire(s: GameState, rules: RulesCtx, inst: EventInstance, content: Content): void {
  inst.status = 'expired';
  const def = getEventDef(inst.eventId, content);
  if (!def) return;
  const a = applyEffects(s, def.ignored.effects, { rules, source: def.title, shield: true });
  // External outcomes (trust only) stay on the comms station: no shared news.
  if (a.lines.length) news(s, rules, `No reply — ${def.title}: ${def.ignored.outcome} (${a.lines.join('; ')})`, a.affects);
}

// ---------------------------------------------------------------- projects

/** Start a project if allowed (cost spent from the shared budget). Returns true when started. */
export function startProjectIn(s: GameState, rules: RulesCtx, defId: string, content: Content = contentOf(s)): boolean {
  if (!canStartProject(s, defId, content).ok) return false;
  const def = getProjectDef(defId, content)!;
  const day = s.clock.day;
  const lines: string[] = [];
  const affects = new Set<StationId>();
  if (def.costM) {
    spend(s, def.costM);
    const cost: Effect = { kind: 'budget', deltaM: -def.costM };
    lines.push(describeEffect(cost));
    affectedStations([cost]).forEach((st) => affects.add(st));
  }
  const trustFx = def.startTrust.map((t): Effect => ({ kind: 'trust', stakeholder: t.stakeholder, delta: t.delta }));
  const a = applyEffects(s, trustFx, { rules, source: def.name, shield: false });
  lines.push(...a.lines);
  a.affects.forEach((st) => affects.add(st));
  s.comms.projects.push({ instanceId: rules.newId('proj'), defId, startDay: day, endDay: day + def.months * DAYS_PER_MONTH });
  if (lines.length) news(s, rules, `Project started — ${def.name}: ${lines.join('; ')}`, [...affects]);
  return true;
}

function finishProject(s: GameState, rules: RulesCtx, defId: string, content: Content): void {
  const def = getProjectDef(defId, content);
  if (!def) return;
  if (isOneOff(def)) s.comms.done = [...doneProjects(s.comms).filter((id) => id !== defId), defId];
  const a = applyEffects(s, def.effects, { rules, source: def.name, shield: false });
  if (a.lines.length) news(s, rules, `${def.name} finished: ${def.result} (${a.lines.join('; ')})`, a.affects);
}

// -------------------------------------------------------------------- step

/**
 * Advance comms to `day` (callers step at most one calendar day at a time; the
 * shared clock is already at `day`): due and pool events arrive, open events past
 * their deadline expire, projects finish, timed comms modifiers run out.
 */
export function stepTo(s: GameState, rules: RulesCtx, day: number, content: Content = contentOf(s)): void {
  const c = s.comms;

  // 0. A launch later than the day Comms promised breaks the promise (follow-up message).
  if (c.promisedLaunchDay !== undefined && s.planner.plan.launchDay > c.promisedLaunchDay && !s.events.flags.includes(FLAG_PROMISE_BROKEN)) {
    setFlag(s, FLAG_PROMISE_BROKEN, true);
  }

  // 1. Timeline / trigger / player events.
  const fired = new Set(c.fired);
  for (const def of dueEvents(content.events, buildWorld(s, day), fired)) {
    deliverEvent(s, def, rules);
    fired.add(def.id);
    c.nextPoolDay = Math.max(c.nextPoolDay, day + POOL_QUIET_DAYS);
  }

  // 2. Pool draw.
  if (day >= c.nextPoolDay) {
    const def = drawPoolEvent(content.events, buildWorld(s, day), fired, oddsByTag(c), rules.rng);
    if (def) deliverEvent(s, def, rules);
    const jitter = 1 + (rules.rng() * 2 - 1) * POOL_JITTER;
    c.nextPoolDay = Math.max(c.nextPoolDay, day) + POOL_INTERVAL_DAYS * jitter;
  }

  // 3. Expire open events past their deadline.
  for (const inst of c.inbox) {
    if (inst.status === 'open' && day >= inst.deadlineDay) expire(s, rules, inst, content);
  }

  // 4. Finish projects.
  const done = c.projects.filter((p) => p.endDay <= day);
  if (done.length) {
    c.projects = c.projects.filter((p) => p.endDay > day);
    for (const p of done) finishProject(s, rules, p.defId, content);
  }

  // 5. Drop expired comms modifiers.
  if (c.modifiers.some((m) => m.untilDay <= day)) c.modifiers = c.modifiers.filter((m) => m.untilDay > day);
}

/** Resolve the in-flight events once, from the state at launch. */
export function resolveLaunch(s: GameState, content: Content = contentOf(s)): void {
  if (s.comms.launched) return;
  s.comms.launched = true;
  s.comms.inFlight = resolveInFlight(content.inFlight, buildWorld(s));
}

export interface InFlightResult {
  eventId: string;
  station: StationId;
  title: string;
  good: boolean;
  text: string;
  goalChanceDelta: number;
}

/**
 * In-flight events with their outcome (for the mission result screen). Uses the
 * results resolved at launch; before that (or if comms never ticked at launch),
 * resolves them from the current state. Pure: does not modify `s`.
 */
export function commsInFlightResults(s: GameState, content: Content = contentOf(s)): InFlightResult[] {
  const resolved = s.comms.launched ? s.comms.inFlight : resolveInFlight(content.inFlight, buildWorld(s));
  return resolved.flatMap((r) => {
    const def = content.inFlight.find((d) => d.id === r.eventId);
    if (!def) return [];
    const o = r.good ? def.good : def.bad;
    return [{ eventId: def.id, station: def.station, title: def.title, good: r.good, text: o.text, goalChanceDelta: o.goalChanceDelta }];
  });
}

/** Display name of a stakeholder (re-exported for convenience). */
export const stakeholderLabel = (k: StakeholderId): string => STAKEHOLDER_LABEL[k];
