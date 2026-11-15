import type {
  Effect, EventDef, EventInstance, InFlightEventDef, NewsItem, StakeholderId, StationId,
} from '../../../shared/events/types';

export type { Effect, EventDef, EventInstance, InFlightEventDef, NewsItem, StakeholderId, StationId };

export interface Character {
  id: string;
  name: string;
  role: string;                 // "Senator, budget committee"
  stakeholder: StakeholderId;
  initials: string;
  /** File in public/portraits/ (square .webp); without one the avatar shows initials. */
  portrait?: string;
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
