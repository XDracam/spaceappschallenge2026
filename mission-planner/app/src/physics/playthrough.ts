import type {
  BodyId, Evaluation, FlightState, GameState, ManeuverResult, PlaythroughEvent, PlaythroughResult, Vec2,
} from '../model/types';
import { BODIES } from '../data/bodies';
import { allParts } from '../model/rocketUtils';
import { bodyPosition } from './ephemeris';
import { internalFor, internalOf, type BranchInternal, type Factor, type GoalPick } from './evaluate';
import { lerp } from './vec';

// Final playthrough (seeded reliability rolls) and spacecraft positions for animation.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bodyName = (s: FlightState) => (s.kind === 'lost' ? '?' : BODIES[s.body].name);

function startText(r: ManeuverResult): string {
  const b = r.stateBefore;
  const a = r.stateAfter;
  switch (r.type) {
    case 'launch': return `Launch from ${bodyName(b)}`;
    case 'transfer': return `${r.label} departs`;
    case 'flyby': return `${r.label}: closest approach`;
    case 'insertion': return `In orbit around ${bodyName(a)}${r.label.includes('aerocapture') ? ' (aerocapture)' : ''}`;
    case 'land': return `Landed on ${bodyName(a)}`;
    case 'entry': return a.kind !== 'lost' && a.body === 'earth' ? 'Splashdown on Earth' : `Landed on ${bodyName(a)}`;
    case 'ascent': return `Lifted off from ${bodyName(b)}`;
    case 'separate': return r.label.replace(/^Separate:/, 'Separated:');
    case 'changeOrbit': return r.label;
  }
}

function arrivalText(r: ManeuverResult): string | null {
  if (r.type !== 'transfer' && r.type !== 'flyby') return null;
  const a = r.stateAfter;
  if (a.kind === 'orbit') return `Arrived in ${bodyName(a)} orbit`;
  return `Arrived at ${bodyName(a)}`;
}

export function playthrough(game: GameState, evaluation: Evaluation, seed: number): PlaythroughResult {
  const { internal } = internalFor(game, evaluation);
  const rand = mulberry32(seed);
  const events: PlaythroughEvent[] = [];
  const launchDay = game.plan.launchDay;
  const rootId = internal.rootId || game.plan.branches[0]?.id || '';
  const goalSuccess = new Map<string, boolean>();
  const goals = game.mission.goals;

  const finish = (): PlaythroughResult => {
    const sorted = events.map((e, i) => ({ e, i })).sort((x, y) => x.e.day - y.e.day || x.i - y.i).map((x) => x.e);
    const last = sorted.length ? Math.max(...sorted.map((e) => e.day)) : launchDay;
    return {
      events: sorted,
      goalOutcomes: goals.map((g) => ({ goalId: g.id, success: goalSuccess.get(g.id) ?? false })),
      endDay: last + 30,
    };
  };

  // Every part must be delivered before launch.
  const parts = allParts(game.rocket);
  const inDesign = new Set(parts.map((l) => l.part.id));
  const missing: string[] = [];
  for (const l of parts) if (l.part.state !== 'delivered') missing.push(l.part.name);
  for (const c of game.contracts) {
    if (c.status === 'running' && inDesign.has(c.partId) && c.deliveryDay > launchDay) {
      const name = parts.find((l) => l.part.id === c.partId)?.part.name ?? c.partSnapshot?.name ?? 'part';
      if (!missing.includes(name)) missing.push(name);
    }
  }
  if (missing.length) {
    const more = missing.length > 1 ? ` (and ${missing.length - 1} more part${missing.length > 2 ? 's' : ''})` : '';
    events.push({ day: launchDay, branchId: rootId, kind: 'failure', text: `Launch scrubbed: ${missing[0]} not delivered${more}` });
    return finish();
  }

  const rolled = new Map<string, boolean>();
  const roll = (f: Factor): boolean => {
    if (!rolled.has(f.partId)) rolled.set(f.partId, rand() < f.p);
    return rolled.get(f.partId)!;
  };
  const picksByManeuver = new Map<string, GoalPick[]>();
  for (const p of internal.picks.values()) {
    const list = picksByManeuver.get(p.maneuverId) ?? [];
    list.push(p);
    picksByManeuver.set(p.maneuverId, list);
  }
  const children = (branchId: string, maneuverId: string): BranchInternal[] =>
    [...internal.branches.values()].filter((b) => b.parentBranchId === branchId && b.parentManeuverId === maneuverId);

  const walk = (bi: BranchInternal) => {
    for (const step of bi.steps) {
      const r = step.result;
      const base = { branchId: bi.branchId, maneuverId: r.maneuverId };
      if (!r.ok) {
        const err = r.issues.find((i) => i.severity === 'error');
        events.push({ ...base, day: r.startDay, kind: 'failure', text: err ? err.message : `${r.label} failed` });
        return;
      }
      events.push({ ...base, day: r.startDay, kind: 'maneuver', text: startText(r) });
      for (const f of step.newFactors) {
        if (!roll(f)) {
          events.push({ ...base, day: r.startDay, kind: 'failure', text: `${f.name} failed during ${r.label}` });
          return;
        }
      }
      const arr = arrivalText(r);
      if (arr) events.push({ ...base, day: r.endDay, kind: 'maneuver', text: arr });
      for (const pick of picksByManeuver.get(r.maneuverId) ?? []) {
        if (pick.branchId !== bi.branchId) continue;
        const goal = goals.find((g) => g.id === pick.goalId);
        if (!goal) continue;
        const broken = pick.extra.find((f) => !roll(f));
        if (broken) {
          events.push({ ...base, day: pick.day, kind: 'failure', text: `${broken.name} failed: "${goal.name}" lost` });
        } else {
          goalSuccess.set(goal.id, true);
          events.push({ ...base, day: pick.day, kind: 'goal', text: `Goal achieved: ${goal.name}` });
        }
      }
      if (r.type === 'separate') for (const c of children(bi.branchId, r.maneuverId)) walk(c);
    }
  };
  const root = internal.branches.get(rootId);
  if (root) walk(root);
  return finish();
}

// ------------------------------------------------------------ positions

function statePosition(s: FlightState, day: number): { centerBody: BodyId; pos: Vec2 } | null {
  if (s.kind === 'lost') return null;
  return { centerBody: BODIES[s.body].parent ?? 'sun', pos: bodyPosition(s.body, day) };
}

export function spacecraftPositionAt(
  evaluation: Evaluation, branchId: string, day: number,
): { centerBody: BodyId; pos: Vec2 } | null {
  const br = evaluation.branches.find((b) => b.branchId === branchId);
  if (!br) return null;
  const bi = internalOf(evaluation)?.branches.get(branchId);
  if (bi?.parentBranchId) {
    const parent = evaluation.branches.find((b) => b.branchId === bi.parentBranchId);
    const sep = parent?.maneuvers.find((r) => r.maneuverId === bi.parentManeuverId);
    if (sep && day < sep.endDay) return spacecraftPositionAt(evaluation, bi.parentBranchId, day);
  } else if (!br.maneuvers.length || day < br.maneuvers[0].startDay) {
    return null; // root branch before launch
  }
  for (const r of br.maneuvers) {
    if (day < r.startDay) return statePosition(r.stateBefore, day);
    if (day <= r.endDay) {
      const t = r.trajectory;
      if (t && t.points.length > 1 && t.endDay > t.startDay) {
        const n = t.points.length;
        const x = ((day - t.startDay) / (t.endDay - t.startDay)) * (n - 1);
        const i = Math.max(0, Math.min(n - 2, Math.floor(x)));
        return { centerBody: t.centerBody, pos: lerp(t.points[i], t.points[i + 1], Math.max(0, Math.min(1, x - i))) };
      }
      return statePosition(day >= r.endDay ? r.stateAfter : r.stateBefore, day);
    }
  }
  return statePosition(br.finalState, day);
}
