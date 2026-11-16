// Action registry. Every change to the shared GameState is a named action applied
// by a pure, deterministic reducer — on the host and, in the same order, on every
// client. Rules for reducers (see docs/design/integration.md):
//  - mutate only the draft `s` passed in; no side effects, no stores, no DOM
//  - no Date.now() / Math.random(): use ctx.rng() and ctx.newId()
//  - all inputs come from `args` (ids made by the sender are fine)
import { rng } from '../shared/events/engine';
import type { StationId } from './model';
import type { GameState } from './state';

export interface Action {
  type: string;                 // 'namespace/name', e.g. 'planner/setPartStat'
  args: unknown[];
  by: StationId | 'host';
}

export interface ActionCtx {
  by: StationId | 'host';
  /** Current calendar day (s.clock.day). */
  day: number;
  /** Deterministic random number in [0, 1); advances s.meta.rngCounter. */
  rng(): number;
  /** Deterministic unique id from s.meta.nextId. */
  newId(prefix: string): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Reducer = (s: GameState, ctx: ActionCtx, ...args: any[]) => void;

const registry = new Map<string, Reducer>();

/**
 * Register a namespace of reducers and get back typed dispatchers.
 * Usage:
 *   export const plannerActions = defineActions('planner', {
 *     setLaunchDay(s, ctx, day: number) { ... },
 *   });
 *   plannerActions.setLaunchDay(250);   // dispatches 'planner/setLaunchDay'
 */
export function defineActions<T extends Record<string, Reducer>>(ns: string, defs: T): {
  [K in keyof T]: T[K] extends (s: GameState, ctx: ActionCtx, ...args: infer A) => void ? (...args: A) => void : never;
} {
  const out: Record<string, (...args: unknown[]) => void> = {};
  for (const [name, fn] of Object.entries(defs)) {
    const type = `${ns}/${name}`;
    // Re-registration replaces the reducer (dev hot reload re-runs station logic modules).
    registry.set(type, fn);
    out[name] = (...args: unknown[]) => {
      for (const cb of dispatchObservers) cb(type, args);
      dispatchHook(type, args);
    };
  }
  return out as never;
}

/** Observers of locally dispatched actions (playtest telemetry, core/playtestHook.ts). */
const dispatchObservers = new Set<(type: string, args: unknown[]) => void>();
export function observeDispatch(cb: (type: string, args: unknown[]) => void): () => void {
  dispatchObservers.add(cb);
  return () => dispatchObservers.delete(cb);
}

/** Set by core/store.ts: sends the action through the sync layer. */
let dispatchHook: (type: string, args: unknown[]) => void = () => {
  throw new Error('store not initialised');
};
export function setDispatchHook(fn: (type: string, args: unknown[]) => void): void {
  dispatchHook = fn;
}

function makeCtx(s: GameState, by: Action['by']): ActionCtx {
  return {
    by,
    day: s.clock.day,
    rng: () => rng((s.meta.seed ^ Math.imul(++s.meta.rngCounter, 0x9e3779b1)) >>> 0)(),
    newId: (prefix) => `${prefix}-${s.meta.nextId++}`,
  };
}

/** Apply one action to a state (returns a new state; the input is not modified). */
export function applyAction(state: GameState, action: Action): GameState {
  const fn = registry.get(action.type);
  if (!fn) {
    console.warn(`[core] unknown action ${action.type}`);
    return state;
  }
  const draft = structuredClone(state);
  // JSON turns optional array slots from undefined into null. Restore the
  // omitted-argument semantics used by the typed local dispatchers.
  fn(draft, makeCtx(draft, action.by), ...action.args.map(arg => arg === null ? undefined : arg));
  return share(state, draft, 3) as GameState;
}

/**
 * Structural sharing: parts of `next` that equal `prev` are replaced by `prev`'s
 * objects, so UI selectors see unchanged identities and don't re-render on every
 * calendar tick. Compares by JSON down to `depth` levels of objects/arrays.
 */
function share(prev: unknown, next: unknown, depth: number): unknown {
  if (prev === next || typeof prev !== 'object' || typeof next !== 'object' || !prev || !next) return next;
  if (Array.isArray(prev) !== Array.isArray(next)) return next;
  if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
  if (depth <= 0) return next;
  if (Array.isArray(next)) {
    const p = prev as unknown[];
    for (let i = 0; i < next.length; i++) if (i < p.length) next[i] = share(p[i], next[i], depth - 1);
    return next;
  }
  const n = next as Record<string, unknown>;
  const p = prev as Record<string, unknown>;
  for (const k of Object.keys(n)) if (k in p) n[k] = share(p[k], n[k], depth - 1);
  return next;
}

// ------------------------------------------------------------ calendar ticks

/**
 * Per-station logic that runs when the calendar advances (deliveries, research
 * finishing, comms events, launch). Handlers run in registration order inside the
 * 'core/tick' reducer, so they are deterministic too.
 */
export type TickHandler = (s: GameState, ctx: ActionCtx, fromDay: number, toDay: number) => void;
const tickHandlers: { name: string; fn: TickHandler }[] = [];

export function onTick(name: string, fn: TickHandler): void {
  if (tickHandlers.some((h) => h.name === name)) return;
  tickHandlers.push({ name, fn });
}

export function runTickHandlers(s: GameState, ctx: ActionCtx, fromDay: number, toDay: number): void {
  for (const h of tickHandlers) h.fn(s, ctx, fromDay, toDay);
}
