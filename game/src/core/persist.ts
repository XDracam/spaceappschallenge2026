// Host saves the authoritative state to localStorage (resume after a reload).
import { onHostState } from './store';
import { STATE_VERSION, type GameState } from './state';
import { initialScienceSlice } from '../stations/science/slice';

const KEY = 'mission-control.save.v1';
let timer: ReturnType<typeof setTimeout> | null = null;
let latest: GameState | null = null;

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

function save(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable: play on */
  }
}

export function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s?.version === 1) migrateV1(s);
    if (s?.version === 2) migrateV2(s);
    if (s?.version !== STATE_VERSION) return null;
    // Saves from before mission selection were Mars games.
    s.meta.missionId ??= 'mars-orbiter-lander';
    return s;
  } catch {
    return null;
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(KEY);
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

/** Science became an engineering tech tree (D-019): the old research projects, slice and test-unit links are dropped. */
function migrateV2(s: GameState): void {
  for (const a of s.market.allocations) delete (a as { projectId?: string }).projectId;
  s.research.projects = s.research.projects.filter((p) => p.techId);
  s.research.requests ??= [];
  s.research.access ??= {};
  s.science = initialScienceSlice();
  s.version = STATE_VERSION;
}
