import type {
  BodyId, Contract, Evaluation, GameState, Maneuver, MissionDef, Part, PartKind, PayloadType,
  PlaythroughResult, PropulsionId, Rocket, SavedVersion, Spacecraft, Stage, Vec2,
} from '../model/types';
import { DEFAULT_DAYS_PER_SECOND } from '../model/units';
import { allParts, findBranch, findManeuver, findPart, findSpacecraft, findStage } from '../model/rocketUtils';
import {
  PAYLOAD_TYPE_LABEL, beyondResearch, defaultStats, derivedMassT, makePart, makeSpacecraft, makeStage, partName, statDefs,
} from '../data/parts';
import { MARS_ORBITER_LANDER } from '../data/missions/marsOrbiterLander';
import { evaluate, playthrough } from '../physics';
import { createStore, useStore } from './createStore';

// ================================================================== stores

const SAVE_KEY = 'mission-planner.save.v3';

function newGame(mission: MissionDef): GameState {
  return {
    mission,
    rocket: structuredClone(mission.initialRocket),
    plan: structuredClone(mission.initialPlan),
    tasks: [],
    contracts: [],
    research: { ...mission.research },
    unlocked: [...mission.unlocked],
    versions: [],
    phase: 'planning',
    playthroughSeed: 1,
    nextId: 1,
  };
}

function loadSaved(): { game: GameState; day: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { game: GameState; day: number };
    if (parsed?.game?.mission?.id !== MARS_ORBITER_LANDER.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

const saved = loadSaved();

export const gameStore = createStore<GameState>(saved?.game ?? newGame(MARS_ORBITER_LANDER));

export interface ClockState {
  day: number;              // agency calendar day (fractional)
  running: boolean;
  daysPerSecond: number;    // default: 1 real minute = 1 month
}

export const clockStore = createStore<ClockState>({
  day: saved?.day ?? 0,
  // The agency calendar runs with play time; pausing is a dev control only.
  running: true,
  daysPerSecond: DEFAULT_DAYS_PER_SECOND,
});

export type SideTab = 'rocket' | 'tasks' | 'versions' | 'dev';

export type Popup =
  | null
  /** Maneuver-type menu opened by clicking the end state of a branch on the map. */
  | { kind: 'maneuverMenu'; branchId: string; screen: Vec2 }
  /** Slider popup for an existing maneuver, opened by clicking its marker. */
  | { kind: 'maneuverEdit'; maneuverId: string; screen: Vec2 }
  /** Delta-v heat map (departure date x travel time) for a transfer maneuver. */
  | { kind: 'heatmap'; maneuverId: string };

export interface UiState {
  /** Centre of the map view: 'sun' = system view; 'earth' | 'mars' | 'jupiter' = nested views. */
  viewCenter: BodyId;
  selectedBranchId: string;
  selectedManeuverId: string | null;
  hoverManeuverId: string | null;
  sideTab: SideTab;
  popup: Popup;
  /** Day the map shows body positions for. null = follow the agency calendar. */
  mapDay: number | null;
  /** Playthrough animation. */
  playthrough: { result: PlaythroughResult; day: number; playing: boolean; daysPerSecond: number } | null;
}

export const uiStore = createStore<UiState>({
  viewCenter: 'sun',
  selectedBranchId: 'branch-root',
  selectedManeuverId: null,
  hoverManeuverId: null,
  sideTab: 'rocket',
  popup: null,
  mapDay: null,
  playthrough: null,
});

// Autosave (per-viewer convenience; failures ignored).
let saveTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ game: gameStore.get(), day: clockStore.get().day }));
    } catch {
      /* storage unavailable */
    }
  }, 500);
}
gameStore.subscribe(scheduleSave);

// ============================================================== evaluation

let evalCache: { game: GameState; evaluation: Evaluation } | null = null;

/** Live simulation test of the current game state, memoised on state identity. */
export function getEvaluation(): Evaluation {
  const game = gameStore.get();
  if (!evalCache || evalCache.game !== game) evalCache = { game, evaluation: evaluate(game) };
  return evalCache.evaluation;
}

export function useGame<S>(selector: (g: GameState) => S): S {
  return useStore(gameStore, selector);
}
export function useUi<S>(selector: (u: UiState) => S): S {
  return useStore(uiStore, selector);
}
export function useClock<S>(selector: (c: ClockState) => S): S {
  return useStore(clockStore, selector);
}
export function useEvaluation(): Evaluation {
  useStore(gameStore, (g) => g);
  return getEvaluation();
}

// ================================================================= helpers

function nid(g: GameState, prefix: string): string {
  return `${prefix}-${g.nextId++}`;
}

/** Id generator bound to a draft, for physics.createManeuver etc. */
export function idGen(g: GameState): (prefix: string) => string {
  return (prefix) => nid(g, prefix);
}

function today(): number {
  return clockStore.get().day;
}

function editable(p: Part): boolean {
  return p.state === 'draft' || p.state === 'sent';
}

function clampStat(part: Part, key: string, value: number): number {
  const def = statDefs(part.kind, part.variant).find((d) => d.key === key);
  if (!def) return value;
  return Math.min(def.max, Math.max(def.min, value));
}

/** Cancel the open task of a part that leaves the design (does not touch contracts). */
function dropOpenTask(g: GameState, part: Part) {
  const task = g.tasks.find((t) => t.id === part.taskId);
  if (task && (task.status === 'open' || task.status === 'changed')) {
    task.status = 'cancelled';
    task.updatedDay = today();
  }
}

function forEachPartIn(stage: Stage, fn: (p: Part) => void) {
  fn(stage.engine);
  stage.tanks.forEach(fn);
}

function versionSummary(game: GameState): SavedVersion['summary'] {
  const e = evaluate(game);
  return {
    totalMassT: e.totalMassT,
    totalCostM: e.totalCostM,
    goalChances: Object.fromEntries(e.goals.map((r) => [r.goalId, r.successChance])),
    failed: e.branches.some((b) => b.failedAtManeuverId !== undefined),
  };
}

function snapshot(g: GameState, name: string): SavedVersion {
  return {
    id: nid(g, 'ver'),
    name,
    savedDay: today(),
    rocket: structuredClone(g.rocket),
    plan: structuredClone(g.plan),
    summary: versionSummary(g),
  };
}

// ============================================================ rocket design

export const actions = {
  setPartStat(partId: string, key: string, value: number) {
    gameStore.update((g) => {
      const loc = findPart(g.rocket, partId);
      if (!loc || !editable(loc.part)) return;
      loc.part.stats[key] = clampStat(loc.part, key, value);
      if (loc.part.state === 'sent') {
        const task = g.tasks.find((t) => t.id === loc.part.taskId);
        if (task) {
          task.minimums = { ...loc.part.stats };
          task.beyondResearch = beyondResearch(loc.part, g.research, g.unlocked);
          task.status = 'changed';
          task.updatedDay = today();
        }
      }
    });
  },

  setEngineCount(stageId: string, count: number) {
    gameStore.update((g) => {
      const s = findStage(g.rocket, stageId);
      if (!s || !editable(s.stage.engine)) return;
      s.stage.engineCount = Math.max(1, Math.min(30, Math.round(count)));
    });
  },

  /** Switch a stage's propulsion type. Only while engine and tanks are drafts. */
  setStagePropulsion(stageId: string, propulsion: PropulsionId) {
    gameStore.update((g) => {
      const s = findStage(g.rocket, stageId);
      if (!s) return;
      const st = s.stage;
      if (st.engine.state !== 'draft' || st.tanks.some((t) => t.state !== 'draft')) return;
      st.propulsion = propulsion;
      const engine = makePart(st.engine.id, 'engine', propulsion);
      st.engine = engine;
      st.tanks = st.tanks.map((t) => {
        const nt = makePart(t.id, 'tank', propulsion);
        nt.stats.fuelT = clampStat(nt, 'fuelT', t.stats.fuelT);
        return nt;
      });
    });
  },

  renameStage(stageId: string, name: string) {
    gameStore.update((g) => {
      const s = findStage(g.rocket, stageId);
      if (s) s.stage.name = name;
    });
  },

  /** Add a stage to the rocket (owner 'rocket', added on top of existing rocket stages) or to a spacecraft. */
  addStage(owner: 'rocket' | string, propulsion: PropulsionId) {
    gameStore.update((g) => {
      const gen = idGen(g);
      if (owner === 'rocket') {
        g.rocket.stages.push(makeStage(gen, `Stage ${g.rocket.stages.length + 1}`, propulsion));
      } else {
        const sc = findSpacecraft(g.rocket, owner);
        if (sc) sc.stages.push(makeStage(gen, `${sc.name} stage ${sc.stages.length + 1}`, propulsion));
      }
    });
  },

  removeStage(stageId: string) {
    gameStore.update((g) => {
      const remove = (stages: Stage[]) => {
        const i = stages.findIndex((s) => s.id === stageId);
        if (i >= 0) {
          forEachPartIn(stages[i], (p) => dropOpenTask(g, p));
          stages.splice(i, 1);
        }
      };
      remove(g.rocket.stages);
      g.rocket.spacecraft.forEach((sc) => remove(sc.stages));
    });
  },

  /** Move a stage one position (rocket stages: -1 = toward the bottom / fires earlier). */
  moveStage(stageId: string, dir: -1 | 1) {
    gameStore.update((g) => {
      for (const stages of [g.rocket.stages, ...g.rocket.spacecraft.map((s) => s.stages)]) {
        const i = stages.findIndex((s) => s.id === stageId);
        const j = i + dir;
        if (i >= 0 && j >= 0 && j < stages.length) [stages[i], stages[j]] = [stages[j], stages[i]];
      }
    });
  },

  addTank(stageId: string) {
    gameStore.update((g) => {
      const s = findStage(g.rocket, stageId);
      if (s) s.stage.tanks.push(makePart(nid(g, 'part'), 'tank', s.stage.propulsion));
    });
  },

  addSpacecraft(payloadType: PayloadType) {
    gameStore.update((g) => {
      const sc = makeSpacecraft(idGen(g), PAYLOAD_TYPE_LABEL[payloadType], payloadType);
      g.rocket.spacecraft.push(sc);
      // New spacecraft joins the root branch (attached until separated).
      g.plan.branches[0]?.spacecraftIds.push(sc.id);
    });
  },

  renameSpacecraft(id: string, name: string) {
    gameStore.update((g) => {
      const sc = findSpacecraft(g.rocket, id);
      if (sc) sc.name = name;
    });
  },

  setPayloadType(id: string, payloadType: PayloadType) {
    gameStore.update((g) => {
      const sc = findSpacecraft(g.rocket, id);
      if (sc) sc.payloadType = payloadType;
    });
  },

  removeSpacecraft(id: string) {
    gameStore.update((g) => {
      const sc = findSpacecraft(g.rocket, id);
      if (!sc) return;
      sc.equipment.forEach((p) => dropOpenTask(g, p));
      sc.stages.forEach((st) => forEachPartIn(st, (p) => dropOpenTask(g, p)));
      g.rocket.spacecraft = g.rocket.spacecraft.filter((s) => s.id !== id);
      for (const b of g.plan.branches) {
        b.spacecraftIds = b.spacecraftIds.filter((s) => s !== id);
        for (const m of b.maneuvers) if (m.type === 'separate') m.spacecraftIds = m.spacecraftIds.filter((s) => s !== id);
      }
    });
  },

  addEquipment(spacecraftId: string, kind: PartKind, variant: string) {
    gameStore.update((g) => {
      const sc = findSpacecraft(g.rocket, spacecraftId);
      if (sc) sc.equipment.push(makePart(nid(g, 'part'), kind, variant));
    });
  },

  /** Remove an equipment part or a tank. Engines go with their stage (removeStage). */
  removePart(partId: string) {
    gameStore.update((g) => {
      const loc = findPart(g.rocket, partId);
      if (!loc || loc.role === 'engine') return;
      dropOpenTask(g, loc.part);
      if (loc.role === 'tank' && loc.stage) {
        if (loc.stage.tanks.length <= 1) return;
        loc.stage.tanks = loc.stage.tanks.filter((t) => t.id !== partId);
      } else if (loc.spacecraft) {
        loc.spacecraft.equipment = loc.spacecraft.equipment.filter((p) => p.id !== partId);
      }
    });
  },

  // ========================================================== procurement

  /** Send one part to procurement: its slider values become the task's minimums. */
  sendTask(partId: string) {
    gameStore.update((g) => {
      const loc = findPart(g.rocket, partId);
      if (!loc || loc.part.state !== 'draft') return;
      const p = loc.part;
      const task = {
        id: nid(g, 'task'),
        partId: p.id,
        partKind: p.kind,
        variant: p.variant,
        partName: p.name,
        minimums: { ...p.stats },
        beyondResearch: beyondResearch(p, g.research, g.unlocked),
        status: 'open' as const,
        neededByDay: g.plan.launchDay,
        createdDay: today(),
        updatedDay: today(),
      };
      g.tasks.push(task);
      p.state = 'sent';
      p.taskId = task.id;
    });
  },

  /**
   * Replace a contracted or delivered part: the design gets a new draft with the
   * same kind, variant and stats. The old contract keeps running (only
   * procurement can cancel it).
   */
  replacePart(partId: string) {
    gameStore.update((g) => {
      const loc = findPart(g.rocket, partId);
      if (!loc) return;
      const old = loc.part;
      if (old.state === 'sent') dropOpenTask(g, old);
      const fresh = makePart(nid(g, 'part'), old.kind, old.variant);
      fresh.stats = { ...old.stats };
      fresh.name = old.name;
      if (loc.role === 'engine' && loc.stage) loc.stage.engine = fresh;
      else if (loc.role === 'tank' && loc.stage) loc.stage.tanks = loc.stage.tanks.map((t) => (t.id === partId ? fresh : t));
      else if (loc.spacecraft) loc.spacecraft.equipment = loc.spacecraft.equipment.map((e) => (e.id === partId ? fresh : e));
    });
  },

  // ============================================================ versions

  saveVersion(name?: string) {
    gameStore.update((g) => {
      g.versions.push(snapshot(g, name || `Version ${g.versions.length + 1}`));
    });
  },

  /**
   * Restore a saved version's rocket and plan. Part states are re-derived from
   * tasks and contracts so procurement records stay consistent.
   */
  restoreVersion(versionId: string) {
    gameStore.update((g) => {
      const v = g.versions.find((x) => x.id === versionId);
      if (!v) return;
      g.rocket = structuredClone(v.rocket);
      g.plan = structuredClone(v.plan);
      g.plan.launchDay = Math.max(g.plan.launchDay, Math.ceil(today()));
      for (const { part } of allParts(g.rocket)) {
        const contract = g.contracts.find((c) => c.partId === part.id && c.status !== 'cancelled');
        const task = g.tasks.find((t) => t.partId === part.id && t.status !== 'cancelled');
        delete part.actualMassT;
        delete part.reliability;
        delete part.contractId;
        delete part.taskId;
        if (contract) {
          part.state = contract.status === 'delivered' ? 'delivered' : 'contracted';
          part.contractId = contract.id;
          part.taskId = contract.taskId;
          part.stats = { ...contract.actualStats };
          part.actualMassT = contract.actualMassT;
          part.reliability = contract.reliability;
        } else if (task) {
          part.state = 'sent';
          part.taskId = task.id;
        } else {
          part.state = 'draft';
        }
      }
    });
  },

  deleteVersion(versionId: string) {
    gameStore.update((g) => {
      g.versions = g.versions.filter((v) => v.id !== versionId);
    });
  },

  // ================================================================ plan

  setLaunchDay(day: number) {
    gameStore.update((g) => {
      g.plan.launchDay = Math.round(Math.min(g.mission.completionDeadlineDay, Math.max(Math.ceil(today()), day)));
      for (const t of g.tasks) if (t.status === 'open' || t.status === 'changed') t.neededByDay = g.plan.launchDay;
    });
  },

  /** Append a maneuver to a branch. A 'separate' maneuver also creates its new branch. */
  addManeuver(branchId: string, maneuver: Maneuver) {
    gameStore.update((g) => {
      const branch = findBranch(g.plan, branchId);
      if (!branch) return;
      branch.maneuvers.push(maneuver);
      if (maneuver.type === 'separate') {
        const names = maneuver.spacecraftIds.map((id) => findSpacecraft(g.rocket, id)?.name ?? id);
        g.plan.branches.push({
          id: maneuver.newBranchId,
          name: names.join(' + ') || 'Separated',
          spacecraftIds: [...maneuver.spacecraftIds],
          carriesRocketStages: false,
          parent: { branchId, maneuverId: maneuver.id },
          maneuvers: [],
        });
      }
    });
    uiStore.update((u) => {
      u.selectedManeuverId = maneuver.id;
    });
  },

  updateManeuver(maneuverId: string, patch: Partial<Maneuver>) {
    gameStore.update((g) => {
      const found = findManeuver(g.plan, maneuverId);
      if (!found) return;
      Object.assign(found.maneuver, patch, { id: maneuverId, type: found.maneuver.type });
      if (found.maneuver.type === 'separate') {
        const child = findBranch(g.plan, found.maneuver.newBranchId);
        if (child) {
          child.spacecraftIds = [...found.maneuver.spacecraftIds];
          child.name = child.spacecraftIds.map((id) => findSpacecraft(g.rocket, id)?.name ?? id).join(' + ') || 'Separated';
        }
      }
    });
  },

  /** Remove a maneuver and every later maneuver of its branch, plus branches split off by removed separations. */
  removeManeuver(maneuverId: string) {
    gameStore.update((g) => {
      const found = findManeuver(g.plan, maneuverId);
      if (!found) return;
      const removed = found.branch.maneuvers.splice(found.index);
      const dropBranches = new Set<string>();
      const collect = (ms: Maneuver[]) => {
        for (const m of ms) {
          if (m.type === 'separate' && !dropBranches.has(m.newBranchId)) {
            dropBranches.add(m.newBranchId);
            const child = findBranch(g.plan, m.newBranchId);
            if (child) collect(child.maneuvers);
          }
        }
      };
      collect(removed);
      g.plan.branches = g.plan.branches.filter((b) => !dropBranches.has(b.id));
    });
    uiStore.update((u) => {
      u.selectedManeuverId = null;
      if (u.popup && 'maneuverId' in u.popup && u.popup.maneuverId === maneuverId) u.popup = null;
      if (!findBranch(gameStore.get().plan, u.selectedBranchId)) u.selectedBranchId = gameStore.get().plan.branches[0].id;
    });
  },

  renameBranch(branchId: string, name: string) {
    gameStore.update((g) => {
      const b = findBranch(g.plan, branchId);
      if (b) b.name = name;
    });
  },

  // ================================================================ phase

  /** Move the launch date to today (next whole day) and launch immediately. */
  launchNow() {
    if (gameStore.get().phase !== 'planning') return;
    const day = Math.ceil(clockStore.get().day);
    gameStore.update((g) => {
      g.plan.launchDay = Math.min(day, g.mission.completionDeadlineDay);
    });
    clockActions.advance(gameStore.get().plan.launchDay - clockStore.get().day);
  },

  startPlaythrough() {
    clockStore.update((c) => {
      c.running = false;
    });
    gameStore.update((g) => {
      if (g.phase !== 'planning') return;
      g.phase = 'playthrough';
      g.playthroughSeed = Math.floor(Math.random() * 1e9);
    });
    const g = gameStore.get();
    const result = playthrough(g, getEvaluation(), g.playthroughSeed);
    uiStore.update((u) => {
      u.popup = null;
      u.playthrough = { result, day: g.plan.launchDay, playing: true, daysPerSecond: 60 };
    });
  },

  finishPlaythrough() {
    gameStore.update((g) => {
      g.phase = 'finished';
    });
    uiStore.update((u) => {
      if (u.playthrough) {
        u.playthrough.day = u.playthrough.result.endDay;
        u.playthrough.playing = false;
      }
    });
  },

  resetGame() {
    gameStore.set(newGame(MARS_ORBITER_LANDER));
    clockStore.set({ day: 0, running: true, daysPerSecond: DEFAULT_DAYS_PER_SECOND });
    uiStore.update((u) => {
      u.viewCenter = 'sun';
      u.selectedBranchId = 'branch-root';
      u.selectedManeuverId = null;
      u.popup = null;
      u.mapDay = null;
      u.playthrough = null;
    });
  },
};

// ===================================================== dev controls (stand-in roles)

export interface DevContractOptions {
  supplier: string;
  priceM: number;
  deliveryMonths: number;
  reliability: number;     // 0..1
  statBonusPct: number;    // real stats = minimums * (1 + bonus)
  massDeltaPct: number;    // real mass = derived mass * (1 + delta)
}

export const devActions = {
  /** Stand-in for procurement: contract an open task. */
  contractTask(taskId: string, o: DevContractOptions) {
    gameStore.update((g) => {
      const task = g.tasks.find((t) => t.id === taskId);
      if (!task || (task.status !== 'open' && task.status !== 'changed')) return;
      const loc = findPart(g.rocket, task.partId);
      const base: Part = loc ? loc.part : makePart(task.partId, task.partKind, task.variant);
      const actualStats: Record<string, number> = {};
      for (const [k, v] of Object.entries(task.minimums)) {
        const def = statDefs(task.partKind, task.variant).find((d) => d.key === k);
        const boosted = def?.step === 1 ? Math.round(v * (1 + o.statBonusPct / 100)) : v * (1 + o.statBonusPct / 100);
        actualStats[k] = def ? Math.min(def.max, boosted) : boosted;
      }
      const probe: Part = { ...base, stats: actualStats, actualMassT: undefined };
      const contract: Contract = {
        id: nid(g, 'contract'),
        taskId,
        partId: task.partId,
        supplier: o.supplier,
        priceM: o.priceM,
        signedDay: today(),
        deliveryDay: today() + o.deliveryMonths * 30.44,
        reliability: o.reliability,
        actualStats,
        actualMassT: derivedMassT(probe) * (1 + o.massDeltaPct / 100),
        status: 'running',
        partSnapshot: structuredClone(base),
      };
      g.contracts.push(contract);
      task.status = 'contracted';
      task.updatedDay = today();
      if (loc && loc.part.state === 'sent') {
        loc.part.state = 'contracted';
        loc.part.contractId = contract.id;
        loc.part.stats = { ...actualStats };
        loc.part.actualMassT = contract.actualMassT;
        loc.part.reliability = contract.reliability;
      }
      contract.partSnapshot = structuredClone(loc ? loc.part : base);
    });
  },

  deliverContract(contractId: string) {
    gameStore.update((g) => deliver(g, contractId));
  },

  /** Only procurement can cancel. Refund falls from 50 % at signing to 0 % at delivery. */
  cancelContract(contractId: string) {
    gameStore.update((g) => {
      const c = g.contracts.find((x) => x.id === contractId);
      if (!c || c.status !== 'running') return;
      c.status = 'cancelled';
      c.refundM = cancellationRefundM(c, today());
      const task = g.tasks.find((t) => t.id === c.taskId);
      if (task) {
        task.status = 'cancelled';
        task.updatedDay = today();
      }
      const loc = findPart(g.rocket, c.partId);
      if (loc && loc.part.contractId === c.id) {
        loc.part.state = 'draft';
        delete loc.part.contractId;
        delete loc.part.taskId;
        delete loc.part.actualMassT;
        delete loc.part.reliability;
      }
    });
  },

  setResearchLimit(key: string, value: number) {
    gameStore.update((g) => {
      g.research[key] = value;
      refreshTaskResearch(g);
    });
  },

  clearResearchLimit(key: string) {
    gameStore.update((g) => {
      delete g.research[key];
      refreshTaskResearch(g);
    });
  },

  setUnlocked(key: string, unlocked: boolean) {
    gameStore.update((g) => {
      g.unlocked = unlocked ? [...new Set([...g.unlocked, key])] : g.unlocked.filter((k) => k !== key);
      refreshTaskResearch(g);
    });
  },
};

function refreshTaskResearch(g: GameState) {
  for (const t of g.tasks) {
    if (t.status !== 'open' && t.status !== 'changed') continue;
    const probe = makePart(t.partId, t.partKind, t.variant);
    probe.stats = { ...t.minimums };
    t.beyondResearch = beyondResearch(probe, g.research, g.unlocked);
  }
}

function deliver(g: GameState, contractId: string) {
  const c = g.contracts.find((x) => x.id === contractId);
  if (!c || c.status !== 'running') return;
  c.status = 'delivered';
  c.deliveryDay = Math.min(c.deliveryDay, today());
  const task = g.tasks.find((t) => t.id === c.taskId);
  if (task) {
    task.status = 'delivered';
    task.updatedDay = today();
  }
  const loc = findPart(g.rocket, c.partId);
  if (loc && loc.part.contractId === c.id) loc.part.state = 'delivered';
}

export function cancellationRefundM(c: Contract, day: number): number {
  const total = Math.max(1, c.deliveryDay - c.signedDay);
  const remaining = Math.max(0, c.deliveryDay - day);
  return c.priceM * 0.5 * Math.min(1, remaining / total);
}

/** Money committed: contract prices minus refunds. */
export function budgetSpentM(g: GameState): number {
  return g.contracts.reduce((s, c) => s + c.priceM - (c.refundM ?? 0), 0);
}

// ================================================================== clock

export const clockActions = {
  setRunning(running: boolean) {
    clockStore.update((c) => {
      c.running = running;
    });
  },
  setSpeed(daysPerSecond: number) {
    clockStore.update((c) => {
      c.daysPerSecond = daysPerSecond;
    });
  },
  /** Advance the calendar (dev control or the running clock). Delivers due contracts; launches at the launch date. */
  advance(days: number) {
    const g = gameStore.get();
    if (g.phase !== 'planning') return;
    const target = Math.min(clockStore.get().day + days, g.plan.launchDay);
    clockStore.update((c) => {
      c.day = target;
    });
    const due = g.contracts.filter((c) => c.status === 'running' && c.deliveryDay <= target);
    if (due.length) {
      gameStore.update((draft) => {
        for (const c of due) deliver(draft, c.id);
      });
    }
    if (target >= g.plan.launchDay - 1e-9) actions.startPlaythrough();
    else scheduleSave();
  },
};

let lastFrame = 0;
let started = false;

/** Start the requestAnimationFrame loop driving the agency calendar and the playthrough animation. */
export function startClock() {
  if (started) return;
  started = true;
  const frame = (t: number) => {
    const dt = lastFrame ? Math.min(0.25, (t - lastFrame) / 1000) : 0;
    lastFrame = t;
    const c = clockStore.get();
    if (c.running && gameStore.get().phase === 'planning') clockActions.advance(dt * c.daysPerSecond);
    const pt = uiStore.get().playthrough;
    if (pt && pt.playing) {
      const day = Math.min(pt.result.endDay, pt.day + dt * pt.daysPerSecond);
      uiStore.update((u) => {
        if (u.playthrough) u.playthrough.day = day;
      });
      if (day >= pt.result.endDay) actions.finishPlaythrough();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Re-exports used by UI code.
export { defaultStats, partName };
export type { Rocket, Spacecraft };
