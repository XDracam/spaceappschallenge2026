import type {
  Effect, EventDef, EventInstance, InFlightEventDef, NewsItem, StakeholderId, StationId,
} from '../../../../shared/events/types';

export type { Effect, EventDef, EventInstance, InFlightEventDef, NewsItem, StakeholderId, StationId };

export interface Character {
  id: string;
  name: string;
  role: string;                 // "Senator, budget committee"
  stakeholder: StakeholderId;
  initials: string;
}

export type ProjectKind = 'gala' | 'campaign' | 'lobbying' | 'negotiation';

export interface ProjectDef {
  id: string;
  name: string;
  kind: ProjectKind;
  description: string;
  costM: number;
  months: number;               // duration on the agency calendar
  /** Trust change applied when the project starts (side costs, e.g. Government −5 for a foreign deal). */
  startTrust: { stakeholder: StakeholderId; delta: number }[];
  /** Needs this trust level to be offered. */
  requires?: { stakeholder: StakeholderId; min: number };
  /** Applied when the project finishes. */
  effects: Effect[];
  result: string;               // news text when finished
  partnerCharacterId?: string;
}

export interface ActiveProject {
  instanceId: string;
  defId: string;
  startDay: number;
  endDay: number;
}

/** A temporary modifier from an effect with a duration (price, pace, event odds). */
export interface ActiveModifier {
  effect: Extract<Effect, { months: number }>;
  untilDay: number;
}

/** Internal effects sent to other stations (stand-in until stations connect, Q-012). */
export interface OutboxItem {
  id: string;
  day: number;
  to: StationId[];
  effect: Effect;
  source: string;               // event or project name
}

export type Phase = 'planning' | 'launched';

export interface CommsState {
  missionName: string;
  startDateISO: string;
  launchDay: number;            // stand-in for the shared plan
  completionDeadlineDay: number;
  budgetTotalM: number;
  budgetM: number;              // remaining (stand-in for the shared budget)
  trust: Record<StakeholderId, number>;
  inbox: EventInstance[];
  projects: ActiveProject[];
  modifiers: ActiveModifier[];
  news: NewsItem[];
  outbox: OutboxItem[];
  /** Flags from the shared world (other stations' state; stand-ins set in the dev drawer). */
  flags: string[];
  /** Event ids already fired (timeline/trigger/player fire once). */
  fired: string[];
  /** Day the next pool draw is due. */
  nextPoolDay: number;
  phase: Phase;
  /** In-flight events resolved at launch. */
  inFlight: { eventId: string; good: boolean }[];
  seed: number;
  nextId: number;
}
