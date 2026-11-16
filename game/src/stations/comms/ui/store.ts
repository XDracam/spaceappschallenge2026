// Comms UI glue: shared-state hooks (core/store) + UI-local state (selection, last
// outcome, open panels) that is never shared. Game changes go through commsActions.
import { createStore, useStore } from '../../../core/createStore';
import { confirmedGameStore, gameStore, getState, onConfirmedAction, onGameReset, syncStore, useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import { missionById } from '../../../core/mission';
import type { MissionDef } from '../../planner/model/types';
import { computeMissionResult, inFlightCounted, isScrubbed, missionScore } from '../../planner/result';
import { commsActions } from '../logic';
import type { CommsSlice } from '../slice';
import {
  canAnswer, canStartProject, contentOf, getEventDef, isLaunched, projectSlots, type Content, type ProjectBlock,
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
  /** One local commitment at a time; completion feedback waits for the host. */
  pending: { type: 'answer'; instanceId: string; optionId: string } | { type: 'project'; defId: string } | null;
  feedback: string;
  /** The launch card was dismissed. */
  launchCardClosed: boolean;
  /** Messages this player has opened (unopened open ones are marked new). */
  opened: string[];
}
const initialUi = (): UiState => ({
  selectedInstanceId: null, devOpen: false, lastOutcome: null, projectPickerOpen: false, pending: null, feedback: '', launchCardClosed: false, opened: [],
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
  /** Revalidate the current shared state; show results only after the host applies it. */
  answer(instanceId: string, optionId: string): void {
    if (uiStore.get().pending) return;
    if (!syncStore.get().connected || !canAnswer(getState(), instanceId, optionId)) {
      uiStore.update(u => { u.feedback = 'Reply not sent. Check the current deadline, budget and host connection.'; });
      return;
    }
    uiStore.update(u => { u.pending = { type: 'answer', instanceId, optionId }; u.feedback = 'Sending reply — waiting for the host.'; });
    commsActions.answer(instanceId, optionId);
  },
  startProject(defId: string): void {
    if (uiStore.get().pending) return;
    if (!syncStore.get().connected || !canStartProject(getState(), defId).ok) {
      uiStore.update(u => { u.feedback = 'Project not started. Review its current requirements and host connection.'; });
      return;
    }
    uiStore.update(u => { u.pending = { type: 'project', defId }; u.feedback = 'Starting project — waiting for the host.'; });
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

// An optimistic client view is not an acceptance. Compute outcome lines against
// the host's actual previous state, including any teammate changes made en route.
onConfirmedAction(({ previous, state, action, local }) => {
  const pending = uiStore.get().pending;
  if (!local || !pending) return;
  if (pending.type === 'answer' && action.type === 'comms/answer'
    && action.args[0] === pending.instanceId && action.args[1] === pending.optionId) {
    const before = previous.comms.inbox.find(i => i.instanceId === pending.instanceId);
    const after = state.comms.inbox.find(i => i.instanceId === pending.instanceId);
    const option = before && getEventDef(before.eventId, contentOf(previous))?.options.find(o => o.id === pending.optionId);
    const applied = before?.status === 'open' && after?.status === 'answered' && after.chosenOptionId === pending.optionId && option;
    uiStore.update(u => {
      u.pending = null;
      u.feedback = applied ? 'Reply sent.' : 'Reply not applied. The message, budget or launch state changed; review it before trying again.';
      if (applied) u.lastOutcome = { instanceId: pending.instanceId, optionId: pending.optionId, text: option.outcome,
        lines: previewLines(previous, option.effects, { costM: option.costM, shield: !option.costM }) };
    });
  } else if (pending.type === 'project' && action.type === 'comms/startProject' && action.args[0] === pending.defId) {
    const applied = state.comms.projects.some(p => p.defId === pending.defId && !previous.comms.projects.some(old => old.instanceId === p.instanceId));
    uiStore.update(u => {
      u.pending = null;
      u.feedback = applied ? 'Project started.' : 'Project not started. The budget, slots or requirements changed; review them before trying again.';
      if (applied) u.projectPickerOpen = false;
    });
  }
});
syncStore.subscribe(() => {
  const sync = syncStore.get();
  if (uiStore.get().pending && (!sync.connected || sync.error)) {
    uiStore.update(u => { u.pending = null; u.feedback = sync.error ?? 'Connection to host lost. Reconnect and review the confirmed state before trying again.'; });
  }
});

// A resync replaces optimistic actions without an action echo. Reconcile after
// the normal synchronous confirmation callback has had first chance to report
// the precise outcome. Otherwise a dropped request would lock all commitments.
gameStore.subscribe(() => {
  if (!uiStore.get().pending || syncStore.get().role !== 'client') return;
  queueMicrotask(() => {
    const pending = uiStore.get().pending;
    if (!pending) return;
    const confirmed = confirmedGameStore.get();
    const view = getState();
    if (pending.type === 'answer') {
      const actual = confirmed.comms.inbox.find(i => i.instanceId === pending.instanceId);
      const shown = view.comms.inbox.find(i => i.instanceId === pending.instanceId);
      const accepted = actual?.status === 'answered' && actual.chosenOptionId === pending.optionId;
      const stillOptimistic = shown?.status === 'answered' && shown.chosenOptionId === pending.optionId;
      if (accepted || !stillOptimistic) uiStore.update(u => {
        u.pending = null;
        u.feedback = accepted ? 'Reply confirmed in the synchronized host state.'
          : 'The host synchronized the game without confirming this reply. Review the current message before sending again.';
      });
    } else {
      const accepted = confirmed.comms.projects.some(p => p.defId === pending.defId);
      const stillOptimistic = view.comms.projects.some(p => p.defId === pending.defId);
      if (accepted || !stillOptimistic) uiStore.update(u => {
        u.pending = null;
        u.feedback = accepted ? 'Project confirmed in the synchronized host state.'
          : 'The host synchronized the game without confirming this project. Review its requirements before starting again.';
        if (accepted) u.projectPickerOpen = false;
      });
    }
  });
});
