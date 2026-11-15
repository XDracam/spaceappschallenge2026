// Comms UI glue: shared-state hooks (core/store) + UI-local state (selection, last
// outcome, open panels) that is never shared. Game changes go through commsActions.
import { createStore, useStore } from '../../../core/createStore';
import { getState, onGameReset, useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import { missionById } from '../../../core/mission';
import type { MissionDef } from '../../planner/model/types';
import { computeMissionResult, inFlightCounted, isScrubbed, missionScore } from '../../planner/result';
import { commsActions } from '../logic';
import type { CommsSlice } from '../slice';
import {
  canStartProject, contentOf, getEventDef, isLaunched, projectSlots, type Content, type ProjectBlock,
} from '../state/world';
import { previewLines, type ChangeLine } from './common';

export { DAYS_PER_MONTH } from '../state/world';
/** The game's mission (from the shared state, so it follows the mission the host picked). */
export const useMission = (): MissionDef => missionById(useGame((s) => s.meta.missionId));
/** Mission start date (day 0 of the agency calendar). */
export const useStartISO = (): string => useMission().startDateISO;
/** Comms content (events, projects, cast) of the game's mission. */
export const useContent = (): Content => useGame(contentOf);

export interface UiState {
  selectedInstanceId: string | null;
  devOpen: boolean;
  /** Outcome text and what it changed (computed just before applying), shown after answering. */
  lastOutcome: { instanceId: string; optionId: string; text: string; lines: ChangeLine[] } | null;
  projectPickerOpen: boolean;
  /** The launch card was dismissed. */
  launchCardClosed: boolean;
  /** Messages this player has opened (unopened open ones are marked new). */
  opened: string[];
}
const initialUi = (): UiState => ({
  selectedInstanceId: null, devOpen: false, lastOutcome: null, projectPickerOpen: false, launchCardClosed: false, opened: [],
});
export const uiStore = createStore<UiState>(initialUi());
// A new attempt (restart, mission change, resumed save): selection, outcome, open panels
// and the launch card belong to the old game (playtest/packages/contract.md).
onGameReset(() => uiStore.set({ ...initialUi(), devOpen: uiStore.get().devOpen }));
export const useUi = <S,>(sel: (s: UiState) => S) => useStore(uiStore, sel);

/** Select from the comms slice of the shared state. */
export const useComms = <S,>(sel: (c: CommsSlice) => S) => useGame((s) => sel(s.comms));
/** Today on the shared agency calendar (whole days). */
export const useToday = () => useGame((s) => Math.floor(s.clock.day));
/** Available shared budget: fundingTotal − spent − committed. */
export const useBudgetLeft = () => useGame((s) => budgetAvailableM(s.budget));
export const useLaunched = () => useGame(isLaunched);
/** Launch day came but the launch was scrubbed (a part was missing): nothing flew. */
export const useScrubbed = () => useGame((s) => (s.meta.phase === 'launched' || s.meta.phase === 'finished') && isScrubbed(computeMissionResult(s)));
/** The launch flew but lost every goal before the in-flight events could happen. */
export const useFlightLost = () => useGame((s) => (s.meta.phase === 'launched' || s.meta.phase === 'finished') && !inFlightCounted(s) && !isScrubbed(computeMissionResult(s)));
/** Goals achieved of the mission's goals once launched (null before the launch). */
export const useGoalsAchieved = () => useGame((s) => {
  if (s.meta.phase !== 'launched' && s.meta.phase !== 'finished') return null;
  const r = missionScore(computeMissionResult(s));
  return `${r.achieved}/${r.total}`;
});

/** Player actions (dispatch shared reducers; UI-local bookkeeping). */
export const actions = {
  /** Answer an open inbox event; shows the option's outcome once the answer applied. */
  answer(instanceId: string, optionId: string): void {
    // What the option will change, in the numbers of the state it applies to.
    const before = getState();
    const pre = before.comms.inbox.find((i) => i.instanceId === instanceId);
    const option = pre && getEventDef(pre.eventId, contentOf(before))?.options.find((o) => o.id === optionId);
    if (!option) return;
    const lines = previewLines(before, option.effects, { costM: option.costM, shield: !option.costM });
    // Kept before dispatching: on a client the answer applies when the host's state arrives.
    // The conversation shows it only once the event is answered with this option.
    uiStore.set({ ...uiStore.get(), lastOutcome: { instanceId, optionId, text: option.outcome, lines } });
    commsActions.answer(instanceId, optionId);
  },
  startProject(defId: string): void {
    commsActions.startProject(defId);
  },
  /** Whether a project can start now; `reason` says why not (for disabling picker entries). */
  canStartProject(defId: string): { ok: boolean; reason?: ProjectBlock } {
    return canStartProject(getState(), defId);
  },
  /** Number of project slots. */
  projectSlots(): number {
    return projectSlots();
  },
  /** Select an inbox event; clears the last outcome when switching to another event. */
  select(instanceId: string | null): void {
    const ui = uiStore.get();
    const keep = ui.lastOutcome && ui.lastOutcome.instanceId === instanceId;
    const opened = instanceId && !ui.opened.includes(instanceId) ? [...ui.opened, instanceId] : ui.opened;
    uiStore.set({ ...ui, selectedInstanceId: instanceId, lastOutcome: keep ? ui.lastOutcome : null, opened });
  },
};
