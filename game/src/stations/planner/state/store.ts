// Planner UI state access. Game state lives in the shared core store
// (core/store.ts); this module offers the planner-shaped view of it
// (stations/planner/derive.ts) plus the UI-local stores (selection, popups,
// map day, playthrough animation) that are never shared.
import type { Clock } from '../../../core/model';
import { gameStore, getState, onGameReset, useGame } from '../../../core/store';
import type { BodyId, Evaluation, Maneuver, PlannerGame, PlaythroughResult, Vec2 } from '../model/types';
import { findBranch } from '../model/rocketUtils';
import { cachedPlannerGame, evaluationOf } from '../derive';
import { plannerActions } from '../logic';
import { createStore, useStore } from '../../../core/createStore';

// ================================================================ UI store

export type SideTab = 'rocket' | 'versions';

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
  /** Playthrough animation (UI only; the result itself follows from the shared state). */
  playthrough: { result: PlaythroughResult; day: number; playing: boolean; daysPerSecond: number; finished: boolean } | null;
}

const initialUi = (): UiState => ({
  viewCenter: 'sun',
  selectedBranchId: 'branch-root',
  selectedManeuverId: null,
  hoverManeuverId: null,
  sideTab: 'rocket',
  popup: null,
  mapDay: null,
  playthrough: null,
});
export const uiStore = createStore<UiState>(initialUi());
onGameReset((state) => {
  const initial = initialUi();
  const game = cachedPlannerGame(state);
  initial.selectedBranchId = game.plan.branches[0]?.id ?? 'branch-root';
  initial.viewCenter = game.mission.goals.every((goal) => goal.body === 'earth') ? 'earth' : 'sun';
  uiStore.set(initial);
});

export function useUi<S>(selector: (u: UiState) => S): S {
  return useStore(uiStore, selector);
}

// ====================================================== shared game (planner view)

/** Planner-shaped view of the shared state (memoised on content). */
export function getPlanner(): PlannerGame {
  return cachedPlannerGame(getState());
}

/** Select from the planner view; re-renders only when the selected value changes. */
export function usePlanner<S>(selector: (g: PlannerGame) => S): S {
  return useGame((s) => selector(cachedPlannerGame(s)));
}

/** The shared calendar (host-driven; read only). */
export function useClock<S>(selector: (c: Clock) => S): S {
  return useGame((s) => selector(s.clock));
}
export function getClock(): Clock {
  return getState().clock;
}

/** Subscribe to every shared-state change (map redraws). */
export function subscribeGame(fn: () => void): () => void {
  return gameStore.subscribe(fn);
}

/** Live simulation test of the current design, memoised on the planner view. */
export function getEvaluation(): Evaluation {
  return evaluationOf(getPlanner());
}
export function useEvaluation(): Evaluation {
  return evaluationOf(usePlanner((g) => g));
}

// ================================================================ actions
// Thin UI wrappers around the shared planner reducers (plannerActions): they
// create ids the UI needs right away and update the UI-local selection.

let idCounter = 0;
const idBase = Math.random().toString(36).slice(2, 7);
/** Unique ids for objects created from the UI (maneuvers, branches, replacement parts). */
export function uiId(prefix: string): string {
  return `${prefix}-${idBase}${(idCounter++).toString(36)}`;
}

export const actions = {
  ...plannerActions,

  /** Append a maneuver (its ids come from the UI) and select it. */
  addManeuver(branchId: string, maneuver: Maneuver) {
    plannerActions.addManeuver(branchId, maneuver);
    uiStore.update((u) => {
      u.selectedManeuverId = maneuver.id;
    });
  },

  removeManeuver(maneuverId: string) {
    plannerActions.removeManeuver(maneuverId);
    uiStore.update((u) => {
      u.selectedManeuverId = null;
      if (u.popup && 'maneuverId' in u.popup && u.popup.maneuverId === maneuverId) u.popup = null;
      const plan = getPlanner().plan;
      if (!findBranch(plan, u.selectedBranchId)) u.selectedBranchId = plan.branches[0]?.id ?? 'branch-root';
    });
  },

  /** Replace a part with a new one (same values); returns the new part's id. */
  replacePart(partId: string, orderIt: boolean): string {
    const id = uiId('part');
    plannerActions.replacePart(partId, id, orderIt);
    return id;
  },

  /** Start (or resume) the playthrough animation from the shared mission result. */
  startPlaythrough(result: PlaythroughResult, finished = false) {
    const launchDay = getPlanner().plan.launchDay;
    uiStore.update((u) => {
      u.popup = null;
      u.mapDay = null;
      u.playthrough = { result, day: finished ? result.endDay : launchDay, playing: !finished, daysPerSecond: 60, finished };
    });
  },

  finishPlaythrough() {
    uiStore.update((u) => {
      if (!u.playthrough) return;
      u.playthrough.day = u.playthrough.result.endDay;
      u.playthrough.playing = false;
      u.playthrough.finished = true;
    });
  },
};

/** Advance the playthrough animation (called from the station's animation frame loop). */
export function stepPlaythrough(dtSeconds: number) {
  const pt = uiStore.get().playthrough;
  if (!pt || !pt.playing) return;
  const day = Math.min(pt.result.endDay, pt.day + dtSeconds * pt.daysPerSecond);
  uiStore.update((u) => {
    if (u.playthrough) u.playthrough.day = day;
  });
  if (day >= pt.result.endDay) actions.finishPlaythrough();
}
