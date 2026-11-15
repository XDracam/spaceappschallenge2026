import type { StakeholderId } from '../model/types';

// Comms-side mission numbers. Shared mission numbers (name, start date, budget,
// planned launch) come from core/mission.ts and the shared GameState.
export const MISSION = {
  startTrust: { government: 50, industry: 50, public: 50, partners: 50 } as Record<StakeholderId, number>,
};

/** Trust thresholds (proposal, baseline). */
export const TRUST_STRAINED = 30;
export const TRUST_STRONG = 70;

/** Pool pacing: about one event per real minute = one per game month. */
export const POOL_INTERVAL_DAYS = 30;

/**
 * Concurrent project slots. Was 2 + a third at strong trust; nobody opened the third
 * slot in four rounds (R1115d-r01-12), so it is gone with its locked-slot line.
 */
export const PROJECT_SLOTS = 2;

/**
 * A message whose answer changes another station's work stays open at least this
 * long (game days; 45 d = 90 s at 1 game month per real minute), so Comms can ask
 * the teammate it affects and still answer in time (R1115-r01-03: 25 d = 49 s was too short).
 */
export const TEAM_DEADLINE_DAYS = 45;
