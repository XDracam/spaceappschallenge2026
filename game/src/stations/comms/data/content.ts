// Hand-authored comms content (D-005): Mars orbiter + lander mission.
//
// Structure (one file per kind, all under src/data/):
// - characters.ts       recurring cast, one face per stakeholder (+ a university dean)
// - eventsTimeline.ts   source 'timeline': fixed calendar days (`at`), day 15 to 1100
// - eventsTriggered.ts  source 'player': other stations' shared flags (s.events.flags);
//                       source 'trigger': trust / budget thresholds. Each fires once.
// - eventsPool.ts       source 'pool': random draws by `weight`, gated by `eligible`;
//                       tags = stakeholder ids + 'bad' | 'opportunity' (+ topic tags
//                       'press', 'protest', 'funding', 'audit', 'politics' that
//                       eventOdds effects target)
// - projects.ts         proactive projects: galas, campaigns, lobbying, negotiations
// - inFlight.ts         auto-resolved at launch from trust/flags; mild (±0.05)
// - helpers.ts          effect/condition builders; option() derives the ↑/↓ hints
//                       from the option's trust effects (|net| >= 10 → ±2).
//
// Flags raised by this content: 'press.rtgStory' (plutonium story ran unanswered),
// 'comms.groundStation' (partner dish deal done). Texts: messages ≤ 3 sentences,
// options ≤ 12 words (teammate impact named in brackets), outcomes 1–2 sentences.
import type { EventDef } from '../model/types';
import { POOL_EVENTS } from './eventsPool';
import { TIMELINE_EVENTS } from './eventsTimeline';
import { PLAYER_EVENTS, TRIGGER_EVENTS } from './eventsTriggered';

export { CHARACTERS } from './characters';
export { PROJECTS } from './projects';
export { IN_FLIGHT } from './inFlight';

export const EVENTS: EventDef[] = [...TIMELINE_EVENTS, ...PLAYER_EVENTS, ...TRIGGER_EVENTS, ...POOL_EVENTS];
