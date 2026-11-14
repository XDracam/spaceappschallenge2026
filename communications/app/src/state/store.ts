// Comms station state + actions. API is a contract for the UI.
// Game rules live in ./world (pure, framework-free); this file wires them to stores,
// the requestAnimationFrame clock and localStorage persistence.

import type { CommsState, StakeholderId } from '../model/types';
import { MISSION } from '../data/mission';
import { createStore, useStore } from './createStore';
import {
  answerEvent, buildWorld, canStartProject, CONTENT, DAYS_PER_MONTH, deliverEvent, getEventDef,
  projectSlotsFor, startProjectIn, stepTo,
} from './world';
import type { ProjectBlock } from './world';
import type { WorldView } from '../../../../shared/events/types';

export { DAYS_PER_MONTH };
/** 1 real minute = 1 game month (same as the mission planner). */
export const DEFAULT_DAYS_PER_SECOND = DAYS_PER_MONTH / 60;

export function newState(): CommsState {
  return {
    missionName: MISSION.name,
    startDateISO: MISSION.startDateISO,
    launchDay: MISSION.launchDay,
    completionDeadlineDay: MISSION.completionDeadlineDay,
    budgetTotalM: MISSION.budgetTotalM,
    budgetM: MISSION.budgetTotalM,
    trust: { ...MISSION.startTrust },
    inbox: [], projects: [], modifiers: [], news: [], outbox: [],
    flags: [], fired: [], nextPoolDay: 20, phase: 'planning', inFlight: [],
    seed: 1, nextId: 1,
  };
}

export const commsStore = createStore<CommsState>(newState());

export interface ClockState { day: number; running: boolean; daysPerSecond: number }
export const clockStore = createStore<ClockState>({ day: 0, running: true, daysPerSecond: DEFAULT_DAYS_PER_SECOND });

export interface UiState {
  selectedInstanceId: string | null;
  devOpen: boolean;
  /** Outcome text shown after answering, until the next selection. */
  lastOutcome: { instanceId: string; text: string } | null;
  projectPickerOpen: boolean;
}
const initialUi = (): UiState => ({ selectedInstanceId: null, devOpen: false, lastOutcome: null, projectPickerOpen: false });
export const uiStore = createStore<UiState>(initialUi());

export const useComms = <S,>(sel: (s: CommsState) => S) => useStore(commsStore, sel);
export const useClock = <S,>(sel: (s: ClockState) => S) => useStore(clockStore, sel);
export const useUi = <S,>(sel: (s: UiState) => S) => useStore(uiStore, sel);

/** Shared-world snapshot at the current clock day (what event conditions see). */
export function currentWorld(): WorldView {
  return buildWorld(commsStore.get(), clockStore.get().day);
}

const freshSeed = () => Date.now() >>> 0;

/** Player actions. */
export const actions = {
  /** Answer an open inbox event with one of its options. */
  answer(instanceId: string, optionId: string): void {
    const draft = structuredClone(commsStore.get());
    const text = answerEvent(draft, instanceId, optionId, clockStore.get().day);
    if (text === null) return;
    commsStore.set(draft);
    uiStore.set({ ...uiStore.get(), lastOutcome: { instanceId, text } });
  },
  /** Start a project if a slot is free and budget allows. */
  startProject(defId: string): void {
    const draft = structuredClone(commsStore.get());
    if (startProjectIn(draft, defId, clockStore.get().day)) commsStore.set(draft);
  },
  /** Whether a project can start now; `reason` says why not (for disabling picker entries). */
  canStartProject(defId: string): { ok: boolean; reason?: ProjectBlock } {
    return canStartProject(commsStore.get(), defId);
  },
  /** Number of project slots currently available (2, or 3 with any strong stakeholder). */
  projectSlots(): number {
    return projectSlotsFor(commsStore.get().trust);
  },
  /** Select an inbox event; clears the last outcome when switching to another event. */
  select(instanceId: string | null): void {
    const ui = uiStore.get();
    const keep = ui.lastOutcome && ui.lastOutcome.instanceId === instanceId;
    uiStore.set({ ...ui, selectedInstanceId: instanceId, lastOutcome: keep ? ui.lastOutcome : null });
  },
  /** Advance the calendar; delivers due events, expires missed ones, finishes projects, launches at launch day. */
  advance(days: number): void {
    if (!(days > 0)) return;
    const s0 = commsStore.get();
    const clock = clockStore.get();
    if (s0.phase !== 'planning') return;
    const target = clock.day + days;
    const draft = structuredClone(s0);
    let day = clock.day;
    let changed = false;
    // Step across each calendar-day boundary so events are processed in day order.
    while (day < target) {
      day = Math.min(target, Math.floor(day) + 1);
      if (stepTo(draft, day)) changed = true;
      if (draft.phase !== 'planning') break;
    }
    if (changed) commsStore.set(draft);
    const launched = draft.phase !== 'planning';
    clockStore.set({ ...clockStore.get(), day, running: launched ? false : clockStore.get().running });
  },
  resetGame(): void {
    commsStore.set({ ...newState(), seed: freshSeed() });
    clockStore.set({ day: 0, running: true, daysPerSecond: clockStore.get().daysPerSecond });
    uiStore.set({ ...initialUi(), devOpen: uiStore.get().devOpen });
    saveNow();
  },
};

/** Dev stand-ins for the other stations (until stations connect, Q-012). */
export const devActions = {
  /** Raise/clear a shared-world flag; trigger events react on the next advance. */
  setFlag(flag: string, on: boolean): void {
    commsStore.update((s) => {
      s.flags = s.flags.filter((f) => f !== flag);
      if (on) s.flags.push(flag);
    });
  },
  setBudget(remainingM: number): void {
    commsStore.update((s) => { s.budgetM = remainingM; });
  },
  /** Move the planned launch (clamped to today or later). */
  setLaunchDay(day: number): void {
    const today = Math.ceil(clockStore.get().day);
    commsStore.update((s) => { s.launchDay = Math.max(Math.round(day), today); });
  },
  setTrust(s: StakeholderId, v: number): void {
    commsStore.update((st) => { st.trust[s] = Math.min(100, Math.max(0, v)); });
  },
  setRunning(running: boolean): void {
    clockStore.set({ ...clockStore.get(), running });
  },
  setSpeed(daysPerSecond: number): void {
    clockStore.set({ ...clockStore.get(), daysPerSecond: Math.max(0, daysPerSecond) });
  },
  /** Fire a specific event now (testing content), regardless of its conditions. */
  fireEvent(eventId: string): void {
    const def = getEventDef(eventId, CONTENT);
    if (!def) {
      console.warn(`[comms] unknown event ${eventId}`);
      return;
    }
    commsStore.update((s) => { deliverEvent(s, def, clockStore.get().day); });
  },
};

// ------------------------------------------------------------ persistence

const SAVE_KEY = 'comms.save.v1';
const SAVE_DELAY_MS = 1000;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

interface SaveData { v: 1; state: CommsState; day: number }

function saveNow(): void {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    const data: SaveData = { v: 1, state: commsStore.get(), day: clockStore.get().day };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable or full: play on without saving */
  }
}

/** Throttled save: at most one write per SAVE_DELAY_MS, always including the latest state. */
function scheduleSave(): void {
  if (saveTimer !== null) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow();
  }, SAVE_DELAY_MS);
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data?.v !== 1 || typeof data.day !== 'number' || !data.state || !Array.isArray(data.state.inbox)) return null;
    return { ...data, state: { ...newState(), ...data.state } };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ clock

let clockStarted = false;

/** Starts the requestAnimationFrame loop driving the calendar (loads the save first). */
export function startClock(): void {
  if (clockStarted) return;
  clockStarted = true;

  const saved = loadSave();
  if (saved) {
    commsStore.set(saved.state);
    clockStore.set({ ...clockStore.get(), day: saved.day, running: saved.state.phase === 'planning' });
  } else {
    commsStore.set({ ...commsStore.get(), seed: freshSeed() });
  }
  commsStore.subscribe(scheduleSave);
  clockStore.subscribe(scheduleSave);
  if (typeof window !== 'undefined') window.addEventListener('pagehide', saveNow);

  let last: number | null = null;
  const frame = (now: number) => {
    // Cap the step so a backgrounded tab does not jump months on return.
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.25);
    last = now;
    const clock = clockStore.get();
    if (clock.running && dt > 0 && commsStore.get().phase === 'planning') actions.advance(dt * clock.daysPerSecond);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Flags the other stations would raise; offered as toggles in the dev drawer. */
export const STAND_IN_FLAGS: { flag: string; label: string; station: 'planner' | 'procurement' | 'science' }[] = [
  { flag: 'design.rtg', label: 'Planner: RTG in the design', station: 'planner' },
  { flag: 'design.ion', label: 'Planner: ion engine in the design', station: 'planner' },
  { flag: 'plan.launchMoved', label: 'Planner: launch date moved', station: 'planner' },
  { flag: 'contract.late', label: 'Procurement: a delivery is late', station: 'procurement' },
  { flag: 'contract.cancelled', label: 'Procurement: a contract was cancelled', station: 'procurement' },
  { flag: 'contract.cheapest', label: 'Procurement: cheapest bid chosen', station: 'procurement' },
  { flag: 'research.failed', label: 'Science: a research project failed', station: 'science' },
  { flag: 'research.breakthrough', label: 'Science: research breakthrough', station: 'science' },
];
