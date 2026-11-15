// Hand-authored comms content (D-005), one set per mission. The comms rules
// (state/world.ts) and UI pick the set of the game's mission (s.meta.missionId).
//
// Structure (one folder per mission under data/, same files in each):
// - characters.ts        shared cast; each mission picks who appears (MARS_CAST, WEATHER_CAST, MOON_CAST)
// - <mission>/eventsTimeline.ts   source 'timeline': fixed calendar days (`at`)
// - <mission>/eventsTriggered.ts  source 'player': other stations' shared flags (s.events.flags);
//                                 source 'trigger': trust / budget / day thresholds. Each fires once.
// - <mission>/eventsPool.ts       source 'pool': random draws by `weight`, gated by `eligible`;
//                                 tags = stakeholder ids + 'bad' | 'opportunity' (+ topic tags
//                                 'press', 'protest', 'funding', 'audit', 'politics' that
//                                 eventOdds effects target)
// - <mission>/projects.ts         proactive projects: galas, campaigns, lobbying, negotiations
// - <mission>/inFlight.ts         auto-resolved at launch from trust/flags; mild (±0.05)
// - helpers.ts           effect/condition builders and content flags; option() derives
//                        the ↑/↓ hints from the option's trust effects (|net| >= 10 → ±2).
//
// Missions: 'mars-orbiter-lander' (data/mars/, long, budget 900 M), 'weather-geo'
// (data/weather/, short: launch ≈ day 150, budget ≈ 210 M, smaller amounts) and
// 'moon-lander' (data/moon/, medium: launch ≈ day 300, budget 260 M, small amounts).
// Flags raised by this content: 'press.rtgStory' (plutonium story ran unanswered),
// 'comms.groundStation' (partner ground-station deal done). Texts: messages ≤ 3
// sentences, options ≤ 12 words (teammate impact named in brackets), outcomes 1–2 sentences.
import type { Character, EventDef, InFlightEventDef, ProjectDef } from '../model/types';
import { MARS_CAST, MOON_CAST, WEATHER_CAST } from './characters';
import * as mars from './mars/index';
import * as moon from './moon/index';
import * as weather from './weather/index';

export { CHARACTERS } from './characters';

/** One mission's comms content. */
export interface Content {
  missionId: string;
  characters: Character[];
  events: EventDef[];
  projects: ProjectDef[];
  inFlight: InFlightEventDef[];
}

export const MARS_CONTENT: Content = {
  missionId: 'mars-orbiter-lander',
  characters: MARS_CAST,
  events: [...mars.TIMELINE_EVENTS, ...mars.PLAYER_EVENTS, ...mars.TRIGGER_EVENTS, ...mars.POOL_EVENTS],
  projects: mars.PROJECTS,
  inFlight: mars.IN_FLIGHT,
};

export const WEATHER_CONTENT: Content = {
  missionId: 'weather-geo',
  characters: WEATHER_CAST,
  events: [...weather.TIMELINE_EVENTS, ...weather.PLAYER_EVENTS, ...weather.TRIGGER_EVENTS, ...weather.POOL_EVENTS],
  projects: weather.PROJECTS,
  inFlight: weather.IN_FLIGHT,
};

export const MOON_CONTENT: Content = {
  missionId: 'moon-lander',
  characters: MOON_CAST,
  events: [...moon.TIMELINE_EVENTS, ...moon.PLAYER_EVENTS, ...moon.TRIGGER_EVENTS, ...moon.POOL_EVENTS],
  projects: moon.PROJECTS,
  inFlight: moon.IN_FLIGHT,
};

export const CONTENT_BY_MISSION: Record<string, Content> = {
  [MARS_CONTENT.missionId]: MARS_CONTENT,
  [WEATHER_CONTENT.missionId]: WEATHER_CONTENT,
  [MOON_CONTENT.missionId]: MOON_CONTENT,
};

/** Comms content of a mission. Unknown ids fall back to Mars, like core/mission.ts missionById(). */
export function contentFor(missionId: string | undefined): Content {
  return (missionId && CONTENT_BY_MISSION[missionId]) || MARS_CONTENT;
}
