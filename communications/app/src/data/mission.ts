import type { StakeholderId } from '../model/types';

// Mars orbiter + lander mission, comms side. Matches the mission planner's mission
// (start 1 Jan 2030, planned launch day 230 = 19 Aug 2030, deadline 1 Jul 2033, budget 900 M).
export const MISSION = {
  name: 'Mars orbiter + lander',
  startDateISO: '2030-01-01',
  launchDay: 230,
  completionDeadlineDay: 1277,
  budgetTotalM: 900,
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
