// Host saves the authoritative state to localStorage (resume after a reload).
import { onHostState } from './store';
import { STATE_VERSION, type GameState } from './state';
import { recipeByKey } from '../stations/science/data/recipes';
import { fitFailures } from '../stations/procurement/rules';

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
    return s?.version === STATE_VERSION ? s : null;
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
  for (const [projectId, info] of Object.entries(s.science.info ?? {})) {
    if (!info.testTaskId) continue;
    const task = s.market.tasks.find(t => t.id === info.testTaskId);
    const criterion = task?.criteria[0];
    const recipe = recipeByKey(info.recipeKey);
    const requirement = recipe?.testPart ?? (criterion && ['instrument','power','antenna'].includes(criterion.partKind) ? {label:criterion.label, partKind:criterion.partKind as 'instrument'|'power'|'antenna', variant:criterion.variant, minimums:{...criterion.minimums}} : undefined);
    if (requirement) info.equipmentRequirement = structuredClone(requirement);
    const project = s.research.projects.find(p => p.id === projectId);
    for (const a of s.market.allocations.filter(a => a.taskId === info.testTaskId && a.status !== 'released')) {
      a.department = 'science'; a.taskId = ''; a.criterionId = ''; a.revision++;
      const k = s.market.contracts.find(k => k.id === a.contractId);
      if (!info.equipmentAllocationId && project?.status === 'running' && k && requirement && fitFailures(k.offerSnapshot.resource, {...requirement,id:'migration',quantity:1}).length === 0) {
        if (a.quantity > 1) {
          a.quantity--; const unit = {...a,id:`alloc-${s.meta.nextId++}`,revision:1,quantity:1,projectId}; s.market.allocations.push(unit); info.equipmentAllocationId = unit.id;
        } else { a.projectId = projectId; info.equipmentAllocationId = a.id; }
      }
    }
    if (task && task.status === 'open') { task.status='withdrawn'; task.revision++; }
    delete info.testTaskId;
  }
  s.version = STATE_VERSION;
}
