// Science's part of the shared GameState. Owned by the science station.
// Research limits, unlocks, projects, requests and tech access are shared (core/model.ts ResearchState);
// this slice keeps what only science needs: which techs are researched and per-project notes.
import { START_TECHS } from './data/techs';

/** Science-only details of a ResearchProject (keyed by project id). */
export interface ProjectInfo {
  techId: string;
  /** Stopped by the lab (the shared status is then 'failed'). */
  cancelled?: boolean;
  /** Finished day (success, failure or cancel). */
  endedAt?: number;
  /** The project is paused (see pausedWhy). */
  paused?: boolean;
  /** Why it is paused: comms blocked the tech, or a facility from Procurement lapsed. */
  pausedWhy?: 'comms' | 'equipment';
}

export interface ScienceSlice {
  /** Research teams = projects that can run at the same time. */
  slots: number;
  /** Tech ids that are researched, including the starting techs. */
  researched: string[];
  /** Project id → details. */
  info: Record<string, ProjectInfo>;
}

/** The agency's own research teams. Procurement can hire up to three more (core/facilities.ts). */
export const INITIAL_SLOTS = 2;

export function initialScienceSlice(): ScienceSlice {
  return { slots: INITIAL_SLOTS, researched: [...START_TECHS], info: {} };
}
