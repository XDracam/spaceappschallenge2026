// Pure tech tree rules: layout, reveal (fog), status, who can start what, routes to a goal.
// Shared by the reducers (logic.ts) and the UI. No UI imports, no randomness.
import type { ResearchRequest, ResearchState, TechAccess } from '../../../core/model';
import type { GameState } from '../../../core/state';
import { budgetAvailableM } from '../../../core/state';
import { BRANCH_ORDER, TECHS, TECH_BY_ID } from '../data/techs';
import { covered, openRequests, running, sci } from './research';
import type { Branch, Tech, TechStatus, TreeLayout } from './types';

// ------------------------------------------------------------- layout

export const NODE_W = 178;
export const NODE_H = 54;
const COL = 224;
const ROW = 70;
const PAD_X = 40;
const LANE_PAD = 26;

function computeDepth(): Record<string, number> {
  const depth: Record<string, number> = {};
  const visit = (id: string): number => {
    if (id in depth) return depth[id];
    const t = TECH_BY_ID[id];
    depth[id] = t.requires.length === 0 ? 0 : 1 + Math.max(...t.requires.map(visit));
    return depth[id];
  };
  for (const t of TECHS) visit(t.id);
  return depth;
}

/** Columns = how many steps from the start, rows = branch lanes. Computed once, so the tree never moves. */
function computeLayout(): TreeLayout {
  const depth = computeDepth();
  const rows: Record<string, number> = {};
  const lanes: TreeLayout['lanes'] = [];
  const pos: TreeLayout['pos'] = {};
  let y = 0;
  let maxDepth = 0;
  for (const branch of BRANCH_ORDER) {
    const inBranch = TECHS.filter((t) => t.branch === branch);
    const perDepth: Record<number, number> = {};
    for (const t of inBranch) {
      rows[t.id] = perDepth[depth[t.id]] ?? 0;
      perDepth[depth[t.id]] = rows[t.id] + 1;
      maxDepth = Math.max(maxDepth, depth[t.id]);
    }
    const count = Math.max(...Object.values(perDepth));
    const h = count * ROW + LANE_PAD;
    for (const t of inBranch) pos[t.id] = { x: PAD_X + NODE_W / 2 + depth[t.id] * COL, y: y + LANE_PAD / 2 + ROW / 2 + rows[t.id] * ROW };
    lanes.push({ branch, y, h });
    y += h;
  }
  return { pos, width: PAD_X * 2 + NODE_W + maxDepth * COL, height: y, lanes, depth };
}

export const LAYOUT: TreeLayout = computeLayout();

// ------------------------------------------------------------- relations

/** Techs that list this tech as a prerequisite. */
export const DEPENDENTS: Record<string, string[]> = {};
for (const t of TECHS) DEPENDENTS[t.id] = [];
for (const t of TECHS) for (const r of t.requires) DEPENDENTS[r].push(t.id);

/** All techs this tech needs, directly or indirectly. */
export function ancestors(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (x: string) => { for (const r of TECH_BY_ID[x].requires) if (!out.has(r)) { out.add(r); walk(r); } };
  walk(id);
  return out;
}

/** Techs whose grants would meet a request. */
export function techsFor(key: string, value?: number): Tech[] {
  return TECHS.filter((t) => t.gives.some((g) => (value === undefined ? g.kind === 'unlock' && g.key === key : g.kind === 'limit' && g.key === key && g.value >= value - 1e-9)));
}

// ------------------------------------------------------------- state of a tech

export interface TechView {
  status: TechStatus;
  /** Comms blocks it, or it needs an approval comms has not given. */
  blocked: boolean;
  /** Why it is blocked (shown to the player). */
  blockedWhy?: string;
  /** Prerequisites not researched yet (ids). */
  missing: string[];
  /** A tech that is a stepping stone for a goal, or a goal itself. */
  goal: boolean;
}

/** Is the tech blocked by comms, or gated and not approved? */
export function blockInfo(t: Tech, access: Record<string, TechAccess> | undefined): { blocked: boolean; why?: string } {
  const a = access?.[t.id];
  if (a === 'blocked') return { blocked: true, why: 'Comms has blocked this tech.' };
  if (t.gate && a !== 'enabled') return { blocked: true, why: `${t.gate.why} Ask Comms to arrange it.` };
  return { blocked: false };
}

/** Techs that would raise something no longer worth raising: all their grants are already researched. */
export function isCovered(t: Tech, r: Pick<ResearchState, 'limits' | 'unlocked'>): boolean {
  return t.gives.length > 0 && t.gives.every((g) => (g.kind === 'unlock' ? covered(r, g.key) : covered(r, g.key, g.value)));
}

/** Goal techs: those that would meet an open request. */
export function goalTechIds(requests: ResearchRequest[]): Set<string> {
  const out = new Set<string>();
  for (const q of requests) if (q.status === 'open') for (const t of techsFor(q.key, q.value)) out.add(t.id);
  return out;
}

/** Steps from the researched set along prerequisites (0 = researched). Used for the fog. */
function distances(researched: Set<string>): Record<string, number> {
  const dist: Record<string, number> = {};
  const visit = (id: string): number => {
    if (id in dist) return dist[id];
    if (researched.has(id)) return (dist[id] = 0);
    const t = TECH_BY_ID[id];
    dist[id] = Infinity; // guard (the tree has no cycles)
    dist[id] = t.requires.length === 0 ? Infinity : 1 + Math.min(...t.requires.map(visit));
    return dist[id];
  };
  for (const t of TECHS) visit(t.id);
  return dist;
}

/** Fog: techs more than this many steps beyond the researched ones are shown as "?". */
export const REVEAL_STEPS = 2;

export function treeViews(g: GameState): Record<string, TechView> {
  const researched = new Set(sci(g).researched);
  const runningIds = new Set(running(g.research).map((p) => p.techId).filter(Boolean) as string[]);
  const goals = goalTechIds(g.research.requests ?? []);
  const dist = distances(researched);
  const out: Record<string, TechView> = {};
  for (const t of TECHS) {
    const missing = t.requires.filter((r) => !researched.has(r));
    const { blocked, why } = blockInfo(t, g.research.access);
    const isGoal = goals.has(t.id);
    let status: TechStatus;
    if (researched.has(t.id)) status = 'researched';
    else if (runningIds.has(t.id)) status = 'running';
    else if (!isGoal && dist[t.id] > REVEAL_STEPS) status = 'fog';
    else if (missing.length > 0) status = 'locked';
    else if (isCovered(t, g.research)) status = 'covered';
    else if (blocked) status = 'blocked';
    else status = 'available';
    out[t.id] = { status, blocked, blockedWhy: why, missing, goal: isGoal };
  }
  return out;
}

// ------------------------------------------------------------- starting a tech

export interface StartCheck { ok: boolean; reason: string | null }

/** Everything that can stop a project starting now. Used by the reducer and the inspector. */
export function startCheck(s: GameState, techId: string): StartCheck {
  const t = TECH_BY_ID[techId];
  const no = (reason: string): StartCheck => ({ ok: false, reason });
  if (!t || t.start) return no('Nothing to research.');
  if (s.meta.phase !== 'planning') return no(s.meta.phase === 'lobby' ? 'The game has not started.' : 'The mission has launched. Research is closed.');
  const researched = new Set(sci(s).researched);
  if (researched.has(techId)) return no('Already researched.');
  if (running(s.research).some((p) => p.techId === techId)) return no('A team is already working on it.');
  const missing = t.requires.filter((r) => !researched.has(r));
  if (missing.length) return no(`Needs ${missing.map((m) => TECH_BY_ID[m].name).join(' and ')} first.`);
  if (isCovered(t, s.research)) return no('Nothing left to gain: its results are already available.');
  const b = blockInfo(t, s.research.access);
  if (b.blocked) return no(b.why ?? 'Blocked.');
  if (running(s.research).length >= sci(s).slots) return no(`All ${sci(s).slots} research teams are busy.`);
  if (t.costM > budgetAvailableM(s.budget) + 1e-9) return no('Not enough budget available.');
  return { ok: true, reason: null };
}

/** Open requests a tech would help (its grants meet the request). */
export function requestsFor(t: Tech, requests: ResearchRequest[]): ResearchRequest[] {
  return requests.filter((q) => q.status === 'open' && techsFor(q.key, q.value).some((x) => x.id === t.id));
}

export { openRequests };
export const branchOf = (id: string): Branch => TECH_BY_ID[id].branch;
