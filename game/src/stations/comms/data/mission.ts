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

/** Concurrent project slots: 2, a third when any stakeholder is strong. */
export const BASE_PROJECT_SLOTS = 2;
export const MAX_PROJECT_SLOTS = 3;
