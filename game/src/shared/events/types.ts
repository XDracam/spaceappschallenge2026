// Shared event system types — used by every station (see docs/design/events.md).
// Pure data; no framework imports. Units: days (agency calendar, day 0 = mission
// start), money M (millions).

export type StationId = 'planner' | 'procurement' | 'science' | 'comms';
export type StakeholderId = 'government' | 'industry' | 'public' | 'partners';

export const STAKEHOLDERS: StakeholderId[] = ['government', 'industry', 'public', 'partners'];

/**
 * What an event outcome or project result does. 'trust' is the only purely
 * external effect (comms-only); every other kind is internal: it touches the
 * mission or another station (see effectStations()).
 */
export type Effect =
  | { kind: 'trust'; stakeholder: StakeholderId; delta: number }
  | { kind: 'budget'; deltaM: number }
  /** Procurement: running or future deliveries slip (or arrive earlier when negative). */
  | { kind: 'deliveryDelay'; months: number; scope: 'all' | 'next' }
  /** Procurement: prices change by pct for a while. */
  | { kind: 'priceModifier'; pct: number; months: number }
  /** Procurement: a partner offers a part for the planner's task (procurement still signs). */
  | { kind: 'offer'; partKind: string; variant: string; supplier: string; priceM: number; deliveryMonths: number; reliability: number; note: string;
      /** Offered part's stats (stat keys as in mission-planner/procurement-interface.md), to compare with the task's minimums. */
      stats?: Record<string, number>;
      /** Offered part's dry mass in tonnes (estimated from partKind/variant when omitted). */
      massT?: number }
  /** Science: running research gets faster/slower. */
  | { kind: 'researchPace'; pct: number; months: number }
  /** Science + planner: a research limit rises (key `${kind}.${variant}.${stat}`). */
  | { kind: 'researchLimit'; key: string; value: number }
  /** Science + planner: a locked part variant becomes available (key `${kind}.${variant}`). */
  | { kind: 'unlock'; key: string }
  /** Science: a tech can (not) be researched. 'block' stops it (a running project pauses); 'enable' lifts a block or grants a required approval. */
  | { kind: 'techAccess'; tech: string; access: 'block' | 'enable'; note: string }
  /** Planner: a service that changes mission numbers (e.g. a partner ground station halves needed antenna rate). */
  | { kind: 'service'; service: 'groundStation' | 'launchSlot' | 'testFacility'; note: string }
  /** Planner: a new or changed mission requirement (extra payload, extra goal, flag on board). */
  | { kind: 'missionConstraint'; text: string }
  /** Any station: a state flag other events can trigger on (e.g. 'press.rtgStory'). */
  | { kind: 'flag'; flag: string; on: boolean }
  /** Comms: event odds for a tag change for a while (factor > 1 = more likely). External. */
  | { kind: 'eventOdds'; tag: string; factor: number; months: number };

/** Which stations an effect concerns. ['comms'] only = external. */
export function effectStations(e: Effect): StationId[] {
  switch (e.kind) {
    case 'trust':
    case 'eventOdds':
      return ['comms'];
    case 'budget':
      return ['planner', 'procurement', 'science', 'comms'];
    case 'deliveryDelay':
    case 'priceModifier':
    case 'offer':
      return ['procurement'];
    case 'researchPace':
    case 'techAccess':
      return ['science'];
    case 'researchLimit':
    case 'unlock':
      return ['science', 'planner'];
    case 'service':
    case 'missionConstraint':
      return ['planner'];
    case 'flag':
      return ['comms'];
  }
}

/** Internal = some effect touches a station other than comms. */
export function isInternal(effects: Effect[]): boolean {
  return effects.some((e) => effectStations(e).some((s) => s !== 'comms'));
}

/** Stations (other than comms) an effect list touches. */
export function affectedStations(effects: Effect[]): StationId[] {
  return [...new Set(effects.flatMap(effectStations))].filter((s) => s !== 'comms');
}

// ------------------------------------------------------------ conditions

/** Read-only snapshot of the shared game state that events can trigger on. */
export interface WorldView {
  day: number;
  launchDay: number;
  budgetM: number;          // remaining budget
  budgetTotalM: number;
  trust: Record<StakeholderId, number>;   // 0..100
  flags: string[];          // e.g. 'design.rtg', 'contract.late', 'research.failed'
}

export type Condition =
  | { kind: 'flag'; flag: string }
  | { kind: 'notFlag'; flag: string }
  | { kind: 'trustBelow'; stakeholder: StakeholderId; value: number }
  | { kind: 'trustAbove'; stakeholder: StakeholderId; value: number }
  | { kind: 'budgetBelow'; valueM: number }
  | { kind: 'dayAfter'; day: number }
  | { kind: 'all'; of: Condition[] }
  | { kind: 'any'; of: Condition[] };

// ---------------------------------------------------------------- events

export interface StakeholderHint {
  stakeholder: StakeholderId;
  /** −2..+2: ↓↓ ↓ ↑ ↑↑ shown on the option (hints, not numbers). */
  dir: -2 | -1 | 1 | 2;
}

export interface EventOption {
  id: string;
  text: string;                 // what the comms player says / does
  hints: StakeholderHint[];
  costM?: number;               // money spent immediately (also add a budget effect)
  effects: Effect[];            // applied on choice; internal if any effect leaves comms
  outcome: string;              // revealed after choosing
}

export type EventSource = 'timeline' | 'trigger' | 'pool' | 'player';

export interface EventDef {
  id: string;
  characterId: string;
  title: string;                // inbox one-liner
  message: string;              // character's message (quoted)
  options: EventOption[];       // 2–3
  ignored: { effects: Effect[]; outcome: string };
  deadlineDays: number;         // calendar days to answer
  source: EventSource;
  /** timeline: calendar day it arrives. */
  at?: number;
  /** trigger/player: fires once when this holds. */
  when?: Condition;
  /** pool: relative weight; scaled by trust via tags (see engine). */
  weight?: number;
  /** pool: only eligible while this holds. */
  eligible?: Condition;
  /** e.g. 'bad', 'opportunity', 'government', 'press' — event odds modifiers act on tags. */
  tags: string[];
  /** Station whose player decides (default 'comms'). */
  decidedBy?: StationId;
}

export interface EventInstance {
  instanceId: string;
  eventId: string;
  arrivedDay: number;
  deadlineDay: number;
  status: 'open' | 'answered' | 'expired';
  chosenOptionId?: string;
}

export interface NewsItem {
  id: string;
  day: number;
  from: StationId;
  text: string;
  affects: StationId[];
  internal: boolean;
}

// ------------------------------------------------------- in-flight events

/** Authored in-flight event: resolved automatically from the state at launch. Few and mild. */
export interface InFlightEventDef {
  id: string;
  station: StationId;
  title: string;
  /** Good outcome when this holds at launch. */
  goodIf: Condition;
  good: { text: string; goalChanceDelta: number };   // e.g. +0.03
  bad: { text: string; goalChanceDelta: number };    // mild, e.g. −0.05
}
