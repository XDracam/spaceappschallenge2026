// The one shared GameState (D-015). The host holds the authoritative copy; every
// station replicates it by applying the same actions in the same order.
import type { Budget, Clock, EventsState, Market, Meta, ResearchState } from './model';
import { STATIONS } from './model';
import { DEFAULT_MISSION_ID, MISSION, setActiveMission } from './mission';
import { initialPlannerSlice, type PlannerSlice } from '../stations/planner/slice';
import { initialCommsSlice, type CommsSlice } from '../stations/comms/slice';
import { initialScienceSlice, type ScienceSlice } from '../stations/science/slice';
import { initialProcurementSlice, type ProcurementSlice } from '../stations/procurement/slice';

export const STATE_VERSION = 6;

export interface GameState {
  version: number;
  meta: Meta;
  clock: Clock;
  budget: Budget;
  market: Market;
  research: ResearchState;
  events: EventsState;
  planner: PlannerSlice;
  procurement: ProcurementSlice;
  science: ScienceSlice;
  comms: CommsSlice;
}

/** 1 real minute = 1 calendar month. */
export const DAYS_PER_MONTH = 30.44;
export const DEFAULT_DAYS_PER_SECOND = DAYS_PER_MONTH / 60;

export function createGame(seed: number, missionId: string = DEFAULT_MISSION_ID): GameState {
  // Slices below read the active MISSION, so switch it first.
  setActiveMission(missionId);
  return {
    version: STATE_VERSION,
    meta: {
      phase: 'lobby',
      missionId: MISSION.id,
      seed: seed >>> 0,
      rngCounter: 0,
      nextId: 1,
      seats: Object.fromEntries(STATIONS.map((s) => [s, { claimedBy: null }])) as Meta['seats'],
      attempt: 1,
      attempts: [],
    },
    clock: { day: 0, running: false, daysPerSecond: DEFAULT_DAYS_PER_SECOND },
    budget: { fundingTotalM: MISSION.budgetM, spentM: 0, committedM: 0 },
    market: { tasks: [], offers: [], calls: [], contracts: [], allocations: [], modifiers: [] },
    research: { limits: { ...MISSION.research }, unlocked: [...MISSION.unlocked], projects: [], modifiers: [], access: {} },
    events: { flags: [], news: [] },
    planner: initialPlannerSlice(),
    procurement: initialProcurementSlice(),
    science: initialScienceSlice(),
    comms: initialCommsSlice(),
  };
}

export function budgetAvailableM(b: Budget): number {
  return b.fundingTotalM - b.spentM - b.committedM;
}
