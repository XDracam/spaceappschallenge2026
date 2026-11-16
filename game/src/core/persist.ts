// Host saves the authoritative state to localStorage (resume after a reload).
import { getState, onHostState, syncStore } from './store';
import { createStore } from './createStore';
import { STATE_VERSION, type GameState } from './state';
import { validGameState } from './validation';
import { initialScienceSlice } from '../stations/science/slice';
import { contentOf, missionConstraintFlag } from '../stations/comms/state/world';

const KEY = 'mission-control.save.v1';
let timer: ReturnType<typeof setTimeout> | null = null;
let latest: GameState | null = null;

export const saveLoadIssue = createStore<string | null>(null);
function loadIssue(message: string | null): void {
  if (saveLoadIssue.get() !== message) saveLoadIssue.set(message);
}

/** Preserve an unreadable record for the player before an explicit reset. */
export function downloadSavedRecord(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 't-minus-local-save.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch { return false; }
}

export const persistenceStatus = createStore<'idle' | 'saved' | 'failed'>('idle');

/** Explicit retry uses the current authoritative game, including pending calendar changes. */
export function retrySave(): boolean {
  if (syncStore.get().role === 'client') return false;
  return save(getState());
}

export function startPersistence(): void {
  onHostState((s) => {
    latest = s;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (latest) save(latest);
    }, 1000);
  });
  addEventListener('pagehide', () => latest && save(latest));
}

function save(s: GameState): boolean {
  // Never replace an unreadable record until the player explicitly resets it.
  if (saveLoadIssue.get()) { persistenceStatus.set('failed'); return false; }
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    persistenceStatus.set('saved');
    return true;
  } catch {
    persistenceStatus.set('failed');
    return false;
  }
}

export function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { loadIssue(null); return null; }
    const s = JSON.parse(raw) as GameState;
    const originalVersion = s?.version;
    if (s?.version === 1) migrateV1(s);
    if (s?.version === 2) migrateV2(s);
    // The earlier task-board branch also called its graph-based save format v3.
    if (s?.version === 3 && !Array.isArray(s.science?.researched)) migrateV2(s);
    if (s?.version === 3) migrateV3(s);
    // Version 5 added optional fields only (Contract.tested, ResearchProject.partId).
    if (s?.version === 4) s.version = 5;
    // Version 6 added the attempt counter and history (core/restart, core/recordAttempt).
    if (s?.version === 5) s.version = 6;
    // Version 7 adds shared requests, including saves from the earlier coordination branch.
    if (s?.version === 6) {
      s.coordination ??= [];
      s.version = 7;
    }
    // Version 8 added science facilities, hired teams and supply requests (D-032).
    if (s?.version === 7) {
      s.research.facilities ??= [];
      s.research.teams ??= [];
      s.research.supplyRequests ??= [];
      s.version = 8;
    }
    if (s?.version !== STATE_VERSION || !s.meta) throw new Error('Unsupported save format');
    // Saves from before mission selection were Mars games.
    s.meta.missionId ??= 'mars-orbiter-lander';
    if (!Number.isInteger(s.meta.attempt) || s.meta.attempt < 1) s.meta.attempt = 1;
    if (!Array.isArray(s.meta.attempts)) s.meta.attempts = [];
    if (originalVersion < 7) recoverConstraintRequests(s);
    if (!validGameState(s)) throw new Error('Incomplete save');
    loadIssue(null);
    return s;
  } catch {
    loadIssue('The local save could not be read. Download a copy before resetting it; the existing record has been kept.');
    return null;
  }
}

/** Earlier saves retained the requirement flag without recording a player's review. */
function recoverConstraintRequests(s: GameState): void {
  const content = contentOf(s);
  const effects = [
    ...content.events.flatMap(e => [...e.options.flatMap(o => o.effects), ...e.ignored.effects]),
    ...content.projects.flatMap(p => p.effects),
  ];
  for (const effect of effects) {
    if (effect.kind !== 'missionConstraint' || !s.events.flags.includes(missionConstraintFlag(effect.text))) continue;
    if (s.coordination.some(t => t.origin === 'effect' && (t.sourceText === effect.text || t.description.startsWith(effect.text)))) continue;
    s.coordination.push({ id: `coord-${s.meta.nextId++}`, revision: 1, origin: 'effect', sourceText: effect.text, title: 'Review earlier mission constraint', description: `${effect.text} This came from an older save; whether it was addressed is unknown. The simulation does not automatically verify it.`, authorRole: 'comms', assignee: 'planner', status: 'open', createdAt: s.clock.day, updatedAt: s.clock.day });
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(KEY);
    latest = null;
    if (timer) clearTimeout(timer);
    timer = null;
    loadIssue(null);
    persistenceStatus.set('idle');
  } catch {
    /* ignore */
  }
}

/** Preserve accounting and supply while translating the old Science task links. */
function migrateV1(s: GameState): void {
  for (const k of s.market.contracts) {
    k.baselineExpectedAt ??= k.expectedAt;
    k.amendmentCutoff ??= k.signedAt + Math.max(1, (k.baselineExpectedAt - k.signedAt) * 0.75);
    k.delivery ??= 'standard'; k.initialDelivery ??= k.delivery; k.amendments ??= [];
    k.offerSnapshot.deliveryOptions ??= [{id:'standard', daysFactor:1, priceFactor:1}];
  }
  for (const o of s.market.offers) if (o.source !== 'catalogue') o.remainingQuantity ??= o.status === 'available' ? o.quantity : 0;
  for (const call of s.market.calls) {
    const task = s.market.tasks.find(t => t.id === call.taskId);
    const crit = task?.criteria.find(c => c.id === call.criterionId);
    if (crit) { call.requirement ??= structuredClone(crit); call.destination ??= {kind:'task',taskId:call.taskId,criterionId:call.criterionId}; call.neededAt ??= task?.neededAt; call.taskRevision ??= task?.revision; }
    call.windowDays ??= 30;
  }
  s.version = 2;
}

/** Science became an engineering tech tree (D-020): the old research projects, slice and test-unit links are dropped. */
function migrateV2(s: GameState): void {
  // Preserve already purchased legacy equipment as department supply when its old project is retired.
  for (const info of Object.values(s.science.info ?? {}) as { testTaskId?: string }[]) {
    if (!info.testTaskId) continue;
    for (const a of s.market.allocations.filter(a => a.taskId === info.testTaskId && a.status !== 'released')) {
      a.department = 'science'; a.taskId = ''; a.criterionId = ''; a.revision++;
    }
    const task = s.market.tasks.find(t => t.id === info.testTaskId);
    if (task?.status === 'open') { task.status = 'withdrawn'; task.revision++; }
  }
  for (const a of s.market.allocations) delete (a as { projectId?: string }).projectId;
  s.research.projects = s.research.projects.filter((p) => p.techId);
  s.research.access ??= {};
  s.science = initialScienceSlice();
  s.version = 3;
}

/** Research requests from Procurement are gone: science reads what the design needs straight from the planner's rocket. */
function migrateV3(s: GameState): void {
  delete (s.research as { requests?: unknown }).requests;
  s.version = 4;
}
