// Comms UI glue: shared-state hooks (core/store) + UI-local state (selection, last
// outcome, open panels) that is never shared. Game changes go through commsActions.
import { createStore, useStore } from '../../../core/createStore';
import { getState, useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import { missionById } from '../../../core/mission';
import type { MissionDef } from '../../planner/model/types';
import { computeMissionResult, isScrubbed } from '../../planner/result';
import { commsActions } from '../logic';
import type { CommsSlice } from '../slice';
import {
  canStartProject, contentOf, getEventDef, isLaunched, projectSlotsFor, type Content, type ProjectBlock,
} from '../state/world';

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
  /** Outcome text shown after answering, until the next selection. */
  lastOutcome: { instanceId: string; text: string } | null;
  projectPickerOpen: boolean;
  /** The launch card was dismissed. */
  launchCardClosed: boolean;
}
const initialUi = (): UiState => ({
  selectedInstanceId: null, devOpen: false, lastOutcome: null, projectPickerOpen: false, launchCardClosed: false,
});
export const uiStore = createStore<UiState>(initialUi());
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

/** Player actions (dispatch shared reducers; UI-local bookkeeping). */
export const actions = {
  /** Answer an open inbox event; shows the option's outcome once the answer applied. */
  answer(instanceId: string, optionId: string): void {
    commsActions.answer(instanceId, optionId);
    const inst = getState().comms.inbox.find((i) => i.instanceId === instanceId);
    if (inst?.status !== 'answered' || inst.chosenOptionId !== optionId) return;
    const text = getEventDef(inst.eventId, contentOf(getState()))?.options.find((o) => o.id === optionId)?.outcome ?? '';
    uiStore.set({ ...uiStore.get(), lastOutcome: { instanceId, text } });
  },
  startProject(defId: string): void {
    commsActions.startProject(defId);
  },
  /** Whether a project can start now; `reason` says why not (for disabling picker entries). */
  canStartProject(defId: string): { ok: boolean; reason?: ProjectBlock } {
    return canStartProject(getState(), defId);
  },
  /** Number of project slots currently available (2, or 3 with any strong stakeholder). */
  projectSlots(): number {
    return projectSlotsFor(getState().comms.trust);
  },
  /** Select an inbox event; clears the last outcome when switching to another event. */
  select(instanceId: string | null): void {
    const ui = uiStore.get();
    const keep = ui.lastOutcome && ui.lastOutcome.instanceId === instanceId;
    uiStore.set({ ...ui, selectedInstanceId: instanceId, lastOutcome: keep ? ui.lastOutcome : null });
  },
};
