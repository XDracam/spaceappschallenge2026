// Science's part of the shared GameState. Owned by the science station.
// Research limits, unlocks and projects are shared (core/model.ts ResearchState);
// this slice keeps science-only bookkeeping that other stations do not read.

/** How far a project reaches (draft step 1). */
export type ScopeId = 'safe' | 'balanced' | 'bold';
/** How a project gets its evidence (draft step 2). */
export type MethodId = 'archive' | 'new' | 'model';

/** Science-only details of a ResearchProject (keyed by project id). */
export interface ProjectInfo {
  /** Sorted field ids joined by '+' (a recipe key, or a long shot). */
  recipeKey: string;
  scope: ScopeId;
  method: MethodId;
  /** Shared Task science posted to Procurement for a test unit (method 'new'). */
  testTaskId?: string;
  /** Cancelled by science (the shared status is then 'failed'). */
  cancelled?: boolean;
  /** Finished day (success, failure or cancel). */
  endedAt?: number;
}

export interface ScienceSlice {
  /** Fields revealed from fog by research (field ids). Not used yet. */
  revealed: string[];
  /** Research teams = projects that can run at the same time. */
  slots: number;
  /** Recipe keys the team has found on the bench (the idea notebook). */
  discovered: string[];
  info: Record<string, ProjectInfo>;
}

export const INITIAL_SLOTS = 3;

export function initialScienceSlice(): ScienceSlice {
  return { revealed: [], slots: INITIAL_SLOTS, discovered: [], info: {} };
}
