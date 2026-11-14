// Pure research rules shared by the science reducers (logic.ts) and the UI:
// project plans (cost, duration, odds, effects), key labels, request coverage.
// No UI imports, no randomness.
import type { Effect, ResearchProject, ResearchState, Task } from '../../../core/model';
import type { GameState } from '../../../core/state';
import { DAYS_PER_MONTH, budgetAvailableM } from '../../../core/state';
import { MISSION } from '../../../core/mission';
import { partName, statDefs } from '../../planner/data/parts';
import type { PartKind as PlannerPartKind } from '../../planner/model/types';
import type { MethodId, ScopeId, ScienceSlice } from '../slice';
import { INITIAL_SLOTS } from '../slice';
import type { Discipline, Odds, Recipe, TestPart } from './types';
import { recipeByKey } from '../data/recipes';
import { DISCIPLINES } from '../data/fields';

// ------------------------------------------------------------- numbers

export const ODDS_CHANCE: Record<Odds, number> = { Good: 0.85, Medium: 0.65, 'Long shot': 0.35 };

export function oddsLabel(chance: number): Odds {
  return chance >= 0.75 ? 'Good' : chance >= 0.5 ? 'Medium' : 'Long shot';
}

export interface ScopeDef {
  id: ScopeId;
  title: string;
  text: string;
  /** Multiplies limit gains. */
  gain: number;
  chance: number;
  time: number;
  cost: number;
  /** Can this scope unlock a new part type? */
  unlocks: boolean;
  tone: 'green' | 'amber' | 'orange';
}

export const SCOPES: ScopeDef[] = [
  { id: 'safe', title: 'Safe: a narrow question', text: 'Half the gain, but usually answered. Cannot qualify a new part type.', gain: 0.5, chance: 0.12, time: 0.75, cost: 0.7, unlocks: false, tone: 'green' },
  { id: 'balanced', title: 'Balanced: test the link', text: 'The full gain the idea promises, at its own odds.', gain: 1, chance: 0, time: 1, cost: 1, unlocks: true, tone: 'amber' },
  { id: 'bold', title: 'Bold: claim a big result', text: 'Double the gain, slower and riskier. Draws scrutiny.', gain: 2, chance: -0.2, time: 1.35, cost: 1.5, unlocks: true, tone: 'orange' },
];

export interface MethodDef {
  id: MethodId;
  title: string;
  text: string;
  chance: number;
  time: number;
  cost: number;
  tone: 'green' | 'amber' | 'muted';
}

export const METHODS: MethodDef[] = [
  { id: 'archive', title: 'Re-use archives', text: 'Existing orbiter and rover data. Fast and cheap, but noisy.', chance: -0.05, time: 0.8, cost: 0.6, tone: 'green' },
  { id: 'new', title: 'New measurements', text: 'Our own tests. Clean data, slower and dearer. A delivered test unit adds odds.', chance: 0.08, time: 1.1, cost: 1.25, tone: 'amber' },
  { id: 'model', title: 'Model only', text: 'Predict from physics. Cheapest, but tests ideas, not the world.', chance: -0.1, time: 0.7, cost: 0.45, tone: 'muted' },
];

export const scopeDef = (id: ScopeId) => SCOPES.find((s) => s.id === id) ?? SCOPES[1];
export const methodDef = (id: MethodId) => METHODS.find((m) => m.id === id) ?? METHODS[1];

/** Odds bonus when the requested test unit has been delivered before the project ends. */
export const TEST_UNIT_BONUS = 0.1;

/** Long shot: fields with no authored recipe. Cheap, short, rarely pays off. */
export const LONG_SHOT = { months: 2, costM: 3, chance: 0.2 };

const MIN_CHANCE = 0.05;
const MAX_CHANCE = 0.95;

// ------------------------------------------------------------- labels

const FIELD_LABEL: Record<string, string> = {};
for (const d of Object.keys(DISCIPLINES) as Discipline[]) {
  DISCIPLINES[d].fields.forEach((label, i) => { FIELD_LABEL[DISCIPLINES[d].prefix + (i + 1)] = label; });
}
export const fieldLabel = (id: string) => FIELD_LABEL[id] ?? 'Unknown field';
export const isKnownField = (id: string) => id in FIELD_LABEL;

interface KeyInfo { kind: string; variant: string; stat?: string; label: string; unit: string; step: number; max: number }

export function keyInfo(key: string): KeyInfo {
  const [kind, variant, stat] = key.split('.');
  let name = key;
  try { name = partName(kind as PlannerPartKind, variant); } catch { /* unknown kind */ }
  if (!stat) return { kind, variant, label: name, unit: '', step: 1, max: Infinity };
  let def;
  try { def = statDefs(kind as PlannerPartKind, variant)?.find((d) => d.key === stat); } catch { def = undefined; }
  return {
    kind, variant, stat,
    label: `${name} ${def ? (def.label === 'Isp' ? 'Isp' : def.label[0].toLowerCase() + def.label.slice(1)) : stat}`,
    unit: def?.unit ?? '',
    step: def?.step ?? 0.01,
    max: def?.max ?? Infinity,
  };
}

export function formatValue(v: number, unit: string): string {
  const n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : String(+v.toFixed(2));
  return unit ? `${n} ${unit}` : n;
}

/** "Hydrogen / oxygen engine Isp 450 → 460 s" or "RTG unlocked". */
export function describeEffect(e: Effect, before?: ResearchState): string {
  if (e.kind === 'unlock') return `${keyInfo(e.key).label} unlocked`;
  if (e.kind === 'researchLimit') {
    const k = keyInfo(e.key);
    const from = before?.limits[e.key];
    return from !== undefined
      ? `${k.label} limit ${formatValue(from, '')} → ${formatValue(e.value, k.unit)}`
      : `${k.label} limit ${formatValue(e.value, k.unit)}`;
  }
  if (e.kind === 'flag') return `flag ${e.flag}`;
  return e.kind;
}

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

// ------------------------------------------------------------- slice access

/** The science slice with defaults filled in (older saves may lack fields). */
export function sci(s: GameState): ScienceSlice {
  const x = (s.science ?? {}) as Partial<ScienceSlice>;
  return {
    revealed: x.revealed ?? [],
    slots: x.slots ?? INITIAL_SLOTS,
    discovered: x.discovered ?? [],
    info: x.info ?? {},
  };
}

export const running = (r: ResearchState) => r.projects.filter((p) => p.status === 'running');

// ------------------------------------------------------------- plans

export interface ProjectPlan {
  recipeKey: string;
  fieldIds: string[];
  recipe?: Recipe;
  longShot: boolean;
  pure: boolean;
  title: string;
  pitch: string;
  costM: number;
  months: number;
  days: number;
  successChance: number;
  odds: Odds;
  effects: Effect[];
  /** Planner keys this project would advance (for request matching). */
  keys: string[];
  /** Why it cannot start right now (null = can start). */
  blocked: string | null;
}

/** Highest limit a key will have once running projects succeed (projects build on each other). */
function pendingLimit(r: ResearchState, key: string): number | undefined {
  let v = r.limits[key];
  for (const p of running(r)) {
    for (const e of p.effects) if (e.kind === 'researchLimit' && e.key === key) v = Math.max(v ?? -Infinity, e.value);
  }
  return v;
}

function pendingUnlock(r: ResearchState, key: string): boolean {
  return r.unlocked.includes(key) || running(r).some((p) => p.effects.some((e) => e.kind === 'unlock' && e.key === key));
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Everything about a project before it starts. Deterministic: the reducer and the draft screen agree. */
export function planProject(s: GameState, recipeKey: string, scope: ScopeId, method: MethodId): ProjectPlan {
  const fieldIds = recipeKey.split('+').filter(Boolean);
  const recipe = recipeByKey(recipeKey);
  const sc = scopeDef(scope);
  const me = methodDef(method);
  const r = s.research;

  const baseMonths = recipe ? recipe.months : LONG_SHOT.months;
  const baseCost = recipe ? recipe.costM : LONG_SHOT.costM;
  const baseChance = recipe ? ODDS_CHANCE[recipe.odds] : LONG_SHOT.chance;

  const months = Math.max(1, Math.round(baseMonths * sc.time * me.time * 2) / 2);
  const costM = Math.max(1, round1(baseCost * sc.cost * me.cost));
  const successChance = Math.round(Math.min(MAX_CHANCE, Math.max(MIN_CHANCE, baseChance + sc.chance + me.chance)) * 100) / 100;

  const effects: Effect[] = [];
  const keys: string[] = [];
  let unlockBlocked = false;
  for (const g of recipe?.gains ?? []) {
    if (g.kind === 'unlock') {
      if (!sc.unlocks) { unlockBlocked = true; continue; }
      if (pendingUnlock(r, g.key)) continue;
      effects.push({ kind: 'unlock', key: g.key });
      keys.push(g.key);
    } else {
      const k = keyInfo(g.key);
      const base = pendingLimit(r, g.key);
      if (base === undefined) continue;
      const gain = Math.max(k.step, roundTo(g.delta * sc.gain, k.step));
      const value = Math.min(k.max, +(base + gain).toFixed(4));
      if (value <= base + 1e-9) continue;
      effects.push({ kind: 'researchLimit', key: g.key, value });
      keys.push(g.key);
    }
  }
  const pure = !recipe || recipe.gains.length === 0;
  if (pure) {
    for (const f of recipe?.flags ?? ['research.breakthrough']) effects.push({ kind: 'flag', flag: f, on: true });
  } else {
    for (const f of recipe?.flags ?? []) effects.push({ kind: 'flag', flag: f, on: true });
  }

  const names = fieldIds.map(fieldLabel).join(' + ');
  const title = recipe ? recipe.title : `Long shot: ${names}`;
  const pitch = recipe ? recipe.pitch : 'Nobody has seen these fields together. A cheap first look might find a link, or nothing.';

  const sl = sci(s);
  let blocked: string | null = null;
  const rs = running(r);
  const infoOf = (p: ResearchProject) => sl.info[p.id];
  if (s.meta.phase !== 'planning') blocked = s.meta.phase === 'lobby' ? 'The game has not started.' : 'The mission has launched. Research is closed.';
  else if (fieldIds.length < 2 || !fieldIds.every(isKnownField)) blocked = 'Pick two or three known fields.';
  else if (rs.some((p) => infoOf(p)?.recipeKey === recipeKey)) blocked = 'A team is already working on this idea.';
  else if (!pure && effects.every((e) => e.kind === 'flag'))
    blocked = unlockBlocked ? 'A safe scope cannot qualify a new part type. Choose Balanced or Bold.' : 'Nothing left to gain: the limits are at the physical maximum or already researched.';
  else if (pure && recipe && r.projects.some((p) => p.status === 'succeeded' && infoOf(p)?.recipeKey === recipeKey)) blocked = 'Already published.';
  else if (rs.length >= sl.slots) blocked = `All ${sl.slots} research teams are busy.`;
  else if (costM > budgetAvailableM(s.budget) + 1e-9) blocked = 'Not enough budget available.';

  return {
    recipeKey, fieldIds, recipe, longShot: !recipe, pure, title, pitch, costM, months,
    days: months * DAYS_PER_MONTH, successChance, odds: oddsLabel(successChance), effects, keys, blocked,
  };
}

// ------------------------------------------------------------- requests

/** Planner tasks that ask for parts beyond research (open, authored by the planner). */
export function plannerRequests(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.authorRole === 'planner' && t.status === 'open' && t.beyondResearch.length > 0);
}

/** The value a task needs for a research key (undefined for unlock keys or unknown stats). */
export function neededValue(task: Task, key: string): number | undefined {
  const [kind, variant, stat] = key.split('.');
  if (!stat) return undefined;
  let v: number | undefined;
  for (const c of task.criteria) {
    if (c.partKind === kind && c.variant === variant && c.minimums[stat] !== undefined) v = Math.max(v ?? -Infinity, c.minimums[stat]);
  }
  return v;
}

/** Is this beyond-research key now within research? */
export function keyCovered(r: ResearchState, task: Task, key: string): boolean {
  const [, , stat] = key.split('.');
  if (!stat) return r.unlocked.includes(key);
  const need = neededValue(task, key);
  const have = r.limits[key];
  return need !== undefined && have !== undefined && have >= need - 1e-9;
}

export function taskAnswered(r: ResearchState, task: Task): boolean {
  return task.beyondResearch.every((k) => keyCovered(r, task, k));
}

/** Open planner requests whose uncovered keys a set of keys touches. */
export function requestsTouchedBy(s: GameState, keys: string[]): Task[] {
  return plannerRequests(s.market.tasks).filter((t) => t.beyondResearch.some((k) => keys.includes(k) && !keyCovered(s.research, t, k)));
}

/** Department stock remains backed by its contract and is reserved exclusively. */
export function scienceSupplies(s: GameState, requirement?: TestPart, projectId?: string) {
  return s.market.allocations.filter(a => a.department === 'science' && a.status !== 'released').flatMap(a => {
    const contract = s.market.contracts.find(c => c.id === a.contractId && (c.status === 'active' || c.status === 'delivered'));
    if (!contract) return [];
    const r = contract.offerSnapshot.resource;
    const compatible = !requirement || (r.partKind === requirement.partKind && r.variant === requirement.variant && Object.entries(requirement.minimums).every(([k, v]) => (r.stats[k] ?? -Infinity) >= v));
    return [{ allocation: a, contract, compatible, available: !a.projectId || a.projectId === projectId }];
  });
}
