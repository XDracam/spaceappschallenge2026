// Planner station game logic: reducers (defineActions('planner', …)) and the launch
// tick handler. Imported eagerly by core/registerStations.ts — must not import UI code.
// Reducer rules (docs/design/integration.md): mutate only the draft, no
// Math.random / Date.now, ids the UI selects right away come in args.
import { defineActions, onTick, type ActionCtx, type Reducer } from '../../core/actions';
import { setFlag } from '../../core/coreActions';
import type { Task } from '../../core/model';
import type { GameState } from '../../core/state';
import { MISSION } from '../../core/mission';
import type { Maneuver, Part, PartKind, PayloadType, PropulsionId, SavedVersion, Stage } from './model/types';
import { allParts, findBranch, findManeuver, findPart, findSpacecraft, findStage } from './model/rocketUtils';
import { PAYLOAD_TYPE_LABEL, beyondResearch, makePart, makeSpacecraft, makeStage, statDefs } from './data/parts';
import { designFlags, partEditable, partProcurement, partStatus, plannerGame } from './derive';
import { evaluate } from './physics';
import { BODIES } from './data/bodies';

// ================================================================= helpers

function clampStat(part: Part, key: string, value: number): number {
  const def = statDefs(part.kind, part.variant).find((d) => d.key === key);
  if (!def || !Number.isFinite(value)) return part.stats[key];
  return Math.min(def.max, Math.max(def.min, value));
}

/** The planner's open task for a part, if any. */
function openTask(s: GameState, partId: string): Task | undefined {
  return s.market.tasks.find((t) => t.authorRole === 'planner' && t.partId === partId && t.status === 'open');
}

/** Engines are ordered per stage: quantity = engine count. */
function partQuantity(s: GameState, partId: string): number {
  const loc = findPart(s.planner.rocket, partId);
  return loc?.role === 'engine' && loc.stage ? loc.stage.engineCount : 1;
}

/** Ordered part edited: new revision with the current slider values / engine count. */
function reviseTask(s: GameState, ctx: ActionCtx, partId: string): void {
  const task = openTask(s, partId);
  const loc = findPart(s.planner.rocket, partId);
  if (!task || !loc) return;
  const crit = task.criteria[0];
  const quantity = partQuantity(s, partId);
  if (crit && JSON.stringify(crit.minimums) === JSON.stringify(loc.part.stats) && crit.quantity === quantity) return;
  if (crit) {
    crit.minimums = { ...loc.part.stats };
    crit.quantity = quantity;
  }
  task.beyondResearch = beyondResearch(loc.part, s.research.limits, s.research.unlocked);
  task.revision++;
  task.updatedAt = ctx.day;
}

/** A part leaves the design: withdraw its open task (contracts are procurement's; they keep running). */
function withdrawOpenTask(s: GameState, ctx: ActionCtx, partId: string): void {
  const task = openTask(s, partId);
  if (!task) return;
  task.status = 'withdrawn';
  task.revision++;
  task.updatedAt = ctx.day;
}

function stageParts(stage: Stage): Part[] {
  return [stage.engine, ...stage.tanks];
}

/** Create the shared Task for a draft part (D-006; docs/design/integration.md). */
function order(s: GameState, ctx: ActionCtx, partId: string): void {
  const loc = findPart(s.planner.rocket, partId);
  if (!loc || partStatus(s, partId) !== 'draft') return;
  const p = loc.part;
  s.market.tasks.push({
    id: ctx.newId('task'),
    revision: 1,
    authorRole: 'planner',
    title: p.name,
    criteria: [{
      id: ctx.newId('crit'),
      label: p.name,
      partKind: p.kind,
      variant: p.variant,
      minimums: { ...p.stats },
      quantity: partQuantity(s, partId),
    }],
    neededAt: s.planner.plan.launchDay,
    priority: 'normal',
    status: 'open',
    partId: p.id,
    beyondResearch: beyondResearch(p, s.research.limits, s.research.unlocked),
    createdAt: ctx.day,
    updatedAt: ctx.day,
  });
}

function setLaunch(s: GameState, ctx: ActionCtx, day: number): void {
  const prev = s.planner.plan.launchDay;
  const next = Math.round(Math.min(MISSION.completionDeadlineDay, Math.max(Math.ceil(ctx.day), day)));
  if (!Number.isFinite(next) || next === prev) return;
  s.planner.plan.launchDay = next;
  // A transfer from the launch body to one of its moons (Earth to the Moon) has no launch
  // window: it leaves any day, so it keeps its place right after the moved launch instead of
  // staying on the old date ("Departure before arrival in orbit"). Transfers to planets keep
  // their window dates.
  const root = s.planner.plan.branches[0]?.maneuvers[0];
  const home = root?.type === 'launch' ? root.body : undefined;
  for (const b of s.planner.plan.branches) {
    for (const m of b.maneuvers) {
      if (home && m.type === 'transfer' && BODIES[m.target]?.parent === home) m.departDay += next - prev;
    }
  }
  for (const t of s.market.tasks) {
    if (t.authorRole === 'planner' && t.status === 'open' && t.neededAt !== next) {
      t.neededAt = next;
      t.updatedAt = ctx.day;
    }
  }
  setFlag(s, 'plan.launchMoved', true);
}

/** Launch: the calendar stops (core tick only runs while planning); the result follows from this state. */
function launch(s: GameState, ctx: ActionCtx): void {
  if (s.meta.phase !== 'planning') return;
  s.meta.phase = 'launched';
  s.planner.playthroughSeed = Math.floor(ctx.rng() * 1e9);
}

function versionSummary(s: GameState): SavedVersion['summary'] {
  const e = evaluate(plannerGame(s));
  return {
    totalMassT: e.totalMassT,
    totalCostM: e.totalCostM,
    goalChances: Object.fromEntries(e.goals.map((r) => [r.goalId, r.successChance])),
    failed: e.branches.some((b) => b.failedAtManeuverId !== undefined),
  };
}

function syncDesignFlags(s: GameState): void {
  const f = designFlags(s.planner.rocket);
  const has = (flag: string) => s.events.flags.includes(flag);
  if (has('design.rtg') !== f.rtg) setFlag(s, 'design.rtg', f.rtg);
  if (has('design.ion') !== f.ion) setFlag(s, 'design.ion', f.ion);
}

/** Design reducers only act while planning; each keeps the shared design flags current. */
function planning<T extends Record<string, Reducer>>(defs: T): T {
  const out: Record<string, Reducer> = {};
  for (const [name, fn] of Object.entries(defs)) {
    out[name] = (s, ctx, ...args) => {
      if (s.meta.phase !== 'planning' && s.meta.phase !== 'lobby') return;
      fn(s, ctx, ...args);
      syncDesignFlags(s);
    };
  }
  return out as T;
}

// ================================================================ reducers

export const plannerActions = defineActions('planner', planning({
  // -------------------------------------------------------- rocket design

  setPartStat(s, ctx, partId: string, key: string, value: number) {
    const loc = findPart(s.planner.rocket, partId);
    if (!loc || !(key in loc.part.stats) || !partEditable(s, partId)) return;
    loc.part.stats[key] = clampStat(loc.part, key, value);
    reviseTask(s, ctx, partId);
  },

  setEngineCount(s, ctx, stageId: string, count: number) {
    const st = findStage(s.planner.rocket, stageId);
    if (!st || !partEditable(s, st.stage.engine.id) || !Number.isFinite(count)) return;
    st.stage.engineCount = Math.max(1, Math.min(30, Math.round(count)));
    reviseTask(s, ctx, st.stage.engine.id);
  },

  /** Switch a stage's propulsion type. Only while engine and tanks are drafts. */
  setStagePropulsion(s, _ctx, stageId: string, propulsion: PropulsionId) {
    const found = findStage(s.planner.rocket, stageId);
    if (!found) return;
    const st = found.stage;
    if (stageParts(st).some((p) => partStatus(s, p.id) !== 'draft')) return;
    st.propulsion = propulsion;
    st.engine = makePart(st.engine.id, 'engine', propulsion);
    st.tanks = st.tanks.map((t) => {
      const nt = makePart(t.id, 'tank', propulsion);
      nt.stats.fuelT = clampStat(nt, 'fuelT', t.stats.fuelT);
      return nt;
    });
  },

  renameStage(s, _ctx, stageId: string, name: string) {
    const st = findStage(s.planner.rocket, stageId);
    if (st && name.trim()) st.stage.name = name.trim();
  },

  /** Add a stage to the rocket (owner 'rocket', on top of the existing stages) or to a spacecraft. */
  addStage(s, ctx, owner: string, propulsion: PropulsionId) {
    const r = s.planner.rocket;
    if (owner === 'rocket') {
      r.stages.push(makeStage(ctx.newId, `Stage ${r.stages.length + 1}`, propulsion));
    } else {
      const sc = findSpacecraft(r, owner);
      if (sc) sc.stages.push(makeStage(ctx.newId, `${sc.name} stage ${sc.stages.length + 1}`, propulsion));
    }
  },

  removeStage(s, ctx, stageId: string) {
    const r = s.planner.rocket;
    const remove = (stages: Stage[]) => {
      const i = stages.findIndex((st) => st.id === stageId);
      if (i < 0) return;
      for (const p of stageParts(stages[i])) withdrawOpenTask(s, ctx, p.id);
      stages.splice(i, 1);
    };
    remove(r.stages);
    r.spacecraft.forEach((sc) => remove(sc.stages));
  },

  /** Move a stage one position (rocket stages: -1 = toward the bottom / fires earlier). */
  moveStage(s, _ctx, stageId: string, dir: -1 | 1) {
    const r = s.planner.rocket;
    for (const stages of [r.stages, ...r.spacecraft.map((sc) => sc.stages)]) {
      const i = stages.findIndex((st) => st.id === stageId);
      const j = i + dir;
      if (i >= 0 && j >= 0 && j < stages.length) [stages[i], stages[j]] = [stages[j], stages[i]];
    }
  },

  addSpacecraft(s, ctx, payloadType: PayloadType) {
    const sc = makeSpacecraft(ctx.newId, PAYLOAD_TYPE_LABEL[payloadType], payloadType);
    s.planner.rocket.spacecraft.push(sc);
    // A new spacecraft joins the root branch (attached until separated).
    s.planner.plan.branches[0]?.spacecraftIds.push(sc.id);
  },

  renameSpacecraft(s, _ctx, id: string, name: string) {
    const sc = findSpacecraft(s.planner.rocket, id);
    if (sc && name.trim()) sc.name = name.trim();
  },

  setPayloadType(s, _ctx, id: string, payloadType: PayloadType) {
    const sc = findSpacecraft(s.planner.rocket, id);
    if (sc) sc.payloadType = payloadType;
  },

  removeSpacecraft(s, ctx, id: string) {
    const r = s.planner.rocket;
    const sc = findSpacecraft(r, id);
    if (!sc) return;
    for (const p of sc.equipment) withdrawOpenTask(s, ctx, p.id);
    for (const st of sc.stages) for (const p of stageParts(st)) withdrawOpenTask(s, ctx, p.id);
    r.spacecraft = r.spacecraft.filter((x) => x.id !== id);
    for (const b of s.planner.plan.branches) {
      b.spacecraftIds = b.spacecraftIds.filter((x) => x !== id);
      for (const m of b.maneuvers) if (m.type === 'separate') m.spacecraftIds = m.spacecraftIds.filter((x) => x !== id);
    }
  },

  addEquipment(s, ctx, spacecraftId: string, kind: PartKind, variant: string) {
    const sc = findSpacecraft(s.planner.rocket, spacecraftId);
    if (sc) sc.equipment.push(makePart(ctx.newId('part'), kind, variant));
  },

  /** Remove an equipment part or a tank. Engines go with their stage (removeStage). */
  removePart(s, ctx, partId: string) {
    const loc = findPart(s.planner.rocket, partId);
    if (!loc || loc.role === 'engine') return;
    if (loc.role === 'tank' && loc.stage) {
      if (loc.stage.tanks.length <= 1) return;
      loc.stage.tanks = loc.stage.tanks.filter((t) => t.id !== partId);
    } else if (loc.spacecraft) {
      loc.spacecraft.equipment = loc.spacecraft.equipment.filter((p) => p.id !== partId);
    }
    withdrawOpenTask(s, ctx, partId);
  },

  // -------------------------------------------------------- procurement

  /** "Order part": a shared Task whose criterion minimums are the slider values. */
  orderPart(s, ctx, partId: string) {
    order(s, ctx, partId);
  },

  /** Order every draft part of the design. */
  orderAllParts(s, ctx) {
    for (const { part } of allParts(s.planner.rocket)) order(s, ctx, part.id);
  },

  /**
   * Replace a part (typically contracted / delivered / late): the design gets a new
   * draft part `newPartId` with the same kind, variant and values. The old contract
   * keeps running (only procurement cancels contracts). With `orderIt` the new
   * part is ordered right away (new Task).
   */
  replacePart(s, ctx, partId: string, newPartId: string, orderIt: boolean) {
    const loc = findPart(s.planner.rocket, partId);
    if (!loc || findPart(s.planner.rocket, newPartId)) return;
    const old = loc.part;
    withdrawOpenTask(s, ctx, partId);
    // The replacement keeps the values the planner asked for (the old task's minimums when contracted).
    const proc = partProcurement(s, partId);
    const fresh = makePart(newPartId, old.kind, old.variant);
    fresh.name = old.name;
    fresh.stats = { ...old.stats, ...(proc.task?.criteria[0]?.minimums ?? {}) };
    if (loc.role === 'engine' && loc.stage) loc.stage.engine = fresh;
    else if (loc.role === 'tank' && loc.stage) loc.stage.tanks = loc.stage.tanks.map((t) => (t.id === partId ? fresh : t));
    else if (loc.spacecraft) loc.spacecraft.equipment = loc.spacecraft.equipment.map((e) => (e.id === partId ? fresh : e));
    if (orderIt) order(s, ctx, newPartId);
  },

  // -------------------------------------------------------------- versions

  saveVersion(s, ctx, name?: string) {
    s.planner.versions.push({
      id: ctx.newId('ver'),
      name: name?.trim() || `Version ${s.planner.versions.length + 1}`,
      savedDay: ctx.day,
      rocket: structuredClone(s.planner.rocket),
      plan: structuredClone(s.planner.plan),
      summary: versionSummary(s),
    });
  },

  /**
   * Restore a saved version's rocket and plan. Part states follow the shared
   * market by part id, so contracted parts that are in the version stay
   * contracted; open tasks of parts that leave the design are withdrawn.
   */
  restoreVersion(s, ctx, versionId: string) {
    const v = s.planner.versions.find((x) => x.id === versionId);
    if (!v) return;
    const before = allParts(s.planner.rocket).map((l) => l.part.id);
    const prevLaunch = s.planner.plan.launchDay;
    s.planner.rocket = structuredClone(v.rocket);
    for (const { part } of allParts(s.planner.rocket)) {
      part.state = 'draft';
      delete part.taskId;
      delete part.contractId;
      delete part.actualMassT;
      delete part.reliability;
    }
    s.planner.plan = structuredClone(v.plan);
    const keep = new Set(allParts(s.planner.rocket).map((l) => l.part.id));
    for (const id of before) if (!keep.has(id)) withdrawOpenTask(s, ctx, id);
    // Ordered parts in the version: their tasks follow the restored values.
    for (const id of keep) if (openTask(s, id)) reviseTask(s, ctx, id);
    const restored = s.planner.plan.launchDay;
    s.planner.plan.launchDay = prevLaunch;
    setLaunch(s, ctx, restored);
  },

  deleteVersion(s, _ctx, versionId: string) {
    s.planner.versions = s.planner.versions.filter((v) => v.id !== versionId);
  },

  // ------------------------------------------------------------------ plan

  /** Planned launch day (shared): open planner tasks follow it (neededAt). */
  setLaunchDay(s, ctx, day: number) {
    setLaunch(s, ctx, day);
  },

  /** Append a maneuver (ids made by the UI). A 'separate' maneuver also creates its new branch. */
  addManeuver(s, _ctx, branchId: string, maneuver: Maneuver) {
    const plan = s.planner.plan;
    const branch = findBranch(plan, branchId);
    if (!branch || findManeuver(plan, maneuver.id)) return;
    branch.maneuvers.push(maneuver);
    if (maneuver.type === 'separate') {
      const names = maneuver.spacecraftIds.map((id) => findSpacecraft(s.planner.rocket, id)?.name ?? id);
      plan.branches.push({
        id: maneuver.newBranchId,
        name: names.join(' + ') || 'Separated',
        spacecraftIds: [...maneuver.spacecraftIds],
        carriesRocketStages: false,
        parent: { branchId, maneuverId: maneuver.id },
        maneuvers: [],
      });
    }
  },

  updateManeuver(s, _ctx, maneuverId: string, patch: Partial<Maneuver>) {
    const plan = s.planner.plan;
    const found = findManeuver(plan, maneuverId);
    if (!found) return;
    Object.assign(found.maneuver, patch, { id: maneuverId, type: found.maneuver.type });
    if (found.maneuver.type === 'separate') {
      const child = findBranch(plan, found.maneuver.newBranchId);
      if (child) {
        child.spacecraftIds = [...found.maneuver.spacecraftIds];
        child.name = child.spacecraftIds.map((id) => findSpacecraft(s.planner.rocket, id)?.name ?? id).join(' + ') || 'Separated';
      }
    }
  },

  /** Remove a maneuver and every later maneuver of its branch, plus branches split off by removed separations. */
  removeManeuver(s, _ctx, maneuverId: string) {
    const plan = s.planner.plan;
    const found = findManeuver(plan, maneuverId);
    if (!found) return;
    const removed = found.branch.maneuvers.splice(found.index);
    const drop = new Set<string>();
    const collect = (ms: Maneuver[]) => {
      for (const m of ms) {
        if (m.type === 'separate' && !drop.has(m.newBranchId)) {
          drop.add(m.newBranchId);
          const child = findBranch(plan, m.newBranchId);
          if (child) collect(child.maneuvers);
        }
      }
    };
    collect(removed);
    plan.branches = plan.branches.filter((b) => !drop.has(b.id));
  },

  renameBranch(s, _ctx, branchId: string, name: string) {
    const b = findBranch(s.planner.plan, branchId);
    if (b && name.trim()) b.name = name.trim();
  },

  // ----------------------------------------------------------------- phase

  /** Move the launch to today (next whole day) and launch now. */
  launchNow(s, ctx) {
    if (s.meta.phase !== 'planning') return;
    const day = Math.min(Math.ceil(ctx.day), MISSION.completionDeadlineDay);
    if (day !== s.planner.plan.launchDay) setLaunch(s, ctx, day);
    launch(s, ctx);
  },
}));

// ============================================================= calendar

onTick('planner', (s, ctx, _from, to) => {
  if (s.meta.phase === 'planning' && to >= s.planner.plan.launchDay) launch(s, ctx);
});
